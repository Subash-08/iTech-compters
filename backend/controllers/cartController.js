// controllers/cartController.js - FIXED VERSION
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const PreBuiltPC = require('../models/preBuiltPCModel');

// ==================== HELPER FUNCTIONS ====================

// Common population configuration
const cartPopulation = [
    {
        path: 'items.product',
        select: 'name images basePrice offerPrice slug stockQuantity brand categories condition discountPercentage averageRating totalReviews',
        populate: [
            { path: 'brand', select: 'name' },
            { path: 'categories', select: 'name' }
        ]
    },
    {
        path: 'items.preBuiltPC',
        select: 'name images totalPrice discountPrice slug category performanceRating condition specifications stockQuantity averageRating totalReviews components',
        populate: [
            { path: 'category', select: 'name' }
        ]
    }
];

const validateProduct = async (productId, variantId = null) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new ErrorHandler('Product not found', 404);
    }

    let price = product.offerPrice || product.basePrice;
    let variantData = null;
    let stock = product.stockQuantity || product.stock;

    if (variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            throw new ErrorHandler('Variant not found', 404);
        }
        if (variant.stockQuantity < 1) {
            throw new ErrorHandler('Variant is out of stock', 400);
        }
        price = variant.offerPrice || variant.price;
        stock = variant.stockQuantity;
        variantData = {
            variantId: variant._id,
            name: variant.name,
            price: variant.price,
            stock: variant.stockQuantity,
            attributes: variant.identifyingAttributes || []
        };
    } else {
        if (stock < 1) {
            throw new ErrorHandler('Product is out of stock', 400);
        }
    }

    return { product, price, variantData, stock };
};

// FIXED: Updated to include pre-built PC population
const getOrCreateUserCart = async (userId) => {
    let cart = await Cart.findOne({ userId }).populate(cartPopulation);

    if (!cart) {
        cart = await Cart.create({ userId, items: [] });
        await User.findByIdAndUpdate(userId, { cartId: cart._id });
    }

    return cart;
};

// ==================== CONTROLLERS ====================

// @desc    Get cart (works for both guests and authenticated users)
// @route   GET /api/v1/cart
// @access  Public/Private
exports.getMyCart = catchAsyncErrors(async (req, res, next) => {
    if (!req.user) {
        // Guest user - return empty cart structure
        return res.status(200).json({
            success: true,
            data: {
                items: [],
                totalItems: 0,
                totalPrice: 0,
                isGuest: true
            }
        });
    }

    // Authenticated user
    const userId = req.user._id;

    // Get cart with proper population for both product types
    let cart = await Cart.findOne({ userId }).populate(cartPopulation);

    // If no cart exists, create one
    if (!cart) {
        cart = await Cart.create({
            userId,
            items: [],
            totalItems: 0,
            totalPrice: 0
        });
    }

    res.status(200).json({
        success: true,
        data: {
            ...cart.toObject(),
            isGuest: false
        }
    });
});

