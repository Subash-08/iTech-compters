// utils/FilterBuilder.js
const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const Category = require('../models/categoryModel');

class FilterBuilder {
    constructor(req) {
        this.req = req;
        this.query = req.query;

        // Put everything in $and from the start for consistency
        this.filter = {
            $and: [
                { isActive: true },
                { status: 'Published' }
            ]
        };
        this.searchTerm = null;
        this._cache = new Map(); // Simple request cache
    }

    /**
     * Normalize all parameter formats to be consistent
     */
    normalizeParams() {
        const normalized = { ...this.query };

        // Normalize category parameters
        if (normalized.category && !normalized.categories) {
            normalized.categories = normalized.category;
        }
        if (normalized.categories && !Array.isArray(normalized.categories)) {
            normalized.categories = [normalized.categories];
        }

        // Normalize brand parameters  
        if (normalized.brand && !normalized.brands) {
            normalized.brands = normalized.brand;
        }
        if (normalized.brands && !Array.isArray(normalized.brands)) {
            normalized.brands = [normalized.brands];
        }

        // Normalize search parameters
        if (normalized.q && !normalized.search) {
            normalized.search = normalized.q;
        }
        if (normalized.keyword && !normalized.search) {
            normalized.search = normalized.keyword;
        }

        return normalized;
    }

