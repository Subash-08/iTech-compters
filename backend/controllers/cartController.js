// controllers/cartController.js - FIXED VERSION
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const PreBuiltPC = require('../models/preBuiltPCModel');

// ==================== HELPER FUNCTIONS ====================

const cartPopulation = [
    {
        path: 'items.product',
        select: 'name images basePrice mrp slug stockQuantity brand categories condition discountPercentage averageRating totalReviews',
        populate: [
            { path: 'brand', select: 'name' },
            { path: 'categories', select: 'name' }
        ]
    },
    {
        path: 'items.preBuiltPC',
        select: 'name images totalPrice discountPrice slug category performanceRating condition specifications stockQuantity averageRating totalReviews components',
        populate: [
            { path: 'category', select: 'name' },
            {
                path: 'images', // ✅ ADD THIS LINE - This was missing!
                select: 'url public_id thumbnail main gallery' // Include all image fields
            }
        ]
    }
];


// FIXED: Updated to include pre-built PC population
const getOrCreateUserCart = async (userId) => {
    let cart = await Cart.findOne({ userId }).populate(cartPopulation);

    if (!cart) {
        cart = await Cart.create({ userId, items: [] });
        await User.findByIdAndUpdate(userId, { cartId: cart._id });
    }

    return cart;
};

// Make sure ALL cart functions use the same cartPopulation
exports.getMyCart = catchAsyncErrors(async (req, res, next) => {
    if (!req.user) {
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

    const userId = req.user._id;

    // ✅ Use the standardized cartPopulation
    let cart = await Cart.findOne({ userId }).populate(cartPopulation);

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

// controllers/cartController.js - IMPROVED addToCart
exports.addToCart = catchAsyncErrors(async (req, res, next) => {
    const { productId, variantId, quantity = 1 } = req.body;
    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    // ✅ FIXED: Handle products with and without variants
    const validation = await validateProduct(productId, variantId);

    if (quantity > validation.stock) {
        return next(new ErrorHandler(`Only ${validation.stock} items available in stock`, 400));
    }

    if (!req.user) {
        // Guest user handling
        const guestCart = req.session.guestCart || [];

        // Check if item already exists in guest cart
        const existingItemIndex = guestCart.findIndex(item =>
            item.productId === productId &&
            item.variantId === variantId // This can be undefined for products without variants
        );

        let updatedCart;
        if (existingItemIndex > -1) {
            // Update quantity of existing item
            updatedCart = guestCart.map((item, index) =>
                index === existingItemIndex
                    ? {
                        ...item,
                        quantity: item.quantity + quantity
                    }
                    : item
            );
        } else {
            // Add new item
            const newItem = {
                _id: `guest_${Date.now()}`,
                productId,
                variantId: variantId, // Can be undefined
                quantity,
                price: validation.price,
                addedAt: new Date().toISOString(),
                product: validation.product
            };
            updatedCart = [...guestCart, newItem];
        }

        // Save to session
        req.session.guestCart = updatedCart;

        return res.status(200).json({
            success: true,
            message: 'Product added to guest cart',
            data: {
                items: updatedCart,
                totalItems: updatedCart.reduce((sum, item) => sum + item.quantity, 0),
                totalPrice: updatedCart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
                isGuest: true
            }
        });
    }

    // Authenticated user
    const userId = req.user._id;
    const cart = await getOrCreateUserCart(userId);

    try {
        // ✅ FIXED: Pass variantData only if it exists
        await cart.addItem(
            productId,
            validation.variantData, // This will be null for products without variants
            quantity,
            validation.price
        );

        // Populate both product types after adding
        const updatedCart = await Cart.findById(cart._id).populate(cartPopulation);

        res.status(200).json({
            success: true,
            message: 'Product added to cart successfully',
            data: updatedCart
        });
    } catch (error) {
        console.error('❌ Add to cart error in controller:', error);
        return next(new ErrorHandler(error.message, 400));
    }
});

// UPDATED: validateProduct function to handle variant data
const validateProduct = async (productId, variantId) => {
    const product = await Product.findById(productId)
        .select('name images basePrice mrp offerPrice stockQuantity variants variantConfiguration');

    if (!product) {
        throw new ErrorHandler('Product not found', 404);
    }

    let variantData = null;
    let price = product.basePrice;
    let stock = product.stockQuantity;

    // Check if product has variants
    if (variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (variant) {
            variantData = {
                variantId: variant._id,
                name: variant.name,
                price: variant.price,
                mrp: variant.mrp,
                stock: variant.stockQuantity,
                attributes: variant.identifyingAttributes,
                sku: variant.sku
            };
            price = variant.price;
            stock = variant.stockQuantity;
        }
    }

    // If no variant found but product has variants, use first variant as default
    if (!variantData && product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        variantData = {
            variantId: firstVariant._id,
            name: firstVariant.name,
            price: firstVariant.price,
            mrp: firstVariant.mrp,
            stock: firstVariant.stockQuantity,
            attributes: firstVariant.identifyingAttributes,
            sku: firstVariant.sku
        };
        price = firstVariant.price;
        stock = firstVariant.stockQuantity;
    }

    return {
        product: {
            _id: product._id,
            name: product.name,
            images: product.images,
            basePrice: product.basePrice,
            mrp: product.mrp,
            offerPrice: product.offerPrice,
            slug: product.slug,
            stockQuantity: stock
        },
        variantData,
        price,
        stock
    };
};

// controllers/cartController.js - FIXED addPreBuiltPCToCart
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
        }).select('stockQuantity discountPrice totalPrice name slug images specifications performanceRating'); // Select needed fields

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        // FIXED: Better stock validation with proper checks
        const availableStock = preBuiltPC.stockQuantity || 0;
        const requestedQuantity = quantity || 1;

        if (availableStock < requestedQuantity) {
            return next(new ErrorHandler(
                `Only ${availableStock} unit${availableStock !== 1 ? 's' : ''} available`,
                400
            ));
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
                    quantity: requestedQuantity,
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
                const newQuantity = existingItem.quantity + requestedQuantity;

                // Check max quantity limit
                if (newQuantity > 100) {
                    return next(new ErrorHandler('Total quantity cannot exceed 100', 400));
                }

                // Check stock availability for new total quantity
                if (availableStock < newQuantity) {
                    return next(new ErrorHandler(
                        `Only ${availableStock} unit${availableStock !== 1 ? 's' : ''} available. You already have ${existingItem.quantity} in cart`,
                        400
                    ));
                }

                existingItem.quantity = newQuantity;
            } else {
                // Check cart item limit
                if (cart.items.length >= 50) {
                    return next(new ErrorHandler('Cart cannot have more than 50 items', 400));
                }

                // Add PC to cart
                cart.items.push({
                    productType: 'prebuilt-pc',
                    preBuiltPC: pcId,
                    quantity: requestedQuantity,
                    price: price,
                    addedAt: new Date()
                });
            }
        }

        await cart.save();

        // FIXED: Use consistent population with error handling
        let populatedCart;
        try {
            populatedCart = await Cart.findById(cart._id).populate(cartPopulation);
        } catch (populateError) {
            console.warn('Population failed, returning basic cart:', populateError);
            populatedCart = cart;
        }

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

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is already empty',
                data: { items: [], totalItems: 0, totalPrice: 0 }
            });
        }

        // Clear cart items
        cart.items = [];
        cart.totalItems = 0;
        cart.totalPrice = 0;

        await cart.save();
        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                items: [],
                totalItems: 0,
                totalPrice: 0
            }
        });
    } catch (error) {
        console.error('❌ Clear cart error:', error);
        return next(new ErrorHandler('Failed to clear cart', 500));
    }
});

