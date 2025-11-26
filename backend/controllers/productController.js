const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const ErrorHandler = require('../utils/errorHandler')
const categoryModel = require("../models/categoryModel");
const brandModel = require("../models/brandModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");


exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            sort = 'createdAt',
            order = 'desc',
            minPrice,
            maxPrice,
            inStock,
            search,
            categories,
            brands,
            status = 'Published'
        } = req.query;

        // Build filter for public products only
        const filter = {
            isActive: true,
            status: status
        };

        // Search filter
        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { tags: searchRegex },
                { 'variants.name': searchRegex }
            ];
        }

        // 🆕 UPDATED: Price filter - use basePrice for filtering
        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) {
                const min = Number(minPrice);
                if (isNaN(min)) {
                    return next(new ErrorHandler('Invalid minPrice parameter', 400));
                }
                filter.basePrice.$gte = min;
            }
            if (maxPrice) {
                const max = Number(maxPrice);
                if (isNaN(max)) {
                    return next(new ErrorHandler('Invalid maxPrice parameter', 400));
                }
                filter.basePrice.$lte = max;
            }
        }

        // Stock filter
        if (inStock === 'true') {
            filter.$or = [
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
            ];
        }

        // Categories filter
        if (categories) {
            const categoryArray = Array.isArray(categories) ? categories : [categories];
            filter.categories = { $in: categoryArray };
        }

        // Brands filter
        if (brands) {
            const brandArray = Array.isArray(brands) ? brands : [brands];
            filter.brand = { $in: brandArray };
        }

        // ✅ FIX: Define sortConfig properly
        const sortConfig = {};
        let sortField = sort;

        // Handle negative sort fields (descending)
        if (sort.startsWith('-')) {
            sortField = sort.substring(1);
            sortConfig[sortField] = -1;
        } else {
            sortConfig[sortField] = order === 'desc' ? -1 : 1;
        }

        // ADD VALIDATION FOR PAGE AND LIMIT
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const products = await Product.find(filter)
            .select('name slug brand categories images basePrice mrp offerPrice discountPercentage stockQuantity variantConfiguration variants averageRating totalReviews hsn manufacturerImages')
            .populate("categories", "name slug")
            .populate("brand", "name slug")
            .sort(sortConfig)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            results: products.length,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limitNum),
            currentPage: pageNum,
            products
        });

    } catch (error) {
        console.error('❌ Backend error in getAllProducts:', error);
        return next(new ErrorHandler('Internal server error while fetching products', 500));
    }
});


exports.getProducts = catchAsyncErrors(async (req, res, next) => {
    const resPerPage = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;

    // Build base query - public sees only active products
    let baseQuery = Product.find({ isActive: true });

    // Use APIFeatures for complex queries
    const apiFeatures = new APIFeatures(baseQuery, req.query);
    apiFeatures.search();
    await apiFeatures.filter();

    // Count before pagination
    const countQuery = apiFeatures.query.model.find(apiFeatures.query._conditions);
    const filteredProductsCount = await countQuery.countDocuments();

    // Apply pagination and sorting
    apiFeatures.paginate(resPerPage).sort();

    // Field selection
    apiFeatures.query.select(
        'name slug brand categories images basePrice offerPrice discountPercentage ' +
        'stockQuantity hasVariants variants variantConfiguration ' +
        'averageRating totalReviews tags isActive createdAt'
    );

    // Variant filtering
    if (req.query.variantAttributes) {
        try {
            const variantFilters = JSON.parse(req.query.variantAttributes);
            apiFeatures.query.where({
                'variants.identifyingAttributes': {
                    $elemMatch: variantFilters
                }
            });
        } catch (error) {
            return next(new ErrorHandler('Invalid variant attributes filter', 400));
        }
    }

    // Execute query
    const products = await apiFeatures.query.populate([
        { path: "categories", select: "name slug" },
        { path: "brand", select: "name slug" }
    ]);

    // Total count of active products
    const totalProductsCount = await Product.countDocuments({ isActive: true });

    res.status(200).json({
        success: true,
        totalProducts: totalProductsCount,
        filteredProducts: filteredProductsCount,
        totalPages: Math.ceil(filteredProductsCount / resPerPage),
        currentPage: page,
        products,
    });
});

