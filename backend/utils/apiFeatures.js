// utils/apiFeatures.js
const Brand = require('../models/brandModel');
const Category = require('../models/categoryModel');

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    async filter() {
        const queryCopy = { ...this.queryString };

        // Remove fields that are not for filtering
        const removeFields = ['keyword', 'limit', 'page', 'sort', 'fields', 'variantAttributes', 'search', 'categories', 'brands', 'status'];
        removeFields.forEach(el => delete queryCopy[el]);

        // ✅ FIX 1: Handle multiple categories (from categories parameter)
        if (this.queryString.categories) {
            try {
                const categoryNames = Array.isArray(this.queryString.categories)
                    ? this.queryString.categories
                    : this.queryString.categories.split(',');

                const categories = await Category.find({
                    name: { $in: categoryNames.map(name => new RegExp(name, 'i')) }
                });

                if (categories.length > 0) {
                    queryCopy.categories = { $in: categories.map(cat => cat._id) };
                } else {
                    queryCopy.categories = { $in: [] }; // No results if no categories found
                }
            } catch (error) {
                console.error('Error finding categories:', error);
                queryCopy.categories = { $in: [] };
            }
        }

        // ✅ FIX 2: Handle multiple brands (from brands parameter)  
        if (this.queryString.brands) {
            try {
                const brandNames = Array.isArray(this.queryString.brands)
                    ? this.queryString.brands
                    : this.queryString.brands.split(',');

                const brands = await Brand.find({
                    name: { $in: brandNames.map(name => new RegExp(name, 'i')) }
                });

                if (brands.length > 0) {
                    queryCopy.brand = { $in: brands.map(brand => brand._id) };
                } else {
                    queryCopy.brand = { $in: [] };
                }
            } catch (error) {
                console.error('Error finding brands:', error);
                queryCopy.brand = { $in: [] };
            }
        }

        // ✅ FIX 3: Handle single category (from category parameter - for backward compatibility)
        if (queryCopy.category && !this.isValidObjectId(queryCopy.category)) {
            try {
                const category = await Category.findOne({
                    name: { $regex: new RegExp(queryCopy.category, 'i') }
                });
                if (category) {
                    queryCopy.categories = { $in: [category._id] };
                } else {
                    queryCopy.categories = { $in: [] };
                }
            } catch (error) {
                console.error('Error finding category:', error);
                queryCopy.categories = { $in: [] };
            }
            delete queryCopy.category;
        }

        // ✅ FIX 4: Handle single brand (from brand parameter - for backward compatibility)
        if (queryCopy.brand && !this.isValidObjectId(queryCopy.brand)) {
            try {
                const brand = await Brand.findOne({
                    name: { $regex: new RegExp(queryCopy.brand, 'i') }
                });
                if (brand) {
                    queryCopy.brand = brand._id;
                } else {
                    queryCopy.brand = { $in: [] };
                }
            } catch (error) {
                console.error('Error finding brand:', error);
                queryCopy.brand = { $in: [] };
            }
        }

        // Handle inStock filter
        if (this.queryString.inStock === 'true') {
            queryCopy.$or = [
                { stockQuantity: { $gt: 0 } },
                { 'variants.stockQuantity': { $gt: 0 } }
            ];
        }

        // Handle price range filters
        if (this.queryString.minPrice || this.queryString.maxPrice) {
            const priceConditions = [];

            if (this.queryString.minPrice) {
                const minPrice = Number(this.queryString.minPrice);

                priceConditions.push({
                    'variantConfiguration.hasVariants': false,
                    'basePrice': { $gte: minPrice }
                });
                priceConditions.push({
                    'variantConfiguration.hasVariants': true,
                    'variants.price': { $gte: minPrice },
                    'variants.isActive': true
                });
            }

            if (this.queryString.maxPrice) {
                const maxPrice = Number(this.queryString.maxPrice);

                if (priceConditions.length > 0) {
                    priceConditions.forEach(condition => {
                        if (condition['variantConfiguration.hasVariants'] === false) {
                            condition.basePrice = condition.basePrice || {};
                            condition.basePrice.$lte = maxPrice;
                        } else {
                            condition['variants.price'] = condition['variants.price'] || {};
                            condition['variants.price'].$lte = maxPrice;
                        }
                    });
                } else {
                    priceConditions.push({
                        'variantConfiguration.hasVariants': false,
                        'basePrice': { $lte: maxPrice }
                    });
                    priceConditions.push({
                        'variantConfiguration.hasVariants': true,
                        'variants.price': { $lte: maxPrice },
                        'variants.isActive': true
                    });
                }
            }

            if (priceConditions.length > 0) {
                queryCopy.$or = queryCopy.$or || [];
                queryCopy.$or.push(...priceConditions);
            }
        }

        // Handle rating filter
        if (this.queryString.rating) {
            queryCopy.averageRating = { $gte: Number(this.queryString.rating) };
        }

        // ✅ FIX 5: Handle search parameter (from getAllProducts compatibility)
        if (this.queryString.search) {
            queryCopy.$or = [
                { name: { $regex: this.queryString.search, $options: 'i' } },
                { description: { $regex: this.queryString.search, $options: 'i' } }
            ];
        }

        // Remove the original filters from queryCopy
        delete queryCopy.minPrice;
        delete queryCopy.maxPrice;
        delete queryCopy.rating;
        delete queryCopy.inStock;
        delete queryCopy.search;

        this.query = this.query.find(queryCopy);
        return this;
    }

    // Helper function to check if string is a valid ObjectId
    isValidObjectId(id) {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    search() {
        // ✅ FIX 6: Use search from queryString if keyword not provided
        const searchTerm = this.queryString.keyword || this.queryString.search;

        if (searchTerm) {
            const searchQuery = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $in: [new RegExp(searchTerm, 'i')] } }
                ]
            };
            this.query = this.query.find(searchQuery);
        }
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            let sortBy;

            // ✅ FIX 7: Support both getAllProducts and getProducts sort options
            switch (this.queryString.sort) {
                case 'newest':
                case '-createdAt':
                    sortBy = '-createdAt';
                    break;
                case 'price-asc':
                case 'price-low':
                case 'basePrice':
                    sortBy = 'basePrice';
                    break;
                case 'price-desc':
                case 'price-high':
                case '-basePrice':
                    sortBy = '-basePrice';
                    break;
                case 'popular':
                case 'rating':
                case '-averageRating':
                    sortBy = '-averageRating';
                    break;
                case 'name-asc':
                    sortBy = 'name';
                    break;
                case 'name-desc':
                    sortBy = '-name';
                    break;
                case 'featured':
                default:
                    sortBy = '-createdAt -averageRating';
                    break;
            }

            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt -averageRating');
        }
        return this;
    }

    paginate(resPerPage) {
        const currentPage = Number(this.queryString.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            // Default field selection for better performance
            this.query = this.query.select('name slug brand categories images basePrice mrp offerPrice discountPercentage stockQuantity hasVariants averageRating totalReviews');
        }
        return this;
    }

    getFilter() {
        return this.query._conditions;
    }
}

module.exports = APIFeatures;