// @desc    Add item to cart (works for both guests and authenticated users)
// @route   POST /api/v1/cart
// @access  Public/Private
exports.addToCart = catchAsyncErrors(async (req, res, next) => {
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    // Validate product
    const validation = await validateProduct(productId, variantId);

    if (quantity > validation.stock) {
        return next(new ErrorHandler(`Only ${validation.stock} items available in stock`, 400));
    }

    if (!req.user) {
        // Guest user handling (your existing logic)
        // ... keep your guest cart logic ...
        return res.status(200).json({
            success: true,
            message: 'Product added to guest cart',
            data: {
                items: [{
                    product: validation.product,
                    variant: validation.variantData,
                    quantity,
                    price: validation.price,
                    addedAt: new Date()
                }],
                totalItems: quantity,
                totalPrice: quantity * validation.price,
                isGuest: true
            }
        });
    }

    // Authenticated user
    const userId = req.user._id;
    const cart = await getOrCreateUserCart(userId);

    try {
        await cart.addItem(productId, validation.variantData, quantity, validation.price);

        // FIXED: Populate both product types after adding
        const updatedCart = await Cart.findById(cart._id).populate(cartPopulation);

        res.status(200).json({
            success: true,
            message: 'Product added to cart successfully',
            data: updatedCart
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// @desc    Add Pre-built PC to cart
// @route   POST /api/v1/cart/prebuilt-pc/add
// @access  Private
exports.addPreBuiltPCToCart = catchAsyncErrors(async (req, res, next) => {
    try {
        const { pcId, quantity = 1 } = req.body;

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

        // Check stock availability
        if (preBuiltPC.stockQuantity < quantity) {
            return next(new ErrorHandler(`Only ${preBuiltPC.stockQuantity} units available`, 400));
        }

        const price = preBuiltPC.discountPrice || preBuiltPC.totalPrice;
        const userId = req.user._id;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Create new cart if it doesn't exist
            cart = await Cart.create({
                userId: req.user._id,
                items: [{
                    productType: 'prebuilt-pc',
                    preBuiltPC: pcId,
                    quantity: quantity,
                    price: price,
                    addedAt: new Date()
                }]
            });
        } else {
            // Check if PC is already in cart
            const existingItem = cart.items.find(item =>
                item.productType === 'prebuilt-pc' &&
                item.preBuiltPC &&
                item.preBuiltPC.toString() === pcId
            );

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > 100) {
                    return next(new ErrorHandler('Total quantity cannot exceed 100', 400));
                }
                if (preBuiltPC.stockQuantity < newQuantity) {
                    return next(new ErrorHandler(`Only ${preBuiltPC.stockQuantity} units available`, 400));
                }
                existingItem.quantity = newQuantity;
            } else {
                if (cart.items.length >= 50) {
                    return next(new ErrorHandler('Cart cannot have more than 50 items', 400));
                }

                // Add PC to cart
                cart.items.push({
                    productType: 'prebuilt-pc',
                    preBuiltPC: pcId,
                    quantity: quantity,
                    price: price,
                    addedAt: new Date()
                });
            }
        }

        await cart.save();

        // FIXED: Use consistent population
        const populatedCart = await Cart.findById(cart._id).populate(cartPopulation);

        res.status(200).json({
            success: true,
            message: 'Pre-built PC added to cart',
            data: populatedCart
        });

    } catch (error) {
        console.error('Error adding pre-built PC to cart:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart
// @access  Private
exports.removeFromCart = catchAsyncErrors(async (req, res, next) => {
    const { productId, variantId } = req.body;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new ErrorHandler('Cart not found', 404));
    }

    try {
        const searchProductId = productId.toString();
        const searchVariantId = variantId ? variantId.toString() : null;

        await cart.removeItem(searchProductId, searchVariantId);

        // FIXED: Populate both product types after removal
        const updatedCart = await Cart.findById(cart._id).populate(cartPopulation);

        res.status(200).json({
            success: true,
            message: 'Product removed from cart successfully',
            data: updatedCart
        });
    } catch (error) {
        console.error('❌ Remove from cart error:', error);
        return next(new ErrorHandler(error.message, 404));
    }
});

// @desc    Remove Pre-built PC from cart
// @route   DELETE /api/v1/cart/prebuilt-pc/remove/:pcId
// @access  Private
exports.removePreBuiltPCFromCart = catchAsyncErrors(async (req, res, next) => {
    const { pcId } = req.params;
    const userId = req.user._id;

    if (!pcId) {
        return next(new ErrorHandler('Pre-built PC ID is required', 400));
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return next(new ErrorHandler('Cart not found', 404));
    }

    try {
        await cart.removeItem(pcId, null, 'prebuilt-pc');

        // FIXED: Use consistent population
        const updatedCart = await Cart.findById(cart._id).populate(cartPopulation);

        res.status(200).json({
            success: true,
            message: 'Pre-built PC removed from cart',
            data: updatedCart
        });
    } catch (error) {
        console.error('Error removing pre-built PC from cart:', error);
        return next(new ErrorHandler(error.message, 404));
    }
});

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart
// @access  Private
exports.updateCartQuantity = catchAsyncErrors(async (req, res, next) => {
    const { productId, variantId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity) {
        return next(new ErrorHandler('Product ID and quantity are required', 400));
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new ErrorHandler('Cart not found', 404));
    }

    try {
        await cart.updateQuantity(productId, variantId, quantity);

        // FIXED: Populate both product types after update
        const updatedCart = await Cart.findById(cart._id).populate(cartPopulation);

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            data: updatedCart
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// @desc    Update Pre-built PC quantity in cart
// @route   PUT /api/v1/cart/prebuilt-pc/update/:pcId
// @access  Private
exports.updatePreBuiltPCQuantity = catchAsyncErrors(async (req, res, next) => {
    const { pcId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!pcId) {
        return next(new ErrorHandler('Pre-built PC ID is required', 400));
    }

    if (!quantity || quantity < 1 || quantity > 100) {
        return next(new ErrorHandler('Quantity must be between 1 and 100', 400));
    }

    const preBuiltPC = await PreBuiltPC.findOne({
        _id: pcId,
        isActive: true
    });

    if (!preBuiltPC) {
        return next(new ErrorHandler('Pre-built PC not found', 404));
    }

    if (preBuiltPC.stockQuantity < quantity) {
        return next(new ErrorHandler(`Only ${preBuiltPC.stockQuantity} units available`, 400));
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return next(new ErrorHandler('Cart not found', 404));
    }

    try {
        await cart.updateQuantity(pcId, null, quantity, 'prebuilt-pc');

        // FIXED: Use consistent population
        const updatedCart = await Cart.findById(cart._id).populate(cartPopulation);

        res.status(200).json({
            success: true,
            message: 'Pre-built PC quantity updated',
            data: updatedCart
        });
    } catch (error) {
        console.error('Error updating pre-built PC quantity:', error);
        return next(new ErrorHandler(error.message, 404));
    }
});

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart/clear
// @access  Private
exports.clearCart = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new ErrorHandler('Cart not found', 404));
    }

    try {
        await cart.clearCart();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});


// @desc    Sync guest cart after login
// @route   POST /api/v1/cart/sync
// @access  Private
exports.syncGuestCart = catchAsyncErrors(async (req, res, next) => {
    const { items, mergeStrategy = 'merge' } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items)) {
        return next(new ErrorHandler('Items array is required', 400));
    }

    // Validate all items first
    const validatedItems = [];
    for (const item of items) {
        try {
            const validation = await validateProduct(item.productId, item.variantId);

            if (item.quantity > validation.stock) {
                throw new ErrorHandler(`Only ${validation.stock} items available`, 400);
            }

            validatedItems.push({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: validation.price,
                variantData: validation.variantData
            });
        } catch (error) {
            console.warn(`Skipping invalid product during sync: ${error.message}`);
        }
    }

    const userCart = await getOrCreateUserCart(userId);

    if (mergeStrategy === 'replace') {
        await userCart.clearCart();
    }

    // Add validated items to cart
    for (const item of validatedItems) {
        try {
            await userCart.addItem(
                item.productId,
                item.variantData,
                item.quantity,
                item.price
            );
        } catch (error) {
            console.warn(`Failed to add product ${item.productId} to cart: ${error.message}`);
        }
    }

    const updatedCart = await Cart.findById(userCart._id).populate({
        path: 'items.product',
        select: 'name images price slug stock discountPrice brand category variants basePrice offerPrice',
        populate: [
            { path: 'brand', select: 'name' },
            { path: 'category', select: 'name' }
        ]
    });

    res.status(200).json({
        success: true,
        message: `Cart synchronized successfully (${validatedItems.length} items added)`,
        data: updatedCart
    });
});


// @desc    Validate guest cart items
// @route   POST /api/v1/cart/guest/validate
// @access  Public
exports.validateGuestCart = catchAsyncErrors(async (req, res, next) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return next(new ErrorHandler('Items array is required', 400));
    }

    const validatedItems = [];
    const errors = [];

    for (const item of items) {
        try {
            const { productId, variantId, quantity } = item;

            if (!productId) {
                errors.push({ productId, error: 'Product ID is required' });
                continue;
            }

            const validation = await validateProduct(productId, variantId);

            if (quantity > validation.stock) {
                errors.push({
                    productId,
                    variantId,
                    error: `Only ${validation.stock} items available in stock`
                });
                continue;
            }

            validatedItems.push({
                productId,
                variantId,
                quantity,
                price: validation.price,
                variantData: validation.variantData,
                product: validation.product
            });
        } catch (error) {
            errors.push({
                productId: item.productId,
                variantId: item.variantId,
                error: error.message
            });
        }
    }

    res.status(200).json({
        success: true,
        data: {
            validItems: validatedItems,
            invalidItems: errors
        }
    });
});


