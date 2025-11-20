const Product = require("../models/productModel");
const ErrorHandler = require('../utils/errorHandler');
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");
const Wishlist = require("../models/wishlistModel");
const User = require("../models/userModel");
const PreBuiltPC = require('../models/preBuiltPCModel');

// Add Pre-built PC to wishlist
exports.addPreBuiltPCToWishlist = catchAsyncErrors(async (req, res, next) => {
    try {
        const { pcId } = req.body;

        if (!pcId) {
            return next(new ErrorHandler('Pre-built PC ID is required', 400));
        }

        // Check if PC exists and is active
        const preBuiltPC = await PreBuiltPC.findOne({
            _id: pcId,
            isActive: true
        });

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            // Create new wishlist if it doesn't exist
            wishlist = await Wishlist.create({
                user: req.user._id,
                items: [{
                    productType: 'prebuilt-pc',
                    preBuiltPC: pcId,
                    addedAt: new Date()
                }]
            });
        } else {
            // Check if PC is already in wishlist
            const existingItem = wishlist.items.find(item =>
                item.preBuiltPC && item.preBuiltPC.toString() === pcId
            );

            if (existingItem) {
                return next(new ErrorHandler('Pre-built PC is already in your wishlist', 400));
            }

            // Add PC to wishlist
            wishlist.items.push({
                productType: 'prebuilt-pc',
                preBuiltPC: pcId,
                addedAt: new Date()
            });
        }

        await wishlist.save();

        // Populate the wishlist with PC details
        await wishlist.populate('items.preBuiltPC', 'name images totalPrice discountPrice slug category performanceRating');

        res.status(200).json({
            success: true,
            message: 'Pre-built PC added to wishlist',
            data: wishlist
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// controllers/wishlistController.js - FIX PreBuiltPC removal population
exports.removePreBuiltPCFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { pcId } = req.params;
    const userId = req.user._id;

    if (!pcId) {
        return next(new ErrorHandler('Pre-built PC ID is required', 400));
    }

    // Find wishlist by userId
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
        return next(new ErrorHandler('Wishlist not found', 404));
    }

    try {
        await wishlist.removeItem(pcId);

        // 🛑 CRITICAL FIX: Properly populate BOTH product types after removal
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.product',
                select: 'name images basePrice offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'categories', select: 'name' }
                ]
            })
            .populate({
                path: 'items.preBuiltPC',
                select: 'name images totalPrice discountPrice slug category performanceRating condition specifications stockQuantity averageRating totalReviews',
                populate: [
                    { path: 'category', select: 'name' }
                ]
            });

        res.status(200).json({
            success: true,
            message: 'Pre-built PC removed from wishlist',
            data: updatedWishlist
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 404));
    }
});

// UPDATE: getWishlist function with data cleaning
exports.getWishlist = catchAsyncErrors(async (req, res, next) => {
    try {
        let wishlist = await Wishlist.findOne({ userId: req.user._id }) // ✅ Use userId
            .populate('items.product', 'name images basePrice offerPrice slug brand categories')
            .populate('items.preBuiltPC', 'name images totalPrice discountPrice slug category performanceRating');

        if (!wishlist) {
            wishlist = await Wishlist.create({
                userId: req.user._id, // ✅ Use userId
                items: []
            });
        } else {
            // ✅ Check and clean corrupted data automatically
            const hasCorruptedData = wishlist.items.some(item =>
                (item.productType === 'product' && (!item.product || !item.product._id)) ||
                (item.productType === 'prebuilt-pc' && (!item.preBuiltPC || !item.preBuiltPC._id)) ||
                (!item.productType) // Items without productType
            );

            if (hasCorruptedData) {
                wishlist.items = wishlist.items.filter(item =>
                    (item.productType === 'product' && item.product && item.product._id) ||
                    (item.productType === 'prebuilt-pc' && item.preBuiltPC && item.preBuiltPC._id)
                );
                await wishlist.save();
                // Re-populate after cleaning
                await wishlist.populate('items.product items.preBuiltPC');
            }
        }

        res.status(200).json({
            success: true,
            data: wishlist
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// @desc    Remove item from wishlist
// @route   DELETE /api/v1/wishlist/remove/:productId
// @access  Private
// controllers/wishlistController.js - IMPROVED removeFromWishlist
// controllers/wishlistController.js - ENSURE consistent population
exports.removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
        return next(new ErrorHandler('Wishlist not found', 404));
    }

    try {
        await wishlist.removeItem(productId);

        // 🛑 CRITICAL: Same population logic for both endpoints
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.product',
                select: 'name images basePrice offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'categories', select: 'name' }
                ]
            })
            .populate({
                path: 'items.preBuiltPC',
                select: 'name images totalPrice discountPrice slug category performanceRating condition specifications stockQuantity averageRating totalReviews',
                populate: [
                    { path: 'category', select: 'name' }
                ]
            });

        res.status(200).json({
            success: true,
            message: 'Item removed from wishlist',
            data: updatedWishlist
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 404));
    }
});

// controllers/wishlistController.js