exports.advancedSearch = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            q,
            page = 1,
            limit = 12,
            minPrice,
            maxPrice,
            categories,
            brands,
            inStock,
            condition,
            rating
        } = req.query;

        if (!q || q.trim() === '') {
            return next(new ErrorHandler("Search query is required", 400));
        }

        // Build base filter with text search
        const filter = {
            isActive: true,
            status: 'Published',
            $text: { $search: q.trim() }
        };

        // Add price filter
        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) {
                const min = Number(minPrice);
                if (isNaN(min)) {
                    return next(new ErrorHandler('Invalid minPrice parameter', 400));
                }
                filter.basePrice.$gte = min;
            }
            if (maxPrice) {
                const max = Number(maxPrice);
                if (isNaN(max)) {
                    return next(new ErrorHandler('Invalid maxPrice parameter', 400));
                }
                filter.basePrice.$lte = max;
            }
        }

        // Add category filter
        if (categories) {
            const categoryIds = Array.isArray(categories) ? categories : [categories];
            // Validate if categories exist
            const validCategories = await Category.find({
                _id: { $in: categoryIds }
            });
            if (validCategories.length > 0) {
                filter.categories = { $in: validCategories.map(cat => cat._id) };
            }
        }

        // Add brand filter
        if (brands) {
            const brandIds = Array.isArray(brands) ? brands : [brands];
            // Validate if brands exist
            const validBrands = await Brand.find({
                _id: { $in: brandIds }
            });
            if (validBrands.length > 0) {
                filter.brand = { $in: validBrands.map(brand => brand._id) };
            }
        }

        // Stock filter
        if (inStock === 'true') {
            filter.$or = [
                { stockQuantity: { $gt: 0 } },
                {
                    hasVariants: true,
                    'variants': {
                        $elemMatch: {
                            isActive: true,
                            stockQuantity: { $gt: 0 }
                        }
                    }
                }
            ];
        }

        // Condition filter
        if (condition) {
            filter.condition = condition;
        }

        // Rating filter
        if (rating) {
            const minRating = Number(rating);
            if (!isNaN(minRating)) {
                filter.averageRating = { $gte: minRating };
            }
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Execute search with text score
        const products = await Product.find(filter)
            .select('name slug brand categories images basePrice offerPrice discountPercentage stockQuantity hasVariants averageRating totalReviews tags')
            .populate("categories", "name slug")
            .populate("brand", "name slug")
            .sort({ score: { $meta: "textScore" } }) // Sort by relevance score
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            results: products.length,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limitNum),
            currentPage: pageNum,
            searchQuery: q,
            searchType: 'advanced',
            products
        });

    } catch (error) {
        console.error('❌ Backend error in advancedSearch:', error);
        return next(new ErrorHandler('Internal server error during search', 500));
    }
});

exports.getProductsByCategory = catchAsyncErrors(async (req, res, next) => {
    try {
        const { categoryName } = req.params;
        const {
            page = 1,
            limit = 12,
            sort = 'createdAt',
            order = 'desc',
            minPrice,
            maxPrice,
            inStock,
            brand,
            search,
            condition,
            rating
        } = req.query;

        // ✅ FIX: Decode URL encoded category name
        const decodedCategoryName = decodeURIComponent(categoryName);
        const formattedCategoryName = decodedCategoryName.replace(/-/g, ' ');
        const category = await Category.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${formattedCategoryName}$`, 'i') } },
                { slug: decodedCategoryName.toLowerCase() }
            ]
        });

        if (!category) {
            return res.status(200).json({
                success: true,
                results: 0,
                totalProducts: 0,
                totalPages: 0,
                currentPage: Number(page),
                category: {
                    name: formattedCategoryName,
                    slug: decodedCategoryName
                },
                products: []
            });
        }

        const filter = {
            isActive: true,
            status: 'Published',
            categories: category._id
        };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ];
        }

        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
            return next(new ErrorHandler('minPrice cannot be greater than maxPrice', 400));
        }

        // ✅ FIX: Price filter - handle both min and max properly
        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) {
                const min = Number(minPrice);
                if (isNaN(min)) {
                    return next(new ErrorHandler('Invalid minPrice parameter', 400));
                }
                filter.basePrice.$gte = min;
            }
            if (maxPrice) {
                const max = Number(maxPrice);
                if (isNaN(max)) {
                    return next(new ErrorHandler('Invalid maxPrice parameter', 400));
                }
                filter.basePrice.$lte = max;
            }
        }

        if (inStock === 'true') {
            filter.$or = [
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
            ];
        }

        if (brand) {
            const decodedBrand = decodeURIComponent(brand).replace(/\+/g, ' ');
            const brandDoc = await Brand.findOne({
                name: { $regex: new RegExp(`^${decodedBrand}$`, 'i') }
            });

            if (brandDoc) {
                filter.brand = brandDoc._id;
            } else {
                filter.brand = { $in: [] };
            }
        }

        if (condition) {
            filter.condition = condition;
        }

        if (rating) {
            const minRating = Number(rating);
            if (!isNaN(minRating)) {
                filter.averageRating = { $gte: minRating };
            }
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // ✅ FIX: Sort configuration
        const sortConfig = { basePrice: 1 };
        let sortField = sort;

        // Handle negative sort fields (descending)
        if (sort.startsWith('-')) {
            sortField = sort.substring(1);
            sortConfig[sortField] = -1;
        } else {
            sortConfig[sortField] = order === 'desc' ? -1 : 1;
        }

        const products = await Product.find(filter)
            .select('name slug brand categories images basePrice mrp offerPrice discountPercentage stockQuantity variantConfiguration variants averageRating totalReviews condition tags hsn manufacturerImages')
            .populate("categories", "name slug")
            .populate("brand", "name slug")
            .sort(sortConfig)
            .skip(skip)
            .limit(limitNum);

        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            results: products.length,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limitNum),
            currentPage: pageNum,
            category: {
                name: category.name,
                slug: category.slug
            },
            products
        });

    } catch (error) {
        console.error('❌ Backend error in getProductsByCategory:', error);
        console.error('🔍 Error stack:', error.stack);
        return next(new ErrorHandler('Internal server error while fetching category products', 500));
    }
});


exports.getProductsByBrand = catchAsyncErrors(async (req, res, next) => {
    try {
        const { brandName } = req.params;
        const {
            page = 1,
            limit = 12,
            sort = 'createdAt',
            order = 'desc',
            minPrice,
            maxPrice,
            inStock,
            category,
            search,
            condition,
            rating
        } = req.query;

        const decodedBrandName = decodeURIComponent(brandName);
        const formattedBrandName = decodedBrandName.replace(/-/g, ' ');
        const brand = await Brand.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${formattedBrandName}$`, 'i') } },
                { slug: decodedBrandName.toLowerCase() }
            ]
        });

        if (!brand) {
            return res.status(200).json({
                success: true,
                results: 0,
                totalProducts: 0,
                totalPages: 0,
                currentPage: Number(page),
                brand: {
                    name: formattedBrandName,
                    slug: decodedBrandName
                },
                products: []
            });
        }

        const filter = {
            isActive: true,
            status: 'Published',
            brand: brand._id
        };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ];
        }

        // ✅ ADDED: Price validation
        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
            return next(new ErrorHandler('minPrice cannot be greater than maxPrice', 400));
        }

        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) {
                const min = Number(minPrice);
                if (isNaN(min)) {
                    return next(new ErrorHandler('Invalid minPrice parameter', 400));
                }
                filter.basePrice.$gte = min;
            }
            if (maxPrice) {
                const max = Number(maxPrice);
                if (isNaN(max)) {
                    return next(new ErrorHandler('Invalid maxPrice parameter', 400));
                }
                filter.basePrice.$lte = max;
            }
        }

        // ✅ FIX: Enhanced stock filter
        if (inStock === 'true') {
            filter.$or = [
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
            ];
        }

        // ✅ FIX: Category filter
        if (category) {
            const decodedCategory = decodeURIComponent(category).replace(/\+/g, ' ');
            const categoryDoc = await Category.findOne({
                name: { $regex: new RegExp(`^${decodedCategory}$`, 'i') }
            });

            if (categoryDoc) {
                filter.categories = categoryDoc._id;
            } else {
                filter.categories = { $in: [] };
            }
        }

        if (condition) {
            filter.condition = condition;
        }

        if (rating) {
            const minRating = Number(rating);
            if (!isNaN(minRating)) {
                filter.averageRating = { $gte: minRating };
            }
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // ✅ FIX: Consistent sort configuration
        const sortConfig = { basePrice: 1 };
        let sortField = sort;

        // Handle negative sort fields (descending)
        if (sort.startsWith('-')) {
            sortField = sort.substring(1);
            sortConfig[sortField] = -1;
        } else {
            sortConfig[sortField] = order === 'desc' ? -1 : 1;
        }

        const products = await Product.find(filter)
            .select('name slug brand categories images basePrice mrp offerPrice discountPercentage stockQuantity variantConfiguration variants averageRating totalReviews condition tags hsn manufacturerImages')
            .populate("categories", "name slug")
            .populate("brand", "name slug")
            .sort(sortConfig)
            .skip(skip)
            .limit(limitNum);

        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            results: products.length,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limitNum),
            currentPage: pageNum,
            brand: {
                name: brand.name,
                slug: brand.slug
            },
            products
        });

    } catch (error) {
        console.error('❌ Backend error in getProductsByBrand:', error);
        console.error('🔍 Error stack:', error.stack);
        return next(new ErrorHandler('Internal server error while fetching brand products', 500));
    }
});
// GET PRODUCT BY SLUG
exports.getProductBySlug = catchAsyncErrors(async (req, res, next) => {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
        .populate('brand', 'name slug logo')
        .populate('categories', 'name slug')
        .select('-__v -notes');

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    res.status(200).json({
        success: true,
        product
    });
});

