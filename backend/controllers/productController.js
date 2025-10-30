const Product = require("../models/productModel");
const ErrorHandler = require('../utils/errorHandler')
const categoryModel = require("../models/categoryModel");
const brandModel = require("../models/brandModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");


// =====================================================
// GET ALL PRODUCTS (Simple catalog - for basic listing)
// =====================================================
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            sort = 'createdAt',
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

        // Price filter - ADD VALIDATION
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

        // ... rest of your existing filter code ...

        // ADD VALIDATION FOR PAGE AND LIMIT
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Cap at 100 for safety

        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const products = await Product.find(filter)
            .select('name slug brand categories images basePrice offerPrice discountPercentage stockQuantity hasVariants averageRating totalReviews')
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

// =======-*==============================================
// GET PRODUCTS WITH ADVANCED FILTERING (Main endpoint)
// =====================================================
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

// =====================================================
// GET PRODUCTS BY CATEGORY (SIMPLIFIED - NO MODELS REQUIRED)
// =====================================================
exports.getProductsByCategory = catchAsyncErrors(async (req, res, next) => {
    const { categoryName } = req.params;
    const {
        page = 1,
        limit = 12,
        sort = 'createdAt',
        order = 'desc',
        minPrice,
        maxPrice,
        inStock,
        brands
    } = req.query;


    // SIMPLE FILTER - No Category model required
    const filter = {
        isActive: true
    };

    // Filter by category name in categories array
    filter['categories.name'] = { $regex: new RegExp(categoryName, 'i') };

    // Price filter
    if (minPrice || maxPrice) {
        filter.basePrice = {};
        if (minPrice) filter.basePrice.$gte = Number(minPrice);
        if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
        filter.$or = [
            { stockQuantity: { $gt: 0 } },
            { 'variants.stockQuantity': { $gt: 0 } }
        ];
    }

    // Brand filter
    if (brands) {
        const brandArray = Array.isArray(brands) ? brands : brands.split(',');
        filter['brand.name'] = { $in: brandArray };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sort] = order === 'desc' ? -1 : 1;


    // Execute query
    const products = await Product.find(filter)
        .populate("categories brand")
        .sort(sortConfig)
        .skip(skip)
        .limit(Number(limit));

    if (!products || products.length === 0) {
        return next(new ErrorHandler("No products found for this category", 404));
    }

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
        success: true,
        results: products.length,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: Number(page),
        category: {
            name: categoryName.replace(/-/g, ' ')
        },
        products
    });
});

// =====================================================
// GET PRODUCTS BY BRAND (SIMPLIFIED - NO MODELS REQUIRED)
// =====================================================
exports.getProductsByBrand = catchAsyncErrors(async (req, res, next) => {
    const { brandName } = req.params;
    const {
        page = 1,
        limit = 12,
        sort = 'createdAt',
        order = 'desc',
        minPrice,
        maxPrice,
        inStock,
        categories
    } = req.query;


    // SIMPLE FILTER - No Brand model required
    const filter = {
        isActive: true
    };

    // Filter by brand name
    filter['brand.name'] = { $regex: new RegExp(brandName, 'i') };

    // Price filter
    if (minPrice || maxPrice) {
        filter.basePrice = {};
        if (minPrice) filter.basePrice.$gte = Number(minPrice);
        if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
        filter.$or = [
            { stockQuantity: { $gt: 0 } },
            { 'variants.stockQuantity': { $gt: 0 } }
        ];
    }

    // Category filter
    if (categories) {
        const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
        filter['categories.name'] = { $in: categoryArray };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sort] = order === 'desc' ? -1 : 1;
    // Execute query
    const products = await Product.find(filter)
        .populate("categories brand")
        .sort(sortConfig)
        .skip(skip)
        .limit(Number(limit));

    if (!products || products.length === 0) {
        return next(new ErrorHandler("No products found for this brand", 404));
    }

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
        success: true,
        results: products.length,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: Number(page),
        brand: {
            name: brandName.replace(/-/g, ' ')
        },
        products
    });
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

