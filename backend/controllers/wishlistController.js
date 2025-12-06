const Product = require("../models/productModel");
const ErrorHandler = require('../utils/errorHandler');
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");
const Wishlist = require("../models/wishlistModel");
const User = require("../models/userModel");
const PreBuiltPC = require('../models/preBuiltPCModel');

// ✅ FIXED: Add Pre-built PC to wishlist
exports.addPreBuiltPCToWishlist = catchAsyncErrors(async (req, res, next) => {
    try {
        const { pcId } = req.body;
        const userId = req.user._id; // ✅ Consistent field name

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

        let wishlist = await Wishlist.findOne({ userId }); // ✅ Use userId

        if (!wishlist) {
            // Create new wishlist if it doesn't exist
            wishlist = await Wishlist.create({
                userId: userId, // ✅ Use userId
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

        // ✅ FIXED: Proper population with price fields
        await wishlist.populate({
            path: 'items.preBuiltPC',
            select: 'name images totalPrice discountPrice slug category performanceRating condition stockQuantity averageRating totalReviews'
        });

        res.status(200).json({
            success: true,
            message: 'Pre-built PC added to wishlist',
            data: wishlist
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ FIXED: Remove Pre-built PC from wishlist
exports.removePreBuiltPCFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { pcId } = req.params;
    const userId = req.user._id; // ✅ Consistent field name

    if (!pcId) {
        return next(new ErrorHandler('Pre-built PC ID is required', 400));
    }

    // ✅ FIXED: Use userId consistently
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
        return next(new ErrorHandler('Wishlist not found', 404));
    }

    try {
        // ✅ FIXED: Manual removal instead of calling non-existent method
        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter(item =>
            !(item.preBuiltPC && item.preBuiltPC.toString() === pcId)
        );

        if (wishlist.items.length === initialLength) {
            return next(new ErrorHandler('Pre-built PC not found in wishlist', 404));
        }

        await wishlist.save();

        // ✅ FIXED: Proper population for both product types
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.product',
                select: 'name images basePrice mrp offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews variants',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'categories', select: 'name' }
                ]
            })
            .populate({
                path: 'items.preBuiltPC',
                select: 'name images totalPrice discountPrice slug category performanceRating condition specifications stockQuantity averageRating totalReviews'
            });

        res.status(200).json({
            success: true,
            message: 'Pre-built PC removed from wishlist',
            data: updatedWishlist
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ FIXED: Single getWishlist function (removed duplicate)
exports.getWishlist = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    try {
        let wishlist = await Wishlist.findOne({ userId })
            .populate({
                path: 'items.product',
                select: 'name images basePrice mrp offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews variants',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'categories', select: 'name' }
                ]
            })
            .populate({
                path: 'items.preBuiltPC',
                select: 'name images totalPrice discountPrice slug category performanceRating condition stockQuantity averageRating totalReviews'
            });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                userId,
                items: []
            });
        }

        // ✅ FIXED: Enhanced pricing calculation for all items
        const enhancedItems = wishlist.items.map(item => {
            if (item.productType === 'product' && item.product) {
                const product = item.product;

                let displayPrice = product.offerPrice > 0 ? product.offerPrice : product.basePrice || 0;
                let displayMrp = product.mrp || displayPrice;
                let displayName = product.name || 'Product';
                let image = product.images?.thumbnail?.url ||
                    product.images?.gallery?.[0]?.url ||
                    '';

                // Use variant data if available
                if (item.variant && item.variant.variantId) {
                    displayPrice = item.variant.price || displayPrice;
                    displayMrp = item.variant.mrp || item.variant.price || displayMrp;

                    if (item.variant.name) {
                        displayName = `${product.name} - ${item.variant.name}`;
                    }

                    // Use variant image if available
                    if (product.variants) {
                        const variantFromProduct = product.variants.find(v =>
                            v._id.toString() === item.variant.variantId
                        );
                        if (variantFromProduct?.images?.thumbnail?.url) {
                            image = variantFromProduct.images.thumbnail.url;
                        }
                    }
                }

                const discountPercentage = displayMrp > displayPrice
                    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
                    : 0;

                return {
                    ...item.toObject(),
                    displayPrice,
                    displayMrp,
                    discountPercentage,
                    displayName,
                    image
                };
            } else if (item.productType === 'prebuilt-pc' && item.preBuiltPC) {
                const pc = item.preBuiltPC;

                const displayPrice = pc.discountPrice > 0 ? pc.discountPrice : pc.totalPrice || 0;
                const displayMrp = pc.totalPrice || displayPrice;
                const displayName = pc.name || 'Pre-built PC';
                const image = pc.images?.[0]?.url || '';

                const discountPercentage = displayMrp > displayPrice
                    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
                    : 0;

                return {
                    ...item.toObject(),
                    displayPrice,
                    displayMrp,
                    discountPercentage,
                    displayName,
                    image
                };
            }

            // Return original item if no product/PC found
            return item;
        });

        res.status(200).json({
            success: true,
            data: {
                ...wishlist.toObject(),
                items: enhancedItems
            }
        });

    } catch (error) {
        console.error('❤️ Wishlist get error:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// controllers/wishlistController.js - UNIVERSAL REMOVAL
exports.removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user._id;
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        return next(new ErrorHandler('Wishlist not found', 404));
    }

    // ✅ FIXED: Remove by product ID for both regular products AND pre-built PCs
    const itemIndex = wishlist.items.findIndex(item =>
        (item.product && item.product.toString() === productId) ||
        (item.preBuiltPC && item.preBuiltPC.toString() === productId)
    );

    if (itemIndex === -1) {
        return next(new ErrorHandler('Item not found in wishlist', 404));
    }

    // Remove the item
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    // Return updated wishlist with proper population
    const updatedWishlist = await Wishlist.findById(wishlist._id)
        .populate({
            path: 'items.product',
            select: 'name images basePrice mrp offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews variants',
            populate: [
                { path: 'brand', select: 'name' },
                { path: 'categories', select: 'name' }
            ]
        })
        .populate({
            path: 'items.preBuiltPC',
            select: 'name images totalPrice discountPrice slug category performanceRating condition stockQuantity averageRating totalReviews'
        });

    res.status(200).json({
        success: true,
        message: 'Item removed from wishlist',
        data: updatedWishlist
    });
});

