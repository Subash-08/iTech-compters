const Product = require("../models/productModel");
const ErrorHandler = require('../utils/errorHandler');
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");
const Wishlist = require("../models/wishlistModel");
const User = require("../models/userModel");

// ==================== USER WISHLIST CONTROLLERS ====================


// @desc    Remove item from wishlist
// @route   DELETE /api/v1/wishlist/remove/:productId
// @access  Private
// controllers/wishlistController.js - UPDATE removeFromWishlist
exports.removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params; // ✅ Get from params, not body
    const userId = req.user._id;
    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    // Find wishlist by userId
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
        return next(new ErrorHandler('Wishlist not found', 404));
    }

    try {
        await wishlist.removeItem(productId);

        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.product',
                select: 'name images price slug stock discountPrice brand category',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'category', select: 'name' }
                ]
            });

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist',
            data: updatedWishlist
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 404));
    }
});

// controllers/wishlistController.js

// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
// @access  Private
exports.getMyWishlist = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // Fix: Use proper population without wishlistId
    const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: 'items.product',
            select: 'name images price slug stock brand category discountPrice ratings',
            populate: [
                { path: 'brand', select: 'name' },
                { path: 'category', select: 'name' }
            ]
        });

    if (!wishlist) {
        // Create an empty wishlist if it doesn't exist
        const newWishlist = await Wishlist.create({ userId, items: [] });
        return res.status(200).json({
            success: true,
            count: 0,
            data: newWishlist
        });
    }

    res.status(200).json({
        success: true,
        count: wishlist.items.length,
        data: wishlist
    });
});

// @desc    Check if product is in wishlist
// @route   GET /api/v1/wishlist/check/:productId
// @access  Private
exports.checkWishlistItem = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    // Fix: Check directly in Wishlist collection
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        return res.status(200).json({
            success: true,
            isInWishlist: false,
            message: 'Product is not in wishlist'
        });
    }

    const isInWishlist = wishlist.items.some(item =>
        item.product.toString() === productId
    );

    res.status(200).json({
        success: true,
        isInWishlist,
        message: isInWishlist ? 'Product is in wishlist' : 'Product is not in wishlist'
    });
});

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist/add
// @access  Private
exports.addToWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = await Wishlist.create({ userId, items: [] });

        // Update user's wishlistId reference
        await User.findByIdAndUpdate(userId, { wishlistId: wishlist._id });
    }

    // Check if product already in wishlist
    const existingItem = wishlist.items.find(item =>
        item.product.toString() === productId
    );

    if (existingItem) {
        return next(new ErrorHandler('Product already in wishlist', 400));
    }

    // Add to wishlist
    wishlist.items.push({
        product: productId,
        addedAt: new Date()
    });

    await wishlist.save();

    // Populate the response
    const populatedWishlist = await Wishlist.findById(wishlist._id)
        .populate({
            path: 'items.product',
            select: 'name images price slug stock brand category discountPrice ratings',
            populate: [
                { path: 'brand', select: 'name' },
                { path: 'category', select: 'name' }
            ]
        });

    res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        data: {
            wishlist: populatedWishlist // Consistent structure
        }
    });
});

// @desc    Clear entire wishlist
// @route   DELETE /api/v1/wishlist/clear
// @access  Private
exports.clearWishlist = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId).populate('wishlistId');
    if (!user || !user.wishlistId) {
        return next(new ErrorHandler('Wishlist not found', 404));
    }

    const wishlist = await Wishlist.findById(user.wishlistId);
    await wishlist.clearWishlist();

    res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        data: {
            wishlist: populatedWishlist // Consistent structure
        }
    });
});

// ==================== ADMIN WISHLIST CONTROLLERS ====================

// @desc    Get wishlist of any user (Admin)
// @route   GET /api/v1/admin/wishlist/user/:userId
// @access  Private/Admin
exports.getUserWishlist = catchAsyncErrors(async (req, res, next) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new ErrorHandler('Invalid user ID', 400));
    }

    const user = await User.findById(userId).populate({
        path: 'wishlistId',
        populate: {
            path: 'items.product',
            select: 'name images price slug stock brand category discountPrice ratings',
            populate: [
                { path: 'brand', select: 'name' },
                { path: 'category', select: 'name' }
            ]
        }
    });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    if (!user.wishlistId) {
        return next(new ErrorHandler('Wishlist not found for this user', 404));
    }

    res.status(200).json({
        success: true,
        user: {
            _id: user._id,
            name: user.firstName + ' ' + user.lastName,
            email: user.email
        },
        count: user.wishlistId.items.length,
        data: user.wishlistId
    });
});

// @desc    Get all wishlists with pagination and filtering (Admin)
// @route   GET /api/v1/admin/wishlists
// @access  Private/Admin
exports.getAllWishlists = catchAsyncErrors(async (req, res, next) => {
    const resultsPerPage = parseInt(req.query.limit) || 20;
    const currentPage = parseInt(req.query.page) || 1;

    // Build query for wishlists with item count
    const wishlists = await Wishlist.find()
        .populate('userId', 'firstName lastName email avatar')
        .populate('items.product', 'name price images')
        .sort({ lastUpdated: -1 })
        .skip(resultsPerPage * (currentPage - 1))
        .limit(resultsPerPage);

    const totalCount = await Wishlist.countDocuments();
    const totalWishlistItems = await Wishlist.aggregate([
        {
            $group: {
                _id: null,
                totalItems: { $sum: '$itemCount' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        count: wishlists.length,
        totalCount,
        totalWishlistItems: totalWishlistItems[0]?.totalItems || 0,
        resultsPerPage,
        currentPage,
        data: wishlists
    });
});