exports.searchProducts = catchAsyncErrors(async (req, res, next) => {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q || typeof q !== "string" || q.trim() === '') {
        return next(new ErrorHandler("Search query 'q' is required", 400));
    }

    const searchTerm = q.trim();

    // Try text search first, fallback to regex if no results
    let filter = {
        isActive: true,
        status: 'Published',
        $text: { $search: searchTerm }
    };

    let products = await Product.find(filter)
        .select('name slug brand categories images basePrice offerPrice')
        .populate("categories", "name slug")
        .populate("brand", "name slug")
        .sort({ score: { $meta: "textScore" } })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    // Fallback to regex search if no text search results
    if (products.length === 0) {
        const regex = new RegExp(searchTerm, "i");
        filter = {
            isActive: true,
            status: 'Published',
            $or: [
                { name: regex },
                { description: regex },
                { tags: regex },
                { 'variants.name': regex }
            ]
        };

        products = await Product.find(filter)
            .select('name slug brand categories images basePrice offerPrice')
            .populate("categories", "name slug")
            .populate("brand", "name slug")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
    }

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
        success: true,
        results: products.length,
        totalProducts,
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
        currentPage: parseInt(page),
        searchQuery: searchTerm,
        searchType: products.length > 0 ? 'text' : 'regex',
        products
    });
});

exports.filterProducts = catchAsyncErrors(async (req, res, next) => {
    const resPerPage = Number(req.query.limit) || 10;

    // Prevent invalid filter params
    const { minPrice, maxPrice, minRating, inStock, condition } = req.query;

    if ((minPrice && isNaN(minPrice)) || (maxPrice && isNaN(maxPrice))) {
        return next(new ErrorHandler("Price filters must be numeric", 400));
    }

    if (minRating && isNaN(minRating)) {
        return next(new ErrorHandler("Rating filter must be numeric", 400));
    }

    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .filter()
        .paginate(resPerPage);

    const products = await apiFeatures.query.populate("category brand");

    if (!products || products.length === 0) return next(new ErrorHandler("No products match the filter criteria", 404));

    res.status(200).json({
        success: true,
        results: products.length,
        resPerPage,
        products,
    });
});

