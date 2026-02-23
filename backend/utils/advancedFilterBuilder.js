const Brand = require('../models/brandModel');
const Category = require('../models/categoryModel');

class AdvancedFilterBuilder {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr || {};
        this.mainPipeline = [];
        this.countPipeline = [];
        this.metadataPipeline = [];
        this.paginationInfo = { page: 1, limit: 12, skip: 0 };

        // 🧠 Store filter stages to apply them selectively in facets later
        this.brandMatch = null;
        this.categoryMatch = null;
    }

    async buildCompletePipeline() {
        // Reset pipelines
        this.mainPipeline = [];
        this.countPipeline = [];
        this.metadataPipeline = [];

        const initialProjection = {
            $project: {
                // Basic Info
                _id: 1,
                name: 1,
                slug: 1,
                label: 1,
                definition: 1,
                description: 1,

                // Brand Info
                brand: 1,

                // Categories & Tags
                categories: 1,
                tags: 1,

                // Status & Condition
                condition: 1,
                isActive: 1,
                status: 1,

                // Pricing (for non-variant products)
                basePrice: 1,
                mrp: 1,
                taxRate: 1,
                effectivePrice: { $cond: { if: { $gt: ['$mrp', 0] }, then: '$basePrice', else: '$basePrice' } },

                // Stock
                stockQuantity: 1,
                hasStock: { $gt: ['$stockQuantity', 0] },

                // Images (include ALL image fields)
                images: 1,
                manufacturerImages: 1,

                // Variant Configuration
                variantConfiguration: 1,
                variants: 1,

                // Ratings & Reviews
                averageRating: 1,
                totalReviews: 1,

                // Specifications & Features
                specifications: 1,
                features: 1,

                // Dimensions & Weight
                dimensions: 1,
                weight: 1,

                // Warranty
                warranty: 1,

                // SEO & Meta
                meta: 1,
                canonicalUrl: 1,

                // Linked Products
                linkedProducts: 1,

                // Notes
                notes: 1,

                // Timestamps
                createdAt: 1,
                updatedAt: 1,

                // Additional fields for ProductCard
                hsn: 1,
                taxRate: 1,
                sku: 1,
                barcode: 1
            }
        };

        const baseMatch = { $match: { isActive: true, status: 'Published' } };

        // Push base stages to ALL pipelines
        [this.mainPipeline, this.countPipeline, this.metadataPipeline].forEach(pipeline => {
            pipeline.push(baseMatch, initialProjection);
        });

        // 2. Apply Basic Filters
        await this.applySearchFilter(); // Search applies to everything

        // 🚨 CRITICAL CHANGE: Brand and Category now filter Main/Count, but are stored for selective Metadata application
        await this.applyBrandFilter();
        await this.applyCategoryFilter();

        // Other filters apply globally to everything
        this.applyConditionFilter();
        this.applyRatingFilter();
        this.applyStockFilter();

        // 3. Add Effective Price to ALL pipelines
        this.addEffectivePriceStageToAll();

        // 4. Apply Price Filter (Does NOT apply to Metadata, handled separately)
        this.applyPriceFilter();

        // 5. Main Pipeline Specifics
        this.applySorting();
        this.applyPagination();
        this.addPopulationStagesToMain();

        // 6. Finalize Count Pipeline
        this.countPipeline.push({ $count: 'totalCount' });

        // 7. Build Metadata Pipeline (Now uses cross-filtering)
        this.buildMetadataPipeline();

        return {
            main: this.mainPipeline,
            count: this.countPipeline,
            metadata: this.metadataPipeline,
            pagination: this.paginationInfo
        };
    }

    addEffectivePriceStageToAll() {
        const priceCalculationStage = {
            $addFields: {
                effectivePrice: {
                    $let: {
                        vars: {
                            validVariants: {
                                $filter: {
                                    input: { $ifNull: ['$variants', []] },
                                    as: 'v',
                                    cond: {
                                        $and: [
                                            { $eq: ['$$v.isActive', true] },
                                            { $gt: ['$$v.price', 0] },
                                            { $gt: ['$$v.stockQuantity', 0] }
                                        ]
                                    }
                                }
                            }
                        },
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: ['$variantConfiguration.hasVariants', true] },
                                        { $gt: [{ $size: '$$validVariants' }, 0] }
                                    ]
                                },
                                then: { $min: '$$validVariants.price' },
                                else: {
                                    $cond: {
                                        if: { $gt: ['$basePrice', 0] },
                                        then: '$basePrice',
                                        else: 0
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        const taxInclusionStage = {
            $addFields: {
                taxInclusivePrice: {
                    $multiply: [
                        '$effectivePrice',
                        { $add: [1, { $divide: [{ $ifNull: ['$taxRate', 0] }, 100] }] }
                    ]
                }
            }
        };

        this.mainPipeline.push(priceCalculationStage, taxInclusionStage);
        this.countPipeline.push(priceCalculationStage, taxInclusionStage);
        this.metadataPipeline.push(priceCalculationStage, taxInclusionStage);
    }

    applyPriceFilter() {
        const minPriceRaw = this.queryStr['price[gte]'] || this.queryStr.minPrice;
        const maxPriceRaw = this.queryStr['price[lte]'] || this.queryStr.maxPrice;

        let effectiveMin = minPriceRaw ? Number(minPriceRaw) : null;
        let effectiveMax = maxPriceRaw ? Number(maxPriceRaw) : null;

        if (effectiveMin === null && effectiveMax === null) return;

        const priceMatch = {};
        if (effectiveMin !== null && !isNaN(effectiveMin)) priceMatch.$gte = effectiveMin;
        if (effectiveMax !== null && !isNaN(effectiveMax)) priceMatch.$lte = effectiveMax;

        if (Object.keys(priceMatch).length > 0) {
            const matchStage = { $match: { taxInclusivePrice: priceMatch } };
            // Apply ONLY to Main and Count
            this.mainPipeline.push(matchStage);
            this.countPipeline.push(matchStage);
            // Metadata ignores this to keep max price slider stable
        }
    }

    async applySearchFilter() {
        const searchTerm = this.queryStr.search || this.queryStr.keyword;
        if (!searchTerm || !searchTerm.trim()) return;

        const searchRegex = new RegExp(searchTerm.trim(), 'i');
        const matchStage = {
            $match: {
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { tags: { $elemMatch: { $regex: searchRegex } } },
                    { 'variants.name': searchRegex }
                ]
            }
        };

        [this.mainPipeline, this.countPipeline, this.metadataPipeline].forEach(p => p.push(matchStage));
    }

    async applyBrandFilter() {
        const brandParam = this.queryStr.brand;
        if (!brandParam) return;

        // ✅ FIX: Handle comma-separated strings (e.g., ?brand=Apple,Samsung)
        let brandNames = Array.isArray(brandParam) ? brandParam : [brandParam];
        brandNames = brandNames.flatMap(b => b.split(','));

        const brands = await Brand.find({
            $or: [
                { slug: { $in: brandNames.map(v => String(v).toLowerCase()) } },
                { name: { $in: brandNames.map(v => new RegExp(`^${this.escapeRegExp(String(v))}$`, 'i')) } }
            ]
        }).select('_id');

        const brandIds = brands.map(b => b._id);
        const matchStage = brands.length > 0
            ? { $match: { brand: { $in: brandIds } } }
            : { $match: { _id: null } };

        // Apply to Main and Count
        this.mainPipeline.push(matchStage);
        this.countPipeline.push(matchStage);

        // Store for selective application in metadata
        this.brandMatch = matchStage;
    }

    async applyCategoryFilter() {
        const categoryParam = this.queryStr.category;
        if (!categoryParam) return;

        // ✅ FIX: Handle comma-separated strings
        let categoryNames = Array.isArray(categoryParam) ? categoryParam : [categoryParam];
        categoryNames = categoryNames.flatMap(c => c.split(','));

        const categories = await Category.find({
            $or: [
                { slug: { $in: categoryNames.map(v => String(v).toLowerCase()) } },
                { name: { $in: categoryNames.map(v => new RegExp(`^${this.escapeRegExp(String(v))}$`, 'i')) } }
            ]
        }).select('_id');

        const catIds = categories.map(c => c._id);
        const matchStage = categories.length > 0
            ? { $match: { categories: { $in: catIds } } }
            : { $match: { _id: null } };

        // Apply to Main and Count
        this.mainPipeline.push(matchStage);
        this.countPipeline.push(matchStage);

        // Store for selective application in metadata
        this.categoryMatch = matchStage;
    }

    applyConditionFilter() {
        const conditionParam = this.queryStr.condition;
        if (!conditionParam) return;

        // ✅ FIX: Handle comma-separated strings
        let conditions = Array.isArray(conditionParam) ? conditionParam : [conditionParam];
        conditions = conditions.flatMap(c => c.split(','));

        const validConditions = conditions.map(c =>
            c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
        ).filter(c => ['New', 'Used', 'Refurbished'].includes(c));

        if (validConditions.length === 0) return;

        const matchStage = { $match: { condition: { $in: validConditions } } };
        // Conditions apply globally (even to metadata)
        [this.mainPipeline, this.countPipeline, this.metadataPipeline].forEach(p => p.push(matchStage));
    }

    applyRatingFilter() {
        const rating = Number(this.queryStr.rating || this.queryStr['rating[gte]']);
        if (!rating || isNaN(rating)) return;

        const matchStage = { $match: { averageRating: { $gte: rating } } };
        [this.mainPipeline, this.countPipeline, this.metadataPipeline].forEach(p => p.push(matchStage));
    }

    applyStockFilter() {
        if (this.queryStr.inStock !== 'true') return;
        const matchStage = {
            $match: {
                $or: [
                    { stockQuantity: { $gt: 0 } },
                    { 'variants': { $elemMatch: { isActive: true, stockQuantity: { $gt: 0 } } } }
                ]
            }
        };
        [this.mainPipeline, this.countPipeline, this.metadataPipeline].forEach(p => p.push(matchStage));
    }

    applySorting() {
        const sortParam = this.queryStr.sort || 'newest';
        const map = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            'price-low': { taxInclusivePrice: 1 },
            'price-high': { taxInclusivePrice: -1 },
            rating: { averageRating: -1 },
            popular: { totalReviews: -1, averageRating: -1 },
            'name-asc': { name: 1 },
            'name-desc': { name: -1 }
        };
        this.mainPipeline.push({ $sort: map[sortParam] || map.newest });
    }

    applyPagination() {
        const page = Math.max(1, parseInt(this.queryStr.page) || 1);
        const limit = Math.min(50, parseInt(this.queryStr.limit) || 12);
        const skip = (page - 1) * limit;
        this.mainPipeline.push({ $skip: skip }, { $limit: limit });
        this.paginationInfo = { page, limit, skip };
    }

    addPopulationStagesToMain() {
        this.mainPipeline.push(
            { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brandDetails' } },
            { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categoryDetails' } },
            {
                $addFields: {
                    brand: { $arrayElemAt: ['$brandDetails', 0] },
                    categories: '$categoryDetails'
                }
            },
            {
                $project: {
                    name: 1, slug: 1, brand: 1, categories: 1, condition: 1, label: 1,
                    basePrice: 1, mrp: 1, stockQuantity: 1,
                    effectivePrice: 1,
                    taxRate: 1,
                    hasStock: 1,
                    images: 1, manufacturerImages: 1,
                    variantConfiguration: 1, variants: 1,
                    description: 1, definition: 1, specifications: 1, features: 1,
                    averageRating: 1, totalReviews: 1, tags: 1, createdAt: 1
                }
            }
        );
    }

    buildMetadataPipeline() {
        const getCrossFilters = (excludeBrand = false, excludeCategory = false) => {
            const filters = [];
            if (!excludeBrand && this.brandMatch) filters.push(this.brandMatch);
            if (!excludeCategory && this.categoryMatch) filters.push(this.categoryMatch);
            return filters;
        };

        this.metadataPipeline.push({
            $facet: {
                // 1. Price Range: Respects Brand AND Category (but ignores Price filter)
                priceRange: [
                    ...getCrossFilters(false, false),
                    { $match: { taxInclusivePrice: { $gt: 0 } } },
                    {
                        $group: {
                            _id: null,
                            minPrice: { $min: { $round: ['$taxInclusivePrice', 0] } },
                            maxPrice: { $max: { $round: ['$taxInclusivePrice', 0] } }
                        }
                    }
                ],
                // 2. Available Brands: Respects Category, IGNORES Brand selection
                brands: [
                    ...getCrossFilters(true, false), // excludeBrand = true
                    { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'b' } },
                    { $unwind: '$b' },
                    { $group: { _id: '$b.name', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ],
                // 3. Available Categories: Respects Brand, IGNORES Category selection (shows siblings)
                categories: [
                    ...getCrossFilters(false, true), // excludeCategory = true
                    { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'c' } },
                    { $unwind: '$c' },
                    { $group: { _id: '$c.name', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ],
                // 4. Conditions: Respects Both
                conditions: [
                    ...getCrossFilters(false, false),
                    { $match: { condition: { $ne: null } } },
                    { $group: { _id: '$condition', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ],
                // 5. Stock Count: Respects Both
                inStockCount: [
                    ...getCrossFilters(false, false),
                    {
                        $match: {
                            $or: [
                                { stockQuantity: { $gt: 0 } },
                                { 'variants.stockQuantity': { $gt: 0 } }
                            ]
                        }
                    },
                    { $count: 'count' }
                ]
            }
        });
    }

    processMetadataResults(metadataResult) {
        if (!metadataResult || metadataResult.length === 0) return this.getEmptyMetadata();
        const data = metadataResult[0];

        return {
            minPrice: data.priceRange[0]?.minPrice || 0,
            maxPrice: data.priceRange[0]?.maxPrice || 0,
            availableBrands: data.brands.map(b => b._id),
            availableCategories: data.categories.map(c => c._id),
            conditions: data.conditions.map(c => c._id),
            inStockCount: data.inStockCount[0]?.count || 0,
            totalProducts: 0
        };
    }

    getEmptyMetadata() {
        return {
            minPrice: 0, maxPrice: 0,
            availableBrands: [], availableCategories: [],
            conditions: [], inStockCount: 0, totalProducts: 0
        };
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = AdvancedFilterBuilder;