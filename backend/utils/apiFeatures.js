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
        const removeFields = ['keyword', 'limit', 'page', 'sort', 'fields', 'variantAttributes'];
        removeFields.forEach(el => delete queryCopy[el]);

        // Handle brand filter - convert brand name to ObjectId
        if (queryCopy.brand && !this.isValidObjectId(queryCopy.brand)) {
            try {
                const brand = await Brand.findOne({
                    name: { $regex: new RegExp(`^${queryCopy.brand}$`, 'i') }
                });
                if (brand) {
                    queryCopy.brand = brand._id;
                } else {
                    // If brand not found, set to invalid ID to return no results
                    queryCopy.brand = '000000000000000000000000';
                }
            } catch (error) {
                console.error('Error finding brand:', error);
                queryCopy.brand = '000000000000000000000000';
            }
        }

        // Handle category filter - convert category name to ObjectId
        if (queryCopy.category && !this.isValidObjectId(queryCopy.category)) {
            try {
                const category = await Category.findOne({
                    name: { $regex: new RegExp(`^${queryCopy.category}$`, 'i') }
                });
                if (category) {
                    queryCopy.categories = { $in: [category._id] };
                } else {
                    queryCopy.categories = { $in: ['000000000000000000000000'] };
                }
            } catch (error) {
                console.error('Error finding category:', error);
                queryCopy.categories = { $in: ['000000000000000000000000'] };
            }
            delete queryCopy.category;
        }

        // Handle inStock filter
        if (this.queryString.inStock === 'true') {
            queryCopy.stockQuantity = { $gt: 0 };
        }

        // Handle price range filters
        if (this.queryString.minPrice || this.queryString.maxPrice) {
            queryCopy.basePrice = {};
            if (this.queryString.minPrice) {
                queryCopy.basePrice.$gte = Number(this.queryString.minPrice);
            }
            if (this.queryString.maxPrice) {
                queryCopy.basePrice.$lte = Number(this.queryString.maxPrice);
            }
        }

        // Handle rating filter
        if (this.queryString.rating) {
            queryCopy.averageRating = { $gte: Number(this.queryString.rating) };
        }

        // Remove the original filters from queryCopy
        delete queryCopy.minPrice;
        delete queryCopy.maxPrice;
        delete queryCopy.rating;
        delete queryCopy.inStock;

        this.query = this.query.find(queryCopy);
        return this;
    }

    // Helper function to check if string is a valid ObjectId
    isValidObjectId(id) {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    search() {
        const keyword = this.queryString.keyword ? {
            $or: [
                { name: { $regex: this.queryString.keyword, $options: 'i' } },
                { description: { $regex: this.queryString.keyword, $options: 'i' } },
                { tags: { $in: [new RegExp(this.queryString.keyword, 'i')] } }
            ]
        } : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            let sortBy;

            switch (this.queryString.sort) {
                case 'newest':
                    sortBy = '-createdAt';
                    break;
                case 'price-low':
                    sortBy = 'basePrice';
                    break;
                case 'price-high':
                    sortBy = '-basePrice';
                    break;
                case 'rating':
                    sortBy = '-averageRating';
                    break;
                case 'name':
                    sortBy = 'name';
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
        }
        return this;
    }

    getFilter() {
        return this.query._conditions;
    }
}

module.exports = APIFeatures;