// ✅ FIXED: Add product to wishlist
exports.addToWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId, variant } = req.body;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            userId,
            items: []
        });
    }

    try {
        // Check for existing item
        const existingItem = wishlist.items.find(item => {
            const sameProduct = item.product && item.product.toString() === productId;

            if (variant && variant.variantId) {
                return sameProduct && item.variant?.variantId === variant.variantId;
            } else {
                return sameProduct && !item.variant;
            }
        });

        if (existingItem) {
            return next(new ErrorHandler('Product already in wishlist', 400));
        }

        // Create the item with proper variant data structure
        const newItem = {
            product: productId,
            productType: 'product',
            addedAt: new Date()
        };

        // Store variant data if provided
        if (variant && variant.variantId) {
            newItem.variant = {
                variantId: variant.variantId,
                name: variant.name,
                price: variant.price,
                mrp: variant.mrp,
                stock: variant.stock,
                attributes: variant.attributes,
                sku: variant.sku
            };
        }
        wishlist.items.push(newItem);
        await wishlist.save();

        // Enhanced population and pricing calculation
        const populatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.product',
                select: 'name images basePrice mrp offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews variants',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'categories', select: 'name' }
                ]
            })
            .populate({
                path: 'items.preBuiltPC',
                select: 'name images totalPrice discountPrice slug category performanceRating condition stockQuantity averageRating totalReviews'
            });

        res.status(200).json({
            success: true,
            message: variant ? 'Product variant added to wishlist' : 'Product added to wishlist',
            data: populatedWishlist
        });

    } catch (error) {
        console.error('❤️ Wishlist add error:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ FIXED: Check if product is in wishlist
exports.checkWishlistItem = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        return res.status(200).json({
            success: true,
            isInWishlist: false,
            message: 'Product is not in wishlist'
        });
    }

    const isInWishlist = wishlist.items.some(item =>
        item.product && item.product.toString() === productId
    );

    res.status(200).json({
        success: true,
        isInWishlist,
        message: isInWishlist ? 'Product is in wishlist' : 'Product is not in wishlist'
    });
});

// ✅ FIXED: Clear entire wishlist
exports.clearWishlist = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = await Wishlist.create({ userId, items: [] });

        // Update user's wishlistId reference if exists
        await User.findByIdAndUpdate(userId, { wishlistId: wishlist._id });
    }

    // Clear all items
    wishlist.items = [];
    await wishlist.save();

    // Return empty wishlist with proper structure
    const emptyWishlist = await Wishlist.findById(wishlist._id)
        .populate('items.product items.preBuiltPC');

    res.status(200).json({
        success: true,
        message: 'Wishlist cleared successfully',
        data: emptyWishlist
    });
});

// ✅ Keep this function for backward compatibility
exports.getMyWishlist = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: 'items.product',
            select: 'name basePrice offerPrice discountPercentage stockQuantity images slug brand categories tags condition averageRating totalReviews description specifications',
            populate: [
                { path: 'brand', select: 'name' },
                { path: 'categories', select: 'name' }
            ]
        })
        .populate({
            path: 'items.preBuiltPC',
            select: 'name images totalPrice discountPrice slug category performanceRating condition stockQuantity averageRating totalReviews'
        });

    if (!wishlist) {
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