    /**
     * Cache expensive operations
     */
    async cachedOperation(key, operation) {
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }
        const result = await operation();
        this._cache.set(key, result);
        return result;
    }

    /**
     * Apply search with proper AND logic
     */
    async applySearch() {
        const params = this.normalizeParams();

        if (!params.search || params.search.trim() === '') {
            return this;
        }

        this.searchTerm = params.search.trim();

        // Try text search first
        const textSearchResults = await this.cachedOperation(
            `textSearch:${this.searchTerm}`,
            () => Product.find({
                ...this.getSimpleFilter(),
                $text: { $search: this.searchTerm }
            }).limit(1).lean()
        );

        if (textSearchResults.length > 0) {
            this.filter.$and.push({ $text: { $search: this.searchTerm } });
        } else {
            // Optimized regex search with only indexed fields
            const searchRegex = new RegExp(this.searchTerm, 'i');
            const searchConditions = {
                $or: [
                    { name: searchRegex }, // Indexed
                    { tags: searchRegex },  // Indexed
                    { 'variants.name': searchRegex } // Indexed
                ]
            };

            this.filter.$and.push(searchConditions);
        }

        return this;
    }

    /**
     * Apply all filters with proper AND logic
     */
    async applyFilters() {
        const params = this.normalizeParams();

        // Category filter
        if (params.categories && params.categories.length > 0) {
            const categoryIds = await this.resolveCategoryIds(params.categories);
            if (categoryIds.length > 0) {
                this.filter.$and.push({ categories: { $in: categoryIds } });
            }
        }

        // Brand filter
        if (params.brands && params.brands.length > 0) {
            const brandIds = await this.resolveBrandIds(params.brands);
            if (brandIds.length > 0) {
                this.filter.$and.push({ brand: { $in: brandIds } });
            }
        }

        // Price filter
        if (params.minPrice || params.maxPrice) {
            const priceCondition = await this.buildPriceCondition(
                params.minPrice,
                params.maxPrice
            );
            if (priceCondition) {
                this.filter.$and.push(priceCondition);
            }
        }

        // Stock filter
        if (params.inStock === 'true') {
            this.filter.$and.push({
                $or: [
                    { stockQuantity: { $gt: 0 } },
                    {
                        'variantConfiguration.hasVariants': true,
                        'variants': {
                            $elemMatch: {
                                isActive: true,
                                stockQuantity: { $gt: 0 }
                            }
                        }
                    }
                ]
            });
        }

        // Rating filter
        if (params.rating) {
            const minRating = Number(params.rating);
            if (!isNaN(minRating)) {
                this.filter.$and.push({ averageRating: { $gte: minRating } });
            }
        }

        // Condition filter
        if (params.condition) {
            this.filter.$and.push({ condition: params.condition });
        }

        return this;
    }

    /**
     * Build proper price condition that works with variants
     */
    async buildPriceCondition(minPrice, maxPrice) {
        const priceConditions = [];
        const min = minPrice ? Number(minPrice) : 0;
        const max = maxPrice ? Number(maxPrice) : Number.MAX_SAFE_INTEGER;

        if (isNaN(min) || isNaN(max)) {
            return null;
        }

        // Products without variants
        priceConditions.push({
            'variantConfiguration.hasVariants': false,
            'basePrice': { $gte: min, $lte: max }
        });

        // Products with variants - check variant prices
        priceConditions.push({
            'variantConfiguration.hasVariants': true,
            'variants': {
                $elemMatch: {
                    isActive: true,
                    price: { $gte: min, $lte: max }
                }
            }
        });

        return { $or: priceConditions };
    }

    /**
     * Resolve category names to IDs
     */
    async resolveCategoryIds(categoryNames) {
        try {
            const categories = await Category.find({
                $or: [
                    { name: { $in: categoryNames } },
                    { slug: { $in: categoryNames } }
                ]
            });
            return categories.map(cat => cat._id);
        } catch (error) {
            console.error('Error resolving category IDs:', error);
            return [];
        }
    }

    /**
     * Resolve brand names to IDs
     */
    async resolveBrandIds(brandNames) {
        try {
            const brands = await Brand.find({
                $or: [
                    { name: { $in: brandNames } },
                    { slug: { $in: brandNames } }
                ]
            });
            return brands.map(brand => brand._id);
        } catch (error) {
            console.error('Error resolving brand IDs:', error);
            return [];
        }
    }

    /**
     * Get price range - fixed logic
     */
    async getPriceRange(useCurrentFilters = false) {
        let baseFilter = {
            isActive: true,
            status: 'Published'
        };

        if (useCurrentFilters) {
            // Use current filters but remove price-related ones
            const currentFilter = this.getFilter();
            baseFilter = { ...currentFilter };

            // Remove ONLY price filters, keep search and other filters
            if (baseFilter.$and) {
                baseFilter.$and = baseFilter.$and.filter(condition => {
                    if (condition.$or) {
                        const hasPriceCondition = condition.$or.some(cond =>
                            cond.basePrice || cond['variants.price']
                        );
                        return !hasPriceCondition;
                    }
                    return true;
                });

                if (baseFilter.$and.length === 0) {
                    delete baseFilter.$and;
                }
            }
        } else {
            // Base range: only route-level filters
            const params = this.normalizeParams();

            if (params.categories && params.categories.length > 0) {
                const categoryIds = await this.resolveCategoryIds(params.categories);
                if (categoryIds.length > 0) {
                    baseFilter.categories = { $in: categoryIds };
                }
            }

            if (params.brands && params.brands.length > 0) {
                const brandIds = await this.resolveBrandIds(params.brands);
                if (brandIds.length > 0) {
                    baseFilter.brand = { $in: brandIds };
                }
            }
        }

        const priceStats = await Product.aggregate([
            { $match: baseFilter },
            {
                $project: {
                    prices: {
                        $cond: {
                            if: { $eq: ['$variantConfiguration.hasVariants', true] },
                            then: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$variants',
                                            as: 'variant',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$variant.isActive', true] },
                                                    { $gt: ['$$variant.price', 0] }
                                                ]
                                            }
                                        }
                                    },
                                    as: 'variant',
                                    in: '$$variant.price'
                                }
                            },
                            else: ['$basePrice']
                        }
                    }
                }
            },
            { $unwind: '$prices' },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$prices' },
                    maxPrice: { $max: '$prices' }
                }
            }
        ]);

        return priceStats.length > 0 ? {
            min: Math.floor(priceStats[0].minPrice || 0),
            max: Math.ceil(priceStats[0].maxPrice || 0)
        } : { min: 0, max: 0 };
    }

    /**
     * Get available filters
     */
    async getAvailableFilters(useCurrentFilters = false) {
        let baseFilter = {
            isActive: true,
            status: 'Published'
        };

        if (useCurrentFilters) {
            // Use current filters but remove price and search
            const currentFilter = this.getFilter();
            baseFilter = { ...currentFilter };

            if (baseFilter.$and) {
                baseFilter.$and = baseFilter.$and.filter(condition => {
                    // Remove price conditions
                    if (condition.$or) {
                        const hasPriceCondition = condition.$or.some(cond =>
                            cond.basePrice || cond['variants.price']
                        );
                        return !hasPriceCondition;
                    }
                    // Remove search conditions
                    return !condition.$text &&
                        !condition.name &&
                        !condition.description &&
                        !condition.tags;
                });

                if (baseFilter.$and.length === 0) {
                    delete baseFilter.$and;
                }
            }

            delete baseFilter.$text;
            delete baseFilter.name;
            delete baseFilter.description;
            delete baseFilter.tags;
        } else {
            // Base filters: only route-level
            const params = this.normalizeParams();

            if (params.categories && params.categories.length > 0) {
                const categoryIds = await this.resolveCategoryIds(params.categories);
                if (categoryIds.length > 0) {
                    baseFilter.categories = { $in: categoryIds };
                }
            }

            if (params.brands && params.brands.length > 0) {
                const brandIds = await this.resolveBrandIds(params.brands);
                if (brandIds.length > 0) {
                    baseFilter.brand = { $in: brandIds };
                }
            }
        }

        // Single aggregation pipeline for performance
        const filterAggregation = await Product.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: '$brand',
                    brandCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brandData'
                }
            },
            { $unwind: '$brandData' },
            {
                $project: {
                    _id: 0,
                    brand: {
                        _id: '$brandData._id',
                        name: '$brandData.name',
                        slug: '$brandData.slug',
                        count: '$brandCount'
                    }
                }
            }
        ]);

        const availableBrands = filterAggregation.map(item => item.brand);

        // Get categories separately for simplicity
        const availableCategories = await Product.aggregate([
            { $match: baseFilter },
            { $unwind: '$categories' },
            { $group: { _id: '$categories' } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            { $unwind: '$categoryData' },
            {
                $project: {
                    _id: '$categoryData._id',
                    name: '$categoryData.name',
                    slug: '$categoryData.slug'
                }
            }
        ]);

        // Get conditions
        const conditions = await Product.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: '$condition',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    value: '$_id',
                    label: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        return {
            brands: availableBrands,
            categories: availableCategories,
            conditions
        };
    }

    /**
     * Get total count - optimized
     */
    async getTotalCount() {
        const filter = this.getFilter();

        // Use estimatedDocumentCount for better performance when possible
        const hasComplexFilters = filter.$and || filter.$or || filter.$text;

        if (!hasComplexFilters) {
            return await Product.estimatedDocumentCount(filter);
        }

        // For complex filters, use countDocuments
        return await Product.countDocuments(filter);
    }

    /**
     * Get simple filter (without $and) for basic queries
     */
    getSimpleFilter() {
        const simpleFilter = {};
        this.filter.$and.forEach(cond => {
            Object.assign(simpleFilter, cond);
        });
        return simpleFilter;
    }

    /**
     * Get the filter for MongoDB queries
     */
    getFilter() {
        // Simplify if only basic filters
        if (this.filter.$and.length <= 2) {
            return this.getSimpleFilter();
        }

        return this.filter;
    }

    /**
     * Build the final MongoDB query
     */
    buildQuery() {
        return Product.find(this.getFilter());
    }

    /**
     * Get search term for response
     */
    getSearchTerm() {
        return this.searchTerm;
    }
}

module.exports = FilterBuilder;