exports.getProductVariants = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(id, "variants");
    if (!product) return next(new ErrorHandler("Product not found", 404));

    res.status(200).json({ success: true, variants: product.variants || [] });
});


// ADMIN: Create new product

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    const {
        name,
        brand,
        categories,
        tags,
        condition,
        label,
        isActive,
        status,
        description,
        definition,
        basePrice,
        offerPrice, // Keep for backward compatibility
        mrp, // 🆕 New MRP field
        discountPercentage,
        taxRate,
        sku,
        barcode,
        stockQuantity,
        variantConfiguration,
        variants,
        specifications,
        features,
        images,
        dimensions,
        weight,
        warranty,
        reviews,
        meta,
        canonicalUrl,
        linkedProducts,
        notes,
        hsn, // 🆕 New HSN field
        manufacturerImages // 🆕 New manufacturer images
    } = req.body;

    // --- 1. ESSENTIAL FIELD VALIDATION ---
    if (!name || !description || !brand || !categories || categories.length === 0) {
        return next(new ErrorHandler("Missing required fields: name, description, brand, categories.", 400));
    }

    // 🆕 UPDATED: basePrice only required if no variants
    if (!variantConfiguration?.hasVariants && !basePrice) {
        return next(new ErrorHandler("Base price is required for products without variants.", 400));
    }

    // 🆕 FIX: More flexible thumbnail validation
    if (!images || !images.thumbnail || !images.thumbnail.url) {
        return next(new ErrorHandler("Product thumbnail image is required.", 400));
    }

    let brandId;

    if (brand) {
        if (mongoose.Types.ObjectId.isValid(brand)) {
            brandId = brand;
        } else {
            const brandDoc = await brandModel.findOne({ name: brand.trim() });
            if (!brandDoc) {
                return next(new ErrorHandler(`Brand '${brand}' not found.`, 400));
            }
            brandId = brandDoc._id;
        }
    } else {
        return next(new ErrorHandler("Brand is required.", 400));
    }

    // --- 2. Category Handling ---
    let categoryIds = [];

    if (Array.isArray(categories) && categories.length > 0) {
        for (const category of categories) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                categoryIds.push(category);
            } else {
                const categoryDoc = await categoryModel.findOne({ name: category.trim() });
                if (!categoryDoc) {
                    return next(new ErrorHandler(`Category '${category}' not found.`, 400));
                }
                categoryIds.push(categoryDoc._id);
            }
        }
    } else {
        return next(new ErrorHandler("At least one category is required.", 400));
    }

    // --- 3. NAME CONFLICT CHECK ---
    const existing = await Product.findOne({ name: name.trim() });
    if (existing) {
        return next(new ErrorHandler("A product with this name already exists.", 400));
    }

    // --- 4. VARIANT CONFIGURATION VALIDATION ---
    let finalVariantConfig = {
        hasVariants: false,
        variantType: 'None',
        variantCreatingSpecs: [],
        variantAttributes: []
    };

    let enhancedVariants = [];

    if (variantConfiguration && variantConfiguration.hasVariants) {
        finalVariantConfig = {
            hasVariants: variantConfiguration.hasVariants,
            variantType: variantConfiguration.variantType || 'None',
            variantCreatingSpecs: variantConfiguration.variantCreatingSpecs || [],
            variantAttributes: variantConfiguration.variantAttributes || []
        };

        // 🆕 FIX: Validate variants array exists when hasVariants is true
        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            return next(new ErrorHandler("Variants array is required when hasVariants is true.", 400));
        }

        // Validate variantType enum
        const validVariantTypes = ['None', 'Specifications', 'Attributes', 'Mixed', 'Color'];
        if (!validVariantTypes.includes(finalVariantConfig.variantType)) {
            return next(new ErrorHandler(`Invalid variantType. Must be one of: ${validVariantTypes.join(', ')}`, 400));
        }

        // Validate variants structure
        const seenSKUs = new Set();
        const seenBarcodes = new Set();

        for (const [index, variant] of variants.entries()) {
            // Basic validation
            if (!variant.name || !variant.price || !variant.identifyingAttributes) {
                return next(new ErrorHandler(`Variant at index ${index} must have name, price, and identifyingAttributes.`, 400));
            }

            // 🆕 FIX: ENHANCED VARIANT IMAGE HANDLING WITH GALLERY SUPPORT
            let variantImages = {
                thumbnail: {
                    url: '',
                    altText: ''
                },
                gallery: []
            };

            if (variant.images) {
                // Use variant thumbnail if provided and valid
                if (variant.images.thumbnail && variant.images.thumbnail.url) {
                    variantImages.thumbnail = {
                        url: variant.images.thumbnail.url,
                        altText: variant.images.thumbnail.altText || `Variant ${variant.name} thumbnail`
                    };
                } else {
                    // Fallback to product thumbnail
                    variantImages.thumbnail = {
                        url: images.thumbnail.url,
                        altText: images.thumbnail.altText || `Variant ${variant.name} thumbnail`
                    };
                }

                // 🆕 FIX: Handle variant gallery images
                if (variant.images.gallery && Array.isArray(variant.images.gallery)) {
                    // Validate and use variant gallery images
                    variantImages.gallery = variant.images.gallery.map((galleryImg, imgIndex) => ({
                        url: galleryImg.url,
                        altText: galleryImg.altText || `Variant ${variant.name} gallery image ${imgIndex + 1}`
                    })).filter(galleryImg => galleryImg.url); // Remove invalid images
                } else if (images.gallery && Array.isArray(images.gallery)) {
                    // 🆕 FIX: Fallback to product gallery if variant has no gallery
                    variantImages.gallery = images.gallery.map(galleryImg => ({
                        url: galleryImg.url,
                        altText: galleryImg.altText || `Variant ${variant.name} gallery image`
                    }));
                }
            } else {
                // 🆕 FIX: Complete fallback to product images
                variantImages.thumbnail = {
                    url: images.thumbnail.url,
                    altText: images.thumbnail.altText || `Variant ${variant.name} thumbnail`
                };

                if (images.gallery && Array.isArray(images.gallery)) {
                    variantImages.gallery = images.gallery.map(galleryImg => ({
                        url: galleryImg.url,
                        altText: galleryImg.altText || `Variant ${variant.name} gallery image`
                    }));
                }
            }

            // Validate SKU uniqueness
            if (variant.sku) {
                if (seenSKUs.has(variant.sku)) {
                    return next(new ErrorHandler(`Duplicate SKU found: ${variant.sku}`, 400));
                }
                seenSKUs.add(variant.sku);
            } else {
                // Auto-generate SKU if not provided
                variant.sku = generateVariantSKU(name, index);
            }

            // Validate barcode uniqueness
            if (variant.barcode) {
                if (seenBarcodes.has(variant.barcode)) {
                    return next(new ErrorHandler(`Duplicate barcode found: ${variant.barcode}`, 400));
                }
                seenBarcodes.add(variant.barcode);
            } else {
                // Auto-generate barcode if not provided
                variant.barcode = generateVariantBarcode();
            }

            // Validate identifyingAttributes
            if (!Array.isArray(variant.identifyingAttributes) || variant.identifyingAttributes.length === 0) {
                return next(new ErrorHandler(`Variant "${variant.name}" must have at least one identifying attribute.`, 400));
            }

            // 🆕 UPDATED: Enhanced identifying attributes with MRP support
            const enhancedAttributes = processIdentifyingAttributes(variant.identifyingAttributes);

            // Validate stock quantity
            if (typeof variant.stockQuantity !== 'number' || variant.stockQuantity < 0) {
                return next(new ErrorHandler(`Variant "${variant.name}" must have a valid stockQuantity (number >= 0).`, 400));
            }

            // 🆕 UPDATED: Create enhanced variant with MRP support
            enhancedVariants.push({
                name: variant.name.trim(),
                sku: variant.sku,
                barcode: variant.barcode,
                price: variant.price,
                // 🆕 Handle MRP - use new mrp field or fallback to offerPrice for backward compatibility
                mrp: variant.mrp !== undefined ? variant.mrp : (variant.offerPrice || variant.price),
                hsn: variant.hsn || hsn, // 🆕 Inherit product HSN if variant doesn't have one
                stockQuantity: variant.stockQuantity || 0,
                identifyingAttributes: enhancedAttributes,
                images: variantImages,
                isActive: variant.isActive !== undefined ? variant.isActive : true,
                specifications: variant.specifications || []
            });
        }

        // 🆕 FIX: Sync variantAttributes with actual variants
        if (finalVariantConfig.variantAttributes && finalVariantConfig.variantAttributes.length > 0) {
            finalVariantConfig.variantAttributes.forEach(attrConfig => {
                if (attrConfig.values && Array.isArray(attrConfig.values)) {
                    const actualValues = new Set();
                    enhancedVariants.forEach(variant => {
                        variant.identifyingAttributes.forEach(attr => {
                            if (attr.key === attrConfig.key) {
                                actualValues.add(attr.value);
                            }
                        });
                    });
                    attrConfig.values = Array.from(actualValues);
                }
            });
        }
    } else {
        // 🆕 FIX: If no variants, ensure variantConfiguration is properly set
        finalVariantConfig.hasVariants = false;
        finalVariantConfig.variantType = 'None';
    }

    // --- 5. PRODUCT IMAGES VALIDATION & PROCESSING ---
    const productImages = {
        thumbnail: {
            url: images.thumbnail.url,
            altText: images.thumbnail.altText || `Product ${name} thumbnail`
        },
        hoverImage: images.hoverImage ? {
            url: images.hoverImage.url,
            altText: images.hoverImage.altText || `Product ${name} hover image`
        } : null,
        gallery: []
    };

    // 🆕 FIX: Process product gallery images
    if (images.gallery && Array.isArray(images.gallery)) {
        productImages.gallery = images.gallery.map((galleryImg, index) => ({
            url: galleryImg.url,
            altText: galleryImg.altText || `Product ${name} gallery image ${index + 1}`
        })).filter(galleryImg => galleryImg.url); // Remove invalid images
    }

    // Validate required thumbnail
    if (!productImages.thumbnail.url) {
        return next(new ErrorHandler("Product thumbnail image URL is required.", 400));
    }

    // --- 6. AUTO-GENERATE SKU IF NOT PROVIDED ---
    let finalSku = sku;
    if (!finalSku) {
        finalSku = generateSKUFromName(name);
    }

    // --- 7. CALCULATE TOTAL STOCK QUANTITY ---
    let totalStockQuantity = 0;

    if (finalVariantConfig.hasVariants && enhancedVariants.length > 0) {
        // Sum up all variant stock quantities
        totalStockQuantity = enhancedVariants.reduce((total, variant) => total + (variant.stockQuantity || 0), 0);
    } else {
        // Use product-level stock quantity
        totalStockQuantity = stockQuantity || 0;
    }

    // --- 8. CREATE PRODUCT ---
    const product = await Product.create({
        name: name.trim(),
        brand: brandId,
        categories: categoryIds,
        tags: tags || [],
        condition: condition || 'New',
        label: label || '',
        isActive: isActive !== undefined ? isActive : true,
        status: status || 'Draft',
        description,
        definition: definition || '',

        // 🆕 NEW FIELDS
        hsn: hsn || '',
        manufacturerImages: manufacturerImages || [],

        // 🆕 UPDATED PRICING: Handle both MRP and offerPrice for backward compatibility
        basePrice: basePrice || 0,
        mrp: mrp !== undefined ? mrp : (offerPrice || basePrice || 0),
        offerPrice: offerPrice || 0,
        discountPercentage: discountPercentage || 0,
        taxRate: taxRate || 0,
        sku: finalSku,
        barcode: barcode || '',
        stockQuantity: totalStockQuantity,

        // Variant Configuration
        variantConfiguration: finalVariantConfig,

        // 🆕 UPDATED: Enhanced variants with MRP support
        variants: enhancedVariants,

        specifications: specifications || [],
        features: features || [],

        dimensions: dimensions || {
            length: 0,
            width: 0,
            height: 0,
            unit: 'cm'
        },

        weight: weight || {
            value: 0,
            unit: 'kg'
        },

        warranty: warranty || '',
        reviews: reviews || [],
        meta: meta || {
            title: '',
            description: '',
            keywords: []
        },
        canonicalUrl: canonicalUrl || '',
        linkedProducts: linkedProducts || [],
        notes: notes || '',
        createdBy: req.user?._id,
    });

    res.status(201).json({
        success: true,
        message: "Product created successfully.",
        product,
    });
});
const generateVariantSKU = (productName, index) => {
    const base = productName.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 6);
    return `${base}-VAR${index + 1}`;
};