// =====================================================
// SEARCH PRODUCTS BY NAME / TAGS / DESCRIPTION
// =====================================================
exports.searchProducts = catchAsyncErrors(async (req, res, next) => {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
        return next(new ErrorHandler("Query parameter 'q' is required for search", 400));
    }

    const regex = new RegExp(q, "i");
    const products = await Product.find({
        $or: [
            { name: regex },
            { "additionalInfo.tags": regex },
            { description: regex }
        ]
    }).populate("category brand");

    if (!products || products.length === 0) return next(new ErrorHandler("No products match your search", 404));

    res.status(200).json({ success: true, results: products.length, products });
});

// =====================================================
// FILTER PRODUCTS: price, rating, availability, condition
// =====================================================
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

// =====================================================
// GET ALL VARIANTS OF A PRODUCT
// =====================================================
exports.getProductVariants = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(id, "variants");
    if (!product) return next(new ErrorHandler("Product not found", 404));

    res.status(200).json({ success: true, variants: product.variants || [] });
});

// =====================================================
// GET ALL REVIEWS OF A PRODUCT
// =====================================================
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(id, "reviews").populate("reviews.user", "firstName lastName avatar");
    if (!product) return next(new ErrorHandler("Product not found", 404));

    res.status(200).json({ success: true, reviews: product.reviews || [] });
});

// 🟢 GET ALL PRODUCTS WITH REVIEWS (Admin)
exports.getProductsWithReviews = catchAsyncErrors(async (req, res, next) => {
    const { search = '' } = req.query;

    try {
        // Find all products
        const products = await Product.find()
            .populate('reviews.user', 'firstName lastName email avatar')
            .select('name images reviews ratings numOfReviews')
            .sort({ createdAt: -1 })
            .lean();

        // Filter products that have reviews and match search
        const productsWithReviews = products
            .filter(product => {
                const hasReviews = product.reviews && product.reviews.length > 0;
                const matchesSearch = !search ||
                    product.name.toLowerCase().includes(search.toLowerCase());
                return hasReviews && matchesSearch;
            })
            .map(product => {
                const reviews = product.reviews || [];

                // Calculate average rating from actual reviews
                const averageRating = reviews.length > 0
                    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
                    : 0;

                // Ensure each review has proper data
                const safeReviews = reviews.map((review, index) => ({
                    _id: review._id ? review._id.toString() : `temp-${product._id}-${index}`,
                    user: {
                        _id: review.user?._id || 'unknown',
                        firstName: review.user?.firstName || 'Unknown',
                        lastName: review.user?.lastName || 'User',
                        email: review.user?.email || 'No email',
                        avatar: review.user?.avatar
                    },
                    rating: review.rating || 0,
                    comment: review.comment || '',
                    createdAt: review.createdAt || new Date(),
                    updatedAt: review.updatedAt || new Date()
                }));

                return {
                    _id: product._id,
                    name: product.name,
                    image: product.images?.[0]?.url || null,
                    reviews: safeReviews,
                    averageRating: Number(averageRating.toFixed(1)),
                    totalReviews: safeReviews.length
                };
            });

        res.status(200).json({
            success: true,
            products: productsWithReviews,
            count: productsWithReviews.length
        });

    } catch (error) {
        console.error('Error in getProductsWithReviews:', error);
        return next(new ErrorHandler('Failed to fetch products with reviews', 500));
    }
});
// 🟢 GET PRODUCT REVIEWS WITH CORRECT IDs FOR ADMIN
exports.getProductReviewsForAdmin = catchAsyncErrors(async (req, res, next) => {
    const { id: productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Get the actual review IDs from the product (without population first)
    const reviewIds = product.reviews.map(review => review._id.toString());

    console.log('Actual review IDs in product:', reviewIds);

    // Now populate with the correct IDs
    await product.populate('reviews.user', 'firstName lastName email avatar');

    const reviews = product.reviews.map(review => ({
        _id: review._id.toString(), // This should be the correct ID now
        user: review.user,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
    }));

    res.status(200).json({
        success: true,
        reviews: reviews,
        averageRating: product.averageRating,
        totalReviews: product.totalReviews,
        debug: {
            actualReviewIds: reviewIds,
            sentReviewIds: reviews.map(r => r._id)
        }
    });
});
// 🟢 GET ALL REVIEWS FOR A PRODUCT (Public) - Debug version
exports.getReviews = catchAsyncErrors(async (req, res, next) => {
    const { id: productId } = req.params;

    console.log('=== GET REVIEWS DEBUG ===');
    console.log('Product ID:', productId);

    const product = await Product.findById(productId)
        .populate('reviews.user', 'firstName lastName email avatar');

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    console.log('Product reviews (raw):', product.reviews);
    console.log('Review IDs in product:', product.reviews.map(r => r._id.toString()));

    const reviewsWithCorrectIds = product.reviews.map(review => ({
        _id: review._id.toString(),
        user: review.user,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
    }));

    console.log('Sending reviews:', reviewsWithCorrectIds.map(r => r._id));
    console.log('=== END DEBUG ===');

    res.status(200).json({
        success: true,
        reviews: reviewsWithCorrectIds,
        averageRating: product.averageRating,
        totalReviews: product.totalReviews
    });
});
// 🟢 GET SINGLE REVIEW (Public)
exports.getReview = catchAsyncErrors(async (req, res, next) => {
    const { id: productId, reviewId } = req.params;

    // Validate IDs format
    if (!productId.match(/^[0-9a-fA-F]{24}$/) || !reviewId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid ID format", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Populate user details
    await product.populate('reviews.user', 'firstName lastName email avatar');

    res.status(200).json({
        success: true,
        review: product.reviews.id(reviewId) // Get populated review
    });
});



exports.addReview = catchAsyncErrors(async (req, res, next) => {
    const { rating, comment } = req.body;
    const { id: productId } = req.params;

    // Validation
    if (!rating) {
        return next(new ErrorHandler("Rating is required", 400));
    }

    if (rating < 1 || rating > 5) {
        return next(new ErrorHandler("Rating must be between 1 and 5", 400));
    }

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
    }

    // ✅ FIXED: Use await and proper variable name
    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Check if product is active
    if (!product.isActive || product.status !== 'Published') {
        return next(new ErrorHandler("Cannot review an inactive product", 400));
    }

    // Check if user already reviewed (case-insensitive comparison)
    const existingReview = product.reviews.find(
        rev => rev.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
        return next(new ErrorHandler("You have already reviewed this product", 400));
    }

    const newReview = {
        user: req.user._id,
        rating: Number(rating),
        comment: (comment || "").trim(),
        createdAt: new Date()
    };

    product.reviews.push(newReview);

    // ✅ FIXED: Remove the updateRating() call - post-save hook handles this automatically
    // await product.updateRating(); // ❌ REMOVED THIS LINE

    await product.save({ validateBeforeSave: false });

    // ✅ FIXED: Populate with correct user fields
    await product.populate('reviews.user', 'firstName lastName email avatar');

    const addedReview = product.reviews[product.reviews.length - 1];

    res.status(201).json({
        success: true,
        message: "Review added successfully",
        review: addedReview,
        product: {
            _id: product._id,
            name: product.name,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews
        }
    });
});

// 🟡 DELETE REVIEW - Fixed for embedded reviews (no reviewId needed)
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { id: productId } = req.params; // ✅ FIXED: Only productId, no reviewId

    // Validate product ID
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // ✅ FIXED: Find review by user ID instead of reviewId
    const reviewIndex = product.reviews.findIndex(
        rev => rev.user.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const review = product.reviews[reviewIndex];

    // Check permissions: user must be review owner OR admin
    const isReviewOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isReviewOwner && !isAdmin) {
        return next(new ErrorHandler("You can only delete your own reviews", 403));
    }

    // Remove the review
    product.reviews.splice(reviewIndex, 1);

    // ✅ FIXED: Let pre-save hook handle rating update instead of updateRating()
    // await product.updateRating();

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        deletedBy: isAdmin ? 'admin' : 'user',
        product: {
            _id: product._id,
            name: product.name,
            averageRating: product.averageRating, // ✅ FIXED: Changed from ratings
            totalReviews: product.totalReviews    // ✅ FIXED: Changed from numOfReviews
        }
    });
});

