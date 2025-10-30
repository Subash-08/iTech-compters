const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

// =====================================================
// 🟢 PUBLIC ROUTES
// =====================================================

// GET ALL REVIEWS OF A PRODUCT (Public)
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    // Get reviews from separate collection
    const reviews = await Review.find({
        product: id,
        status: 'approved'
    }).populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        reviews: reviews
    });
});

// =====================================================
// 🔐 USER ROUTES (Logged-in users)
// =====================================================

// ADD REVIEW
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

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Check if product is active
    if (!product.isActive || product.status !== 'Published') {
        return next(new ErrorHandler("Cannot review an inactive product", 400));
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
        user: req.user._id,
        product: productId
    });

    if (existingReview) {
        return next(new ErrorHandler("You have already reviewed this product", 400));
    }

    // Create review in separate collection
    const review = await Review.create({
        user: req.user._id,
        product: productId,
        rating: Number(rating),
        comment: (comment || "").trim(),
        status: 'approved'
    });

    // Populate user data
    await review.populate('user', 'firstName lastName email avatar');

    // Update product review stats
    await product.updateReviewStats();

    res.status(201).json({
        success: true,
        message: "Review added successfully",
        review: review,
        product: {
            _id: product._id,
            name: product.name,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews
        }
    });
});

// UPDATE REVIEW
exports.updateReview = catchAsyncErrors(async (req, res, next) => {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
        return next(new ErrorHandler("Rating must be between 1 and 5", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Find review in separate collection
    const review = await Review.findOne({
        user: req.user._id,
        product: productId
    });

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Check permissions
    const isReviewOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isReviewOwner && !isAdmin) {
        return next(new ErrorHandler("You can only update your own reviews", 403));
    }

    // Update fields if provided
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment.trim();
    review.updatedAt = new Date();

    await review.save();

    // Update product review stats
    await product.updateReviewStats();

    await review.populate('user', 'firstName lastName email avatar');

    res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review: review,
        product: {
            _id: product._id,
            name: product.name,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews
        }
    });
});

// DELETE REVIEW (User's own review)
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { id: productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Find review in separate collection
    const review = await Review.findOne({
        user: req.user._id,
        product: productId
    });

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    // Check permissions
    const isReviewOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isReviewOwner && !isAdmin) {
        return next(new ErrorHandler("You can only delete your own reviews", 403));
    }

    // Delete from separate collection
    await Review.findByIdAndDelete(review._id);

    // Update product review stats
    await product.updateReviewStats();

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        product: {
            _id: product._id,
            name: product.name,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews
        }
    });
});

// =====================================================
// 👑 ADMIN ROUTES (Direct from Review model)
// =====================================================

// GET ALL REVIEWS FROM SEPARATE COLLECTION (Admin)
exports.getAdminReviews = catchAsyncErrors(async (req, res, next) => {
    const { page = 1, limit = 10, search = '', rating = '', status = '' } = req.query;

    // Build query
    const query = {};

    if (rating) {
        query.rating = parseInt(rating);
    }

    if (status) {
        query.status = status;
    }

    // Search functionality
    if (search) {
        query.$or = [
            { comment: { $regex: search, $options: 'i' } }
        ];
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
            {
                path: 'user',
                select: 'firstName lastName email avatar'
            },
            {
                path: 'product',
                select: 'name slug images'
            }
        ]
    };

    // Use pagination if available, otherwise use regular find
    let reviews;
    if (Review.paginate) {
        reviews = await Review.paginate(query, options);
    } else {
        const reviewsList = await Review.find(query)
            .populate('user', 'firstName lastName email avatar')
            .populate('product', 'name slug images')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) * parseInt(page))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Review.countDocuments(query);

        reviews = {
            docs: reviewsList,
            totalDocs: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        };
    }

    res.status(200).json({
        success: true,
        reviews: reviews.docs,
        pagination: {
            page: reviews.page,
            pages: reviews.totalPages,
            total: reviews.totalDocs
        }
    });
});

// ADMIN: DELETE REVIEW FROM SEPARATE COLLECTION
exports.adminDeleteReview = catchAsyncErrors(async (req, res, next) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return next(new ErrorHandler("Invalid review ID format", 400));
    }

    const review = await Review.findById(reviewId);

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const productId = review.product;

    // Delete from separate collection
    await Review.findByIdAndDelete(reviewId);

    // Update product review stats
    await Product.updateProductReviewStats(productId);

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        deletedReview: {
            _id: review._id,
            rating: review.rating,
            comment: review.comment
        }
    });
});

// =====================================================
// 🛠️ UTILITY/DEBUG ROUTES
// =====================================================

// DEBUG: Check current review stats
exports.debugReviewStats = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Get actual reviews count and average from database
    const reviewStats = await Review.aggregate([
        {
            $match: {
                product: product._id,
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$product',
                actualTotalReviews: { $sum: 1 },
                actualAverageRating: { $avg: '$rating' },
                ratings: { $push: '$rating' }
            }
        }
    ]);

    const actualStats = reviewStats.length > 0 ? reviewStats[0] : {
        actualTotalReviews: 0,
        actualAverageRating: 0,
        ratings: []
    };

    res.status(200).json({
        success: true,
        product: {
            _id: product._id,
            name: product.name,
            storedAverageRating: product.averageRating,
            storedTotalReviews: product.totalReviews,
            actualAverageRating: parseFloat(actualStats.actualAverageRating?.toFixed(1) || 0),
            actualTotalReviews: actualStats.actualTotalReviews,
            ratings: actualStats.ratings
        }
    });
});

// DEBUG: Force update review stats for a product
exports.forceUpdateReviewStats = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    await product.updateReviewStats();

    res.status(200).json({
        success: true,
        message: "Review stats updated successfully",
        product: {
            _id: product._id,
            name: product.name,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews
        }
    });
});