const generateVariantBarcode = () => {
    return `VAR${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

const generateSKUFromName = (name) => {
    return name.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 8) + Date.now().toString().slice(-4);
};

const processIdentifyingAttributes = (attributes) => {
    return attributes.map(attr => {
        const processedAttr = {
            key: attr.key,
            label: attr.label || attr.key,
            value: attr.value,
            displayValue: attr.displayValue || attr.value.charAt(0).toUpperCase() + attr.value.slice(1),
            isColor: attr.isColor !== undefined ? attr.isColor : attr.key.toLowerCase().includes('color')
        };

        // Auto-detect and set hex code for color attributes
        if (processedAttr.isColor && !attr.hexCode) {
            processedAttr.hexCode = getColorHexCode(attr.value);
        } else if (processedAttr.isColor && attr.hexCode) {
            processedAttr.hexCode = attr.hexCode;
        }

        return processedAttr;
    });
};

const getColorHexCode = (colorName) => {
    const colorMap = {
        'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'yellow': '#ca8a04',
        'black': '#000000', 'white': '#ffffff', 'gray': '#6b7280', 'purple': '#9333ea',
        'pink': '#db2777', 'orange': '#ea580c', 'space black': '#1D1D1F', 'silver': '#E2E2E2',
        'space gray': '#535353', 'gold': '#ffd700', 'rose gold': '#b76e79'
    };
    return colorMap[colorName.toLowerCase()] || '#6b7280';
};

exports.addMultipleProducts = async (req, res, next) => {
    try {
        const products = req.body.products;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: "No products provided." });
        }

        const slugsSet = new Set(); // to track batch duplicates
        const alreadyPresent = [];  // to store products that exist
        const toInsert = [];        // products that can be inserted

        // --- 1. Get Existing Products for Conflict Check ---
        // We only need the name and slug from the DB
        const existingProducts = await Product.find({}, "name slug").lean();
        const existingNamesSet = new Set(existingProducts.map(p => p.name.trim()));
        const existingSlugSet = new Set(existingProducts.map(p => p.slug));

        for (let p of products) {
            const trimmedName = p.name?.trim();
            if (!trimmedName || !p.brand || !p.categories || p.categories.length === 0) {
                // Skip or log products missing essential fields (Name, Brand, Category)
                console.warn(`Skipping product due to missing fields: ${p.name}`);
                continue;
            }

            // --- 2. Check for Name Conflict in DB ---
            if (existingNamesSet.has(trimmedName)) {
                alreadyPresent.push(trimmedName);
                continue; // Skip adding to DB
            }

            // --- 3. Slug Generation and Uniqueness Check ---
            let baseSlug = trimmedName.toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "") || "product";

            let slug = baseSlug;
            let count = 0;

            // Ensure uniqueness: check both DB and current batch
            while (existingSlugSet.has(slug) || slugsSet.has(slug)) {
                count++;
                slug = `${baseSlug}-${count}`;
            }

            slugsSet.add(slug);

            // --- 4. DATA TRANSFORMATION & SCHEMA ALIGNMENT ---

            // A. Attach the generated slug
            p.slug = slug;

            // B. Consolidate Images into the nested structure 💡
            const { thumbnail, hoverImage, gallery, ...rest } = p;
            p = rest; // p now contains all non-image fields
            p.images = {
                thumbnail,
                hoverImage: hoverImage || {},
                gallery: gallery || []
            };

            // C. Clean Price and Ratings Logic (Keep only what Mongoose hooks need)

            // Mongoose hooks will handle offerPrice calculation from basePrice and discountPercentage.
            // If p.reviews exists, calculate ratings (simplified from original)
            if (p.reviews?.length > 0) {
                const totalRating = p.reviews.reduce((sum, r) => sum + r.rating, 0);
                p.ratings = {
                    count: p.reviews.length,
                    average: parseFloat((totalRating / p.reviews.length).toFixed(2))
                };
                delete p.reviews; // remove reviews array to prevent saving it if not part of schema
            } else {
                p.ratings = { count: 0, average: 0 };
            }

            // D. Set default isActive if not present
            p.isActive = p.isActive !== undefined ? p.isActive : true;

            toInsert.push(p);
        }

        // --- 5. Bulk Insertion ---
        const createdProducts = toInsert.length > 0 ? await Product.insertMany(toInsert, { ordered: false }) : [];
        // Using { ordered: false } allows successful inserts to complete even if one product fails validation

        // --- 6. Response ---
        res.status(201).json({
            success: true,
            message: `${createdProducts.length} products added successfully! ${toInsert.length - createdProducts.length} failed to insert.`,
            productsAdded: createdProducts.map(p => ({ name: p.name, slug: p.slug, id: p._id })),
            alreadyPresent: alreadyPresent.length > 0 ? `These products were already present (skipped): ${alreadyPresent.join(", ")}` : undefined
        });

    } catch (error) {
        // Handle bulk validation errors or database errors
        if (error.name === 'MongoBulkWriteError' || error.name === 'ValidationError') {
            // You can refine this to extract specific errors for better reporting
            return res.status(400).json({ success: false, message: "One or more products failed Mongoose validation during insertion.", details: error.message });
        }
        next(error);
    }
};
// ADMIN: Get all products (admin view)

// =====================================================
// GET ALL PRODUCTS (Admin - includes inactive products)
// =====================================================
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const {
        page = 1,
        limit = 12,
        sort = 'newest',
        search,
        category,
        brand,
        status,
        inStock
    } = req.query;

    // Build filter
    const filter = {};

    // Search - create separate search filter
    if (search) {
        const searchTerm = search.replace(/\+/g, ' ').trim();

        filter.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { sku: { $regex: searchTerm, $options: 'i' } },
            { 'variants.name': { $regex: searchTerm, $options: 'i' } },
            { 'variants.sku': { $regex: searchTerm, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        filter.categories = { $in: [category] };
    }

    // Brand filter
    if (brand) {
        filter.brand = brand;
    }

    // Status filter
    if (status) {
        filter.status = status;
    }

    // Stock filter - handle separately without overwriting $or
    let stockFilter = {};
    if (inStock === 'true') {
        stockFilter = {
            $or: [
                { stockQuantity: { $gt: 0 } },
                { 'variants.stockQuantity': { $gt: 0 } }
            ]
        };
    } else if (inStock === 'false') {
        stockFilter = {
            $and: [
                { stockQuantity: { $lte: 0 } },
                {
                    $or: [
                        { variants: { $size: 0 } },
                        { 'variants.stockQuantity': { $lte: 0 } }
                    ]
                }
            ]
        };
    }

    // Combine filters
    const finalFilter = { ...filter };
    if (Object.keys(stockFilter).length > 0) {
        if (finalFilter.$or && stockFilter.$or) {
            // If both have $or, combine them with $and
            finalFilter.$and = [
                { $or: finalFilter.$or },
                { $or: stockFilter.$or }
            ];
            delete finalFilter.$or;
        } else if (finalFilter.$or && stockFilter.$and) {
            finalFilter.$and = [
                { $or: finalFilter.$or },
                ...stockFilter.$and
            ];
            delete finalFilter.$or;
        } else {
            Object.assign(finalFilter, stockFilter);
        }
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort options
    const sortOptions = {
        'newest': { createdAt: -1 },
        'oldest': { createdAt: 1 },
        'name-asc': { name: 1 },
        'name-desc': { name: -1 },
        'price-asc': { basePrice: 1 },
        'price-desc': { basePrice: -1 },
        'stock-asc': { stockQuantity: 1 },
        'stock-desc': { stockQuantity: -1 }
    };

    const sortConfig = sortOptions[sort] || { createdAt: -1 };

    // Execute query
    const products = await Product.find(finalFilter)
        .select('name slug brand categories tags condition label isActive status description definition images basePrice mrp offerPrice discountPercentage taxRate sku barcode stockQuantity variantConfiguration variants specifications features dimensions weight warranty reviews averageRating totalReviews meta canonicalUrl linkedProducts notes hsn manufacturerImages createdAt updatedAt')
        .populate("categories", "name slug")
        .populate("brand", "name slug")
        .sort(sortConfig)
        .skip(skip)
        .limit(Number(limit));

    const totalProducts = await Product.countDocuments(finalFilter);

    res.status(200).json({
        success: true,
        results: products.length,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: Number(page),
        products
    });
});

exports.getProductsForSelection = catchAsyncErrors(async (req, res, next) => {
    const { search, category, brand, inStock } = req.query;

    const filter = {
        isActive: true,
        status: 'Published'
    };

    // Search filter
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        filter.categories = { $in: [category] };
    }

    // Brand filter
    if (brand) {
        filter.brand = brand;
    }

    // Stock filter
    if (inStock === 'true') {
        filter.$or = [
            { stockQuantity: { $gt: 0 } },
            { 'variants.stockQuantity': { $gt: 0 } }
        ];
    }

    const products = await Product.find(filter)
        .select('name sku images basePrice offerPrice stockQuantity brand categories isActive status')
        .populate('brand', 'name')
        .populate('categories', 'name')
        .sort({ name: 1 })
        .limit(50); // Limit for performance

    res.status(200).json({
        success: true,
        count: products.length,
        products
    });
});
// ADMIN: Get single product by ID

exports.getAdminProductById = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// Add to productController.js
exports.getProductAnalytics = catchAsyncErrors(async (req, res, next) => {
    // Total products
    const totalProducts = await Product.countDocuments();

    // Low stock products (stock < 10)
    const lowStockItems = await Product.countDocuments({
        $or: [
            { stockQuantity: { $lt: 10 } },
            { 'variants.stockQuantity': { $lt: 10 } }
        ]
    });

    // Out of stock products
    const outOfStockItems = await Product.countDocuments({
        $or: [
            { stockQuantity: { $lte: 0 } },
            {
                $and: [
                    { variants: { $exists: true, $ne: [] } },
                    { 'variants.stockQuantity': { $lte: 0 } }
                ]
            }
        ]
    });

    // Active products
    const activeProducts = await Product.countDocuments({
        status: 'active',
        isActive: true
    });

    // Top selling products (you might need to enhance this with actual sales data)
    const topSellingProducts = await Product.find({
        status: 'active'
    })
        .select('name images slug basePrice stockQuantity totalReviews averageRating')
        .sort({ totalReviews: -1 })
        .limit(5)
        .populate('categories', 'name')
        .populate('brand', 'name');

    res.status(200).json({
        success: true,
        data: {
            totalProducts,
            lowStockItems,
            outOfStockItems,
            activeProducts,
            inactiveProducts: totalProducts - activeProducts,
            topSellingProducts: topSellingProducts.map(product => ({
                id: product._id,
                name: product.name,
                image: product.images?.[0]?.url || null,
                price: product.basePrice,
                stock: product.stockQuantity,
                reviews: product.totalReviews || 0,
                rating: product.averageRating || 0,
                category: product.categories?.[0]?.name || 'Uncategorized',
                brand: product.brand?.name || 'No Brand'
            }))
        }
    });
});


// ADMIN: Delete product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});


// ADMIN: Add variant to a product

exports.addVariant = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const { name, price, stock, attributes } = req.body;
    if (!name || price == null || stock == null) {
        return next(new ErrorHandler("Variant name, price, and stock are required.", 400));
    }

    const variant = {
        _id: new mongoose.Types.ObjectId(),
        name,
        price,
        stock,
        attributes: attributes || {},
    };

    product.variants.push(variant);
    await product.save();

    res.status(201).json({
        success: true,
        message: "Variant added successfully",
        variant,
    });
});


// ADMIN: Update variant

exports.updateVariant = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return next(new ErrorHandler("Variant not found", 404));
    }

    const { name, price, stock, attributes } = req.body;
    if (name !== undefined) variant.name = name;
    if (price !== undefined) variant.price = price;
    if (stock !== undefined) variant.stock = stock;
    if (attributes !== undefined) variant.attributes = attributes;

    await product.save();

    res.status(200).json({
        success: true,
        message: "Variant updated successfully",
        variant,
    });
});


// ADMIN: Delete variant

exports.deleteVariant = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return next(new ErrorHandler("Variant not found", 404));
    }

    variant.deleteOne();
    await product.save();

    res.status(200).json({
        success: true,
        message: "Variant deleted successfully",
    });
});

// Even better - normalize the status in the query
exports.getProductsByIds = catchAsyncErrors(async (req, res, next) => {
    const { ids } = req.query;
    if (!ids) {
        return next(new ErrorHandler('Product IDs are required', 400));
    }

    const productIds = Array.isArray(ids) ? ids : ids.split(',');
    const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
        return res.status(200).json({
            success: true,
            count: 0,
            products: []
        });
    }

    try {
        // 🆕 BEST FIX: Use regex for case-insensitive status matching
        const products = await Product.find({
            _id: { $in: validIds },
            isActive: true,
            status: { $regex: /^published$/i } // Case insensitive match
        })
            .populate('brand', 'name slug')
            .populate('categories', 'name slug')
            .select('name slug brand categories images basePrice offerPrice discountPercentage stockQuantity variants variantConfiguration averageRating totalReviews tags isActive status condition')
            .limit(50);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error('💥 Database error:', error);
        return next(new ErrorHandler('Database error while fetching products', 500));
    }
});