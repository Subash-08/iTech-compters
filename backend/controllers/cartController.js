const Cart = require("../models/cartModel");
const mongoose = require('mongoose');
const Product = require("../models/productModel");
const User = require("../models/userModel");
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require("../middlewares/catchAsyncError");

// ==================== USER CART CONTROLLERS ====================

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
exports.getMyCart = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId })
        .populate({
            path: 'items.product',
            select: 'name images price slug stock discountPrice brand category variants basePrice offerPrice', // ADD basePrice and offerPrice here
            populate: [
                { path: 'brand', select: 'name' },
                { path: 'category', select: 'name' }
            ]
        })
    // REMOVED: .populate('items.variant', 'name price stock');

    if (!cart) {
        const newCart = await Cart.create({ userId, items: [] });
        await User.findByIdAndUpdate(userId, { cartId: newCart._id });

        return res.status(200).json({
            success: true,
            data: newCart
        });
    }

    res.status(200).json({
        success: true,
        data: cart
    });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
exports.addToCart = catchAsyncErrors(async (req, res, next) => {
    const { productId, variantId, quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!productId) {
        return next(new ErrorHandler('Product ID is required', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    let price = product.offerPrice || product.basePrice;
    let variantData = null;

    // Handle variant selection
    if (variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            return next(new ErrorHandler('Variant not found', 404));
        }
        price = variant.offerPrice || variant.price;
        variantData = {
            variantId: variant._id,
            name: variant.name,
            price: variant.price,
            stock: variant.stockQuantity,
            attributes: variant.identifyingAttributes || []
        };
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({ userId, items: [] });
        await User.findByIdAndUpdate(userId, { cartId: cart._id });
    }

    try {
        // FIX: Ensure price is properly passed to addItem method
        await cart.addItem(productId, variantData, quantity, price);

        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'name images price slug stock discountPrice brand category variants basePrice offerPrice', // ADD basePrice and offerPrice here
                populate: [
                    { path: 'brand', select: 'name' },
                    { path: 'category', select: 'name' }
                ]
            })

        res.status(200).json({
            success: true,
            message: 'Product added to cart successfully',
            data: updatedCart
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        return next(new ErrorHandler(error.message, 400));
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