// ==================== ADMIN CART CONTROLLERS ====================

// @desc    Get cart of any user (Admin)
// @route   GET /api/v1/admin/cart/user/:userId
// @access  Private/Admin
exports.getUserCart = catchAsyncErrors(async (req, res, next) => {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId })
        .populate({
            path: 'items.product',
            select: 'name images price slug stock discountPrice brand category variants basePrice offerPrice', // ADD basePrice and offerPrice here
            populate: [
                { path: 'brand', select: 'name' },
                { path: 'category', select: 'name' }
            ]
        })
        .populate('items.variant', 'name price stock basePrice offerPrice');

    if (!cart) {
        return next(new ErrorHandler('Cart not found for this user', 404));
    }

    res.status(200).json({
        success: true,
        data: cart
    });
});

// @desc    Get all carts with pagination (Admin)
// @route   GET /api/v1/admin/carts
// @access  Private/Admin
exports.getAllCarts = catchAsyncErrors(async (req, res, next) => {
    const resultsPerPage = parseInt(req.query.limit) || 20;
    const currentPage = parseInt(req.query.page) || 1;

    const carts = await Cart.find()
        .populate('userId', 'firstName lastName email avatar')
        .populate('items.product', 'name price images')
        .sort({ lastUpdated: -1 })
        .skip(resultsPerPage * (currentPage - 1))
        .limit(resultsPerPage);

    const totalCount = await Cart.countDocuments();

    res.status(200).json({
        success: true,
        count: carts.length,
        totalCount,
        resultsPerPage,
        currentPage,
        data: carts
    });
});