// In your wishlistController.js - FIX THE POPULATION
exports.getMyWishlist = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // ✅ FIX: Add price fields to the population
    const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: 'items.product',
            select: 'name basePrice offerPrice discountPercentage stockQuantity images slug brand categories tags condition averageRating totalReviews description specifications', // ✅ ADD PRICE FIELDS
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
// controllers/wishlistController.js - CHECK addToWishlist
exports.addToWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            userId,
            items: []
        });
    }

    try {
        // Check if item already exists
        const existingItem = wishlist.items.find(item =>
            item.product && item.product.toString() === productId
        );

        if (existingItem) {
            return next(new ErrorHandler('Product already in wishlist', 400));
        }

        // Add the item
        wishlist.items.push({
            product: productId,
            productType: 'product',
            addedAt: new Date()
        });

        await wishlist.save();

        // 🛑 CRITICAL: Populate the response with product details
        const populatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.product',
                select: 'name images basePrice offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'categories', select: 'name' }
                ]
            })
            .populate({
                path: 'items.preBuiltPC',
                select: 'name images totalPrice discountPrice slug category performanceRating condition specifications stockQuantity averageRating totalReviews',
                populate: [
                    { path: 'category', select: 'name' }
                ]
            });

        res.status(200).json({
            success: true,
            message: 'Product added to wishlist',
            data: populatedWishlist // 🛑 Make sure this includes the new item
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// controllers/wishlistController.js - FIXED CLEAR WISHLIST
// @desc    Clear entire wishlist
// @route   DELETE /api/v1/wishlist/clear
// @access  Private
exports.clearWishlist = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // Find user's wishlist
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        // If no wishlist exists, create an empty one
        wishlist = await Wishlist.create({ userId, items: [] });

        // Update user's wishlistId reference
        await User.findByIdAndUpdate(userId, { wishlistId: wishlist._id });

        return res.status(200).json({
            success: true,
            message: 'Wishlist cleared successfully',
            data: {
                items: [],
                itemCount: 0,
                isGuest: false
            }
        });
    }

    // ✅ Use the clearWishlist method from your model
    await wishlist.clearWishlist();

    // ✅ Populate the empty wishlist for consistent response
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
        message: 'Wishlist cleared successfully', // ✅ Fixed message
        data: populatedWishlist // ✅ Now populatedWishlist is defined
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



// controllers/wishlistController.js - ADD THESE NEW METHODS

// @desc    Sync guest wishlist with user account after login
// @route   POST /api/v1/wishlist/sync-guest
// @access  Private
exports.syncGuestWishlist = catchAsyncErrors(async (req, res, next) => {
    const { guestWishlistItems } = req.body; // Array of product IDs from localStorage
    const userId = req.user._id;

    if (!guestWishlistItems || !Array.isArray(guestWishlistItems)) {
        return next(new ErrorHandler('Invalid guest wishlist data', 400));
    }

    // Find or create user's wishlist
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
        wishlist = await Wishlist.create({ userId, items: [] });
        await User.findByIdAndUpdate(userId, { wishlistId: wishlist._id });
    }

    let addedCount = 0;
    const errors = [];

    // Add each guest item to user's wishlist
    for (const productId of guestWishlistItems) {
        try {
            // Check if product exists and is valid
            const product = await Product.findById(productId);
            if (!product) {
                errors.push(`Product ${productId} not found`);
                continue;
            }

            // Check if product already in wishlist
            const existingItem = wishlist.items.find(item =>
                item.product.toString() === productId
            );

            if (!existingItem) {
                wishlist.items.push({
                    product: productId,
                    addedAt: new Date()
                });
                addedCount++;
            }
        } catch (error) {
            errors.push(`Failed to add product ${productId}: ${error.message}`);
        }
    }

    await wishlist.save();

    // Populate the updated wishlist
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
        message: `Synced ${addedCount} items from guest wishlist`,
        addedCount,
        errors: errors.length > 0 ? errors : undefined,
        data: populatedWishlist
    });
});

// @desc    Get wishlist for current user (handles both authenticated and guest)
// @route   GET /api/v1/wishlist/current
// @access  Public (with optional auth)
exports.getCurrentWishlist = catchAsyncErrors(async (req, res, next) => {
    // If user is authenticated, return their wishlist from DB
    if (req.user) {
        const wishlist = await Wishlist.findOne({ userId: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name images price slug stock brand category discountPrice ratings',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'category', select: 'name' }
                ]
            });

        if (!wishlist) {
            const newWishlist = await Wishlist.create({
                userId: req.user._id,
                items: []
            });
            return res.status(200).json({
                success: true,
                isAuthenticated: true,
                count: 0,
                data: newWishlist
            });
        }

        return res.status(200).json({
            success: true,
            isAuthenticated: true,
            count: wishlist.items.length,
            data: wishlist
        });
    }

    // For guest users, return empty structure (frontend will handle localStorage)
    res.status(200).json({
        success: true,
        isAuthenticated: false,
        count: 0,
        data: { items: [] },
        message: 'Using guest wishlist'
    });
});