// Add this helper function for clearing cart after payment
exports.clearCartAfterPayment = catchAsyncErrors(async (userId) => {
    try {
        const cart = await Cart.findOne({ userId });

        if (cart) {
            cart.items = [];
            cart.totalItems = 0;
            cart.totalPrice = 0;
            await cart.save();
        }

        return true;
    } catch (error) {
        console.error('❌ Clear cart after payment error:', error);
        return false;
    }
});


// FIXED: syncGuestCart function
exports.syncGuestCart = catchAsyncErrors(async (req, res, next) => {
    const { items, mergeStrategy = 'merge' } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items)) {
        return next(new ErrorHandler('Items array is required', 400));
    }

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
        userCart.items = [];
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

    // ✅ Use the standardized cartPopulation
    const updatedCart = await Cart.findById(userCart._id).populate(cartPopulation);

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


// Fix getUserCart function
exports.getUserCart = catchAsyncErrors(async (req, res, next) => {
    const { userId } = req.params;

    // ✅ Use standardized cartPopulation
    const cart = await Cart.findOne({ userId }).populate(cartPopulation);

    if (!cart) {
        return next(new ErrorHandler('Cart not found for this user', 404));
    }

    res.status(200).json({
        success: true,
        data: cart
    });
});

// Fix getAllCarts function
exports.getAllCarts = catchAsyncErrors(async (req, res, next) => {
    const resultsPerPage = parseInt(req.query.limit) || 20;
    const currentPage = parseInt(req.query.page) || 1;

    // ✅ Use standardized cartPopulation
    const carts = await Cart.find()
        .populate('userId', 'firstName lastName email avatar')
        .populate(cartPopulation[0]) // items.product
        .populate(cartPopulation[1]) // items.preBuiltPC
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
                select: 'name images price slug stock brand category variants basePrice mrp',
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
                select: 'name images price slug stock brand category variants basePrice mrp',
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'category', select: 'name' }
                ]
            })
            .populate('items.variant', 'name price stock basePrice mrp');

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            data: updatedCart
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});