// @desc    Remove item from cart
// @route   DELETE /api/v1/cart
// @access  Private
// In cartController.js - update removeFromCart
exports.removeFromCart = catchAsyncErrors(async (req, res, next) => {
    const { productId, variantId } = req.body;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new ErrorHandler('Cart not found', 404));
    }

    try {
        // SIMPLE FIX: Convert everything to strings for comparison
        const searchProductId = productId.toString();
        const searchVariantId = variantId ? variantId.toString() : null;

        // Use the cart method but ensure proper string conversion
        await cart.removeItem(searchProductId, searchVariantId);

        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'name images price slug stock discountPrice brand category variants basePrice offerPrice',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'category', select: 'name' }
                ]
            });

        res.status(200).json({
            success: true,
            message: 'Product removed from cart successfully',
            data: updatedCart
        });
    } catch (error) {
        console.error('❌ Remove from cart error:', error);
        return next(new ErrorHandler(error.message, 404));
    }
});



// @desc    Update cart item quantity
// @route   PUT /api/v1/cart
// @access  Private
exports.updateCartQuantity = catchAsyncErrors(async (req, res, next) => {
    const { productId, variantId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity) {
        return next(new ErrorHandler('Product ID and quantity are required', 400));
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new ErrorHandler('Cart not found', 404));
    }

    try {
        await cart.updateQuantity(productId, variantId, quantity);

        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'name images price slug stock discountPrice brand category variants basePrice offerPrice', // ADD basePrice and offerPrice here
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'category', select: 'name' }
                ]
            })
            .populate('items.variant', 'name price stock basePrice offerPrice');

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            data: updatedCart
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});