// 🟡 UPDATE REVIEW - Already correct in your code, just ensure field names match
exports.updateReview = catchAsyncErrors(async (req, res, next) => {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
        return next(new ErrorHandler("Rating must be between 1 and 5", 400));
    }

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Find review by user ID
    const reviewIndex = product.reviews.findIndex(
        rev => rev.user.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const review = product.reviews[reviewIndex];

    // Check permissions
    const isReviewOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isReviewOwner && !isAdmin) {
        return next(new ErrorHandler("You can only update your own reviews", 403));
    }

    // Update fields if provided
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment.trim();

    // Update timestamp
    review.createdAt = new Date();

    await product.save({ validateBeforeSave: false });

    // Populate user details
    await product.populate('reviews.user', 'firstName lastName email avatar');

    res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review: product.reviews[reviewIndex],
        updatedBy: isAdmin ? 'admin' : 'user',
        product: {
            _id: product._id,
            name: product.name,
            averageRating: product.averageRating, // ✅ FIXED: Changed from ratings
            totalReviews: product.totalReviews    // ✅ FIXED: Changed from numOfReviews
        }
    });
});

// 🟣 ADMIN: DELETE ANY REVIEW (Debug version)
exports.adminDeleteReview = catchAsyncErrors(async (req, res, next) => {
    const { id: productId, reviewId } = req.params;

    console.log('Delete review request:', { productId, reviewId });

    if (!productId.match(/^[0-9a-fA-F]{24}$/) || !reviewId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler("Invalid ID format", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    console.log('Product found:', product.name);
    console.log('Product reviews:', product.reviews.map(r => ({ id: r._id, rating: r.rating })));

    const reviewIndex = product.reviews.findIndex(rev => rev._id.toString() === reviewId);
    console.log('Review index found:', reviewIndex);

    if (reviewIndex === -1) {
        console.log('Review not found in product reviews');
        return next(new ErrorHandler("Review not found", 404));
    }

    // Store review info for response
    const deletedReview = product.reviews[reviewIndex];

    // Remove the review
    product.reviews.splice(reviewIndex, 1);

    // Update product rating statistics
    await product.updateRating();

    await product.save({ validateBeforeSave: false });

    console.log('Review deleted successfully');

    res.status(200).json({
        success: true,
        message: "Review deleted by admin",
        deletedReview: {
            _id: deletedReview._id,
            user: deletedReview.user,
            rating: deletedReview.rating,
            comment: deletedReview.comment
        },
        product: {
            _id: product._id,
            name: product.name,
            ratings: product.ratings,
            numOfReviews: product.numOfReviews
        }
    });
});


// ADMIN: Create new product

// NOTE: Assumes 'Product', 'mongoose', 'catchAsyncErrors', and 'ErrorHandler' are imported.
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    // 💡 Destructure fields based on the EXACT Mongoose schema structure 💡
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
        // Price/Tax/Stock fields
        basePrice,
        offerPrice,
        discountPercentage,
        taxRate,
        sku,
        barcode,
        stockQuantity,
        // 🆕 VARIANT CONFIGURATION (new field)
        variantConfiguration,
        // 🆕 VARIANTS (now includes identifyingAttributes)
        variants,
        specifications,
        features,
        // Image structure (nested under images)
        images, // 🆕 CHANGED: Now expecting nested images object
        // Dimensions & Weight
        dimensions,
        weight,
        warranty,
        // Reviews (if creating with initial reviews)
        reviews,
        // SEO/Meta
        meta,
        canonicalUrl,
        linkedProducts,
        notes
    } = req.body;

    // --- 1. ESSENTIAL FIELD VALIDATION ---
    if (!name || !description || !brand || !categories || categories.length === 0 || !basePrice || !images?.thumbnail) {
        return next(new ErrorHandler("Missing required fields: name, description, brand, categories, basePrice, or thumbnail image.", 400));
    }

    let brandId;

    if (brand) {
        if (mongoose.Types.ObjectId.isValid(brand)) {
            brandId = brand; // ObjectId case
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

    // --- 2️⃣ Category Handling ---
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

    // --- 4. ENHANCED VARIANT CONFIGURATION VALIDATION (Color Support) ---
    let finalVariantConfig = {
        hasVariants: false,
        variantType: 'None',
        variantCreatingSpecs: [],
        variantAttributes: []
    };

    if (variantConfiguration) {
        finalVariantConfig = {
            hasVariants: variantConfiguration.hasVariants || false,
            variantType: variantConfiguration.variantType || 'None',
            variantCreatingSpecs: variantConfiguration.variantCreatingSpecs || [],
            variantAttributes: variantConfiguration.variantAttributes || []
        };

        // 🆕 Validate variantType enum
        const validVariantTypes = ['None', 'Specifications', 'Attributes', 'Mixed', 'Color'];
        if (!validVariantTypes.includes(finalVariantConfig.variantType)) {
            return next(new ErrorHandler(`Invalid variantType. Must be one of: ${validVariantTypes.join(', ')}`, 400));
        }

        // 🆕 ENHANCED: Validate variant structure if variants are provided
        if (finalVariantConfig.hasVariants && variants && variants.length > 0) {
            const seenSKUs = new Set();
            const seenBarcodes = new Set();

            for (const [index, variant] of variants.entries()) {
                // Basic validation
                if (!variant.name || !variant.price || !variant.identifyingAttributes) {
                    return next(new ErrorHandler(`Variant at index ${index} must have name, price, and identifyingAttributes.`, 400));
                }

                // Validate SKU uniqueness
                if (variant.sku) {
                    if (seenSKUs.has(variant.sku)) {
                        return next(new ErrorHandler(`Duplicate SKU found: ${variant.sku}`, 400));
                    }
                    seenSKUs.add(variant.sku);
                }

                // Validate barcode uniqueness
                if (variant.barcode) {
                    if (seenBarcodes.has(variant.barcode)) {
                        return next(new ErrorHandler(`Duplicate barcode found: ${variant.barcode}`, 400));
                    }
                    seenBarcodes.add(variant.barcode);
                }

                // Validate identifyingAttributes structure
                if (!Array.isArray(variant.identifyingAttributes) || variant.identifyingAttributes.length === 0) {
                    return next(new ErrorHandler(`Variant "${variant.name}" must have at least one identifying attribute.`, 400));
                }

                // 🆕 ENHANCED: Validate and enhance identifying attributes
                for (const attr of variant.identifyingAttributes) {
                    if (!attr.key || !attr.label || !attr.value) {
                        return next(new ErrorHandler(`Variant "${variant.name}" has invalid identifying attributes. Each must have key, label, and value.`, 400));
                    }

                    // 🆕 AUTO-ENHANCE: Add color properties if this is a color attribute
                    if (attr.key === 'color' || attr.key.toLowerCase().includes('color')) {
                        attr.isColor = true;

                        // Auto-generate displayValue if not provided
                        if (!attr.displayValue) {
                            attr.displayValue = attr.value.charAt(0).toUpperCase() + attr.value.slice(1);
                        }

                        // Auto-generate hexCode if not provided
                        if (!attr.hexCode) {
                            attr.hexCode = getColorHexCode(attr.value);
                        }
                    }
                }

                // 🆕 Validate variant images structure
                if (variant.images) {
                    if (variant.images.thumbnail && (!variant.images.thumbnail.url || !variant.images.thumbnail.altText)) {
                        return next(new ErrorHandler(`Variant "${variant.name}" thumbnail requires both url and altText.`, 400));
                    }

                    if (variant.images.gallery) {
                        for (const galleryImage of variant.images.gallery) {
                            if (!galleryImage.url || !galleryImage.altText) {
                                return next(new ErrorHandler(`Variant "${variant.name}" gallery images require both url and altText.`, 400));
                            }
                        }
                    }
                }

                // 🆕 Validate stock quantity
                if (typeof variant.stockQuantity !== 'number' || variant.stockQuantity < 0) {
                    return next(new ErrorHandler(`Variant "${variant.name}" must have a valid stockQuantity (number >= 0).`, 400));
                }
            }

            // 🆕 AUTO-SYNC: Sync variantAttributes with actual variants
            if (finalVariantConfig.variantAttributes && finalVariantConfig.variantAttributes.length > 0) {
                finalVariantConfig.variantAttributes.forEach(attrConfig => {
                    if (attrConfig.values && Array.isArray(attrConfig.values)) {
                        // Extract unique values from actual variants
                        const actualValues = new Set();
                        variants.forEach(variant => {
                            variant.identifyingAttributes.forEach(attr => {
                                if (attr.key === attrConfig.key) {
                                    actualValues.add(attr.value);
                                }
                            });
                        });

                        // Update variantAttributes with actual values
                        attrConfig.values = Array.from(actualValues);
                    }
                });
            }
        }
    }

    // --- 5. IMAGES VALIDATION & PROCESSING ---
    const productImages = {
        thumbnail: images.thumbnail,
        hoverImage: images.hoverImage || null,
        gallery: images.gallery || []
    };

    // Validate required thumbnail
    if (!productImages.thumbnail || !productImages.thumbnail.url || !productImages.thumbnail.altText) {
        return next(new ErrorHandler("Thumbnail image requires both url and altText.", 400));
    }

    // Validate gallery images structure
    if (productImages.gallery.length > 0) {
        for (const galleryImage of productImages.gallery) {
            if (!galleryImage.url || !galleryImage.altText) {
                return next(new ErrorHandler("All gallery images require both url and altText.", 400));
            }
        }
    }

    // --- 6. AUTO-GENERATE SKU IF NOT PROVIDED ---
    let finalSku = sku;
    if (!finalSku) {
        finalSku = generateSKUFromName(name);
    }

    // --- 7. ENHANCE VARIANTS WITH DEFAULTS ---
    let enhancedVariants = variants || [];
    if (finalVariantConfig.hasVariants && enhancedVariants.length > 0) {
        enhancedVariants = enhancedVariants.map(variant => ({
            ...variant,
            // Ensure required fields
            isActive: variant.isActive !== undefined ? variant.isActive : true,
            offerPrice: variant.offerPrice || 0,
            // Ensure images structure
            images: variant.images || {
                thumbnail: productImages.thumbnail, // Fallback to product thumbnail
                gallery: []
            },
            // Ensure specifications
            specifications: variant.specifications || []
        }));
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

        // 🆕 CHANGED: Images structure matches schema
        images: productImages,

        // Pricing and Stock
        basePrice,
        offerPrice: offerPrice || 0,
        discountPercentage: discountPercentage || 0,
        taxRate: taxRate || 0,
        sku: finalSku,
        barcode: barcode || '',
        stockQuantity: finalVariantConfig.hasVariants ? 0 : (stockQuantity || 0),

        // 🆕 VARIANT CONFIGURATION (new field)
        variantConfiguration: finalVariantConfig,

        // 🆕 ENHANCED: Variants with color support
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

        // 🆕 Reviews (if provided)
        reviews: reviews || [],

        // SEO/Meta
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

// 🆕 HELPER FUNCTION: Generate SKU from product name
function generateSKUFromName(productName) {
    const base = productName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .substring(0, 6);

    const timestamp = Date.now().toString().slice(-4);
    return `${base}-${timestamp}`;
}

// 🆕 HELPER FUNCTION: Get hex code from color name
function getColorHexCode(colorName) {
    const colorMap = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'green': '#008000',
        'black': '#000000',
        'white': '#FFFFFF',
        'gray': '#808080',
        'grey': '#808080',
        'silver': '#C0C0C0',
        'gold': '#FFD700',
        'purple': '#800080',
        'pink': '#FFC0CB',
        'orange': '#FFA500',
        'yellow': '#FFFF00',
        'brown': '#A52A2A',
        'navy': '#000080',
        'teal': '#008080',
        'maroon': '#800000',
        'burgundy': '#800020',
        'beige': '#F5F5DC',
        'cream': '#FFFDD0',
        'ivory': '#FFFFF0'
    };

    return colorMap[colorName.toLowerCase()] || '#CCCCCC';
}

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

    // Brand filter - fix this line
    if (brand) {
        filter.brand = brand; // Single ID, not array
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
        .select('name slug brand categories tags condition label isActive status description definition images basePrice offerPrice discountPercentage taxRate sku barcode stockQuantity variantConfiguration variants specifications features dimensions weight warranty reviews averageRating totalReviews meta canonicalUrl linkedProducts notes createdAt updatedAt')
        .populate("categories", "name slug")
        .populate("brand", "name slug")
        .sort(sortConfig)
        .skip(skip)
        .limit(Number(limit));


    const totalProducts = await Product.countDocuments(finalFilter); // Use finalFilter here

    res.status(200).json({
        success: true,
        results: products.length,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: Number(page),
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


// ADMIN: Update product

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Validate fields (avoid overwriting with invalid or empty data)
    const allowedUpdates = ["name", "price", "description", "category", "stock", "images"];
    const updates = {};
    for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    product = await Product.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        product,
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
