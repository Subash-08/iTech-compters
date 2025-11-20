const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const PreBuiltPC = require("../models/preBuiltPCModel");
const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncError");

const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${dateStr}-${random}`;
};

// @desc    Get checkout data (cart items with current prices)
// @route   GET /api/checkout
// @access  Private
// @desc    Get checkout data (cart items with current prices)
// @route   GET /api/checkout
// @access  Private
const getCheckoutData = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Get user's cart
        const cart = await Cart.findOne({ userId })
            .populate('items.product', 'name slug images price offerPrice stockQuantity taxRate variants')
            .populate('items.preBuiltPC', 'name slug images basePrice offerPrice totalPrice specifications');

        if (!cart || cart.items.length === 0) {
            return next(new ErrorHandler('Cart is empty', 400));
        }

        // Get user's addresses
        const user = await User.findById(userId).select('addresses defaultAddressId');

        // Validate cart items and get current prices
        const validatedItems = [];
        let subtotal = 0;
        let totalTax = 0;

        for (const item of cart.items) {
            let productData, currentPrice, taxRate = 0.18;

            if (item.productType === 'product') {
                productData = item.product;
                if (!productData) {
                    continue;
                }
                currentPrice = productData.offerPrice > 0 ? productData.offerPrice : productData.price;
                taxRate = productData.taxRate || 0.18;

                // Check stock
                let availableStock = productData.stockQuantity;
                if (item.variant?.variantId && productData.variants) {
                    const variant = productData.variants.id(item.variant.variantId);
                    if (variant) {
                        availableStock = variant.stockQuantity;
                        currentPrice = variant.offerPrice > 0 ? variant.offerPrice : variant.price;
                    }
                }

                if (availableStock < item.quantity) {
                    return next(new ErrorHandler(
                        `Insufficient stock for ${productData.name}. Available: ${availableStock}`,
                        400
                    ));
                }

            } else if (item.productType === 'prebuilt-pc') {
                productData = item.preBuiltPC;
                if (!productData) {
                    continue;
                }
                currentPrice = productData.offerPrice > 0 ? productData.offerPrice : productData.totalPrice;
                taxRate = 0.18;
            }

            const itemTotal = currentPrice * item.quantity;
            // ✅ FIXED: Divide taxRate by 100
            const itemTax = itemTotal * (taxRate / 100);

            subtotal += itemTotal;
            totalTax += itemTax;

            validatedItems.push({
                cartItemId: item._id,
                productType: item.productType,
                product: item.productType === 'product' ? item.product._id : item.preBuiltPC._id,
                variant: item.variant,
                name: productData.name,
                slug: productData.slug,
                image: productData.images?.thumbnail?.url || productData.images?.gallery?.[0]?.url,
                quantity: item.quantity,
                price: currentPrice,
                total: itemTotal,
                taxRate: taxRate,
                taxAmount: itemTax,
                available: true
            });
        }

        // Calculate shipping (₹100 below ₹1000, free above ₹1000)
        const shipping = subtotal >= 1000 ? 0 : 100;
        const total = subtotal + shipping + totalTax;

        res.status(200).json({
            success: true,
            data: {
                cartItems: validatedItems,
                addresses: user.addresses || [],
                defaultAddressId: user.defaultAddressId,
                pricing: {
                    subtotal: Math.round(subtotal * 100) / 100,
                    shipping: shipping,
                    tax: Math.round(totalTax * 100) / 100,
                    discount: 0,
                    total: Math.round(total * 100) / 100
                },
                summary: {
                    totalItems: cart.totalItems,
                    currency: 'INR'
                }
            }
        });

    } catch (error) {
        console.error('Get checkout data error:', error);
        next(error);
    }
});

// @desc    Calculate checkout totals with coupon
// @route   POST /api/checkout/calculate
// @access  Private
const calculateCheckout = catchAsyncErrors(async (req, res, next) => {
    try {
        const { couponCode, shippingAddressId } = req.body;
        const userId = req.user._id;

        // Get current checkout data
        const checkoutResponse = await getCheckoutDataInternal(userId);
        if (!checkoutResponse.success) {
            return next(new ErrorHandler('Failed to get checkout data', 400));
        }

        const { cartItems, pricing } = checkoutResponse.data;

        let discount = 0;
        let couponDetails = null;

        // Apply coupon if provided
        if (couponCode) {
            try {
                // Convert cart items to format expected by coupon validation
                const couponCartItems = cartItems.map(item => ({
                    product: item.product.toString(),
                    category: '', // You might need to populate this
                    brand: '', // You might need to populate this
                    price: item.price,
                    quantity: item.quantity
                }));

                const coupon = await Coupon.validateCoupon(
                    couponCode,
                    userId,
                    couponCartItems,
                    pricing.subtotal
                );

                // Calculate discount amount
                let applicableItemsTotal = pricing.subtotal;

                if (coupon.applicableTo !== 'all_products') {
                    applicableItemsTotal = cartItems.reduce((total, item) => {
                        let isApplicable = false;

                        if (coupon.applicableTo === 'specific_products') {
                            isApplicable = coupon.specificProducts.includes(item.product.toString());
                        }
                        // Add other applicability checks as needed

                        return isApplicable ? total + item.total : total;
                    }, 0);
                }

                discount = coupon.calculateDiscount(pricing.subtotal, applicableItemsTotal);
                couponDetails = {
                    code: coupon.code,
                    name: coupon.name,
                    discountAmount: discount,
                    discountType: coupon.discountType
                };
            } catch (couponError) {
                return next(new ErrorHandler(couponError.message, 400));
            }
        }

        // Recalculate totals with discount
        const finalPricing = {
            ...pricing,
            discount: Math.round(discount * 100) / 100,
            total: Math.round((pricing.subtotal + pricing.shipping + pricing.tax - discount) * 100) / 100
        };

        res.status(200).json({
            success: true,
            data: {
                cartItems,
                pricing: finalPricing,
                coupon: couponDetails,
                currency: 'INR'
            }
        });

    } catch (error) {
        console.error('Checkout calculation error:', error);
        next(error);
    }
});
const createOrder = catchAsyncErrors(async (req, res, next) => {
    try {
        console.log('🟡 Starting order creation...');

        const {
            shippingAddressId,
            billingAddressId,
            couponCode,
            gstInfo,
            paymentMethod
        } = req.body;
        const userId = req.user._id;

        // Get user and addresses
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Find addresses
        const shippingAddress = user.addresses.id(shippingAddressId);
        if (!shippingAddress) {
            return next(new ErrorHandler('Shipping address not found', 400));
        }

        const billingAddress = billingAddressId ?
            user.addresses.id(billingAddressId) : shippingAddress;

        // Recalculate totals
        const calculationResponse = await calculateCheckoutInternal(userId, couponCode);
        if (!calculationResponse.success) {
            return next(new ErrorHandler('Failed to calculate order totals', 400));
        }

        const { cartItems, pricing, couponDetails } = calculationResponse.data;

        // Prepare order items
        const orderItems = cartItems.map(item => ({
            productType: item.productType,
            product: item.product,
            variant: item.variant,
            name: item.name,
            sku: item.sku || `ITEM-${item.product?.toString().slice(-6) || 'UNKNOWN'}`,
            image: item.image,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            discountedPrice: item.discountedPrice || item.price,
            total: item.total,
            taxRate: item.taxRate || 0.18,
            taxAmount: item.taxAmount || 0,
            returnable: true,
            returnWindow: 7
        }));

        // ✅ Generate order number manually
        const orderNumber = generateOrderNumber();
        console.log('✅ Generated order number:', orderNumber);

        // Create order data WITH orderNumber
        const orderData = {
            user: userId,
            orderNumber: orderNumber, // ✅ This fixes the issue
            items: orderItems,
            pricing: {
                subtotal: pricing.subtotal || 0,
                shipping: pricing.shipping || 0,
                tax: pricing.tax || 0,
                discount: pricing.discount || 0,
                total: pricing.total || 0,
                currency: 'INR',
                amountPaid: 0,
                amountDue: pricing.total || 0
            },
            coupon: couponDetails ? {
                couponId: couponDetails.couponId,
                code: couponDetails.code,
                discountAmount: couponDetails.discountAmount,
                discountType: couponDetails.discountType
            } : undefined,
            gstInfo: gstInfo || {},
            shippingAddress: {
                type: shippingAddress.type,
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                phone: shippingAddress.phone,
                email: shippingAddress.email,
                addressLine1: shippingAddress.addressLine1,
                addressLine2: shippingAddress.addressLine2,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
                country: shippingAddress.country,
                landmark: shippingAddress.landmark
            },
            billingAddress: {
                type: billingAddress.type,
                firstName: billingAddress.firstName,
                lastName: billingAddress.lastName,
                phone: billingAddress.phone,
                email: billingAddress.email,
                addressLine1: billingAddress.addressLine1,
                addressLine2: billingAddress.addressLine2,
                city: billingAddress.city,
                state: billingAddress.state,
                pincode: billingAddress.pincode,
                country: billingAddress.country,
                landmark: billingAddress.landmark
            },
            shippingMethod: {
                name: "Standard Shipping",
                deliveryDays: (pricing.shipping === 0 ? 7 : 5),
                cost: pricing.shipping || 0
            },
            payment: {
                method: paymentMethod,
                status: 'created'
            },
            estimatedDelivery: new Date(Date.now() + (pricing.shipping === 0 ? 7 : 5) * 24 * 60 * 60 * 1000)
        };

        console.log('🟡 Creating order with orderNumber:', orderNumber);

        // Create order
        const order = await Order.create(orderData);

        console.log('✅ Order created successfully:', order.orderNumber);

        // Update coupon usage
        if (couponDetails) {
            await Coupon.findOneAndUpdate(
                { code: couponDetails.code },
                { $inc: { usageCount: 1 } }
            );
        }

        // Update user's orders array
        await User.findByIdAndUpdate(userId, {
            $push: { orders: order._id }
        });

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], totalItems: 0, totalPrice: 0 } }
        );

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: order,
            orderId: order._id,
            orderNumber: order.orderNumber
        });

    } catch (error) {
        console.error('❌ Create order error:', error.message);
        next(error);
    }
});

// @desc    Save user address
// @route   POST /api/checkout/address
// @access  Private
const saveAddress = catchAsyncErrors(async (req, res, next) => {
    try {
        const { address, setAsDefault = false } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Let MongoDB generate the _id automatically
        const newAddress = {
            ...address
            // Remove manual _id assignment - MongoDB will generate it
        };

        user.addresses.push(newAddress);

        if (setAsDefault || user.addresses.length === 1) {
            user.defaultAddressId = newAddress._id; // This will be set by MongoDB
        }

        await user.save();

        // Get the saved address with the generated _id
        const savedAddress = user.addresses[user.addresses.length - 1];

        res.status(201).json({
            success: true,
            message: 'Address saved successfully',
            address: savedAddress
        });
    } catch (error) {
        console.error('Save address error:', error);
        next(error);
    }
});

// Internal helper functions
const getCheckoutDataInternal = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId })
            .populate('items.product', 'name slug images price offerPrice stockQuantity taxRate variants')
            .populate('items.preBuiltPC', 'name slug images basePrice offerPrice totalPrice specifications');

        if (!cart || cart.items.length === 0) {
            return { success: false, error: 'Cart is empty' };
        }

        const validatedItems = [];
        let subtotal = 0;
        let totalTax = 0;

        for (const item of cart.items) {
            let productData, currentPrice, taxRate = 0.18;

            if (item.productType === 'product') {
                productData = item.product;
                if (!productData) continue;
                currentPrice = productData.offerPrice > 0 ? productData.offerPrice : productData.price;
                taxRate = productData.taxRate || 0.18;
            } else if (item.productType === 'prebuilt-pc') {
                productData = item.preBuiltPC;
                if (!productData) continue;
                currentPrice = productData.offerPrice > 0 ? productData.offerPrice : productData.totalPrice;
                taxRate = 0.18;
            }

            const itemTotal = currentPrice * item.quantity;
            // ✅ FIXED: Divide taxRate by 100 to convert percentage to decimal
            const itemTax = itemTotal * (taxRate / 100);

            subtotal += itemTotal;
            totalTax += itemTax;

            validatedItems.push({
                cartItemId: item._id,
                productType: item.productType,
                product: item.productType === 'product' ? item.product._id : item.preBuiltPC._id,
                variant: item.variant,
                name: productData.name,
                slug: productData.slug,
                image: productData.images?.thumbnail?.url || productData.images?.gallery?.[0]?.url,
                quantity: item.quantity,
                price: currentPrice,
                total: itemTotal,
                taxRate: taxRate,
                taxAmount: itemTax,
                available: true
            });
        }

        const shipping = subtotal >= 1000 ? 0 : 100;
        const total = subtotal + shipping + totalTax;

        return {
            success: true,
            data: {
                cartItems: validatedItems,
                pricing: {
                    subtotal: Math.round(subtotal * 100) / 100,
                    shipping: shipping,
                    tax: Math.round(totalTax * 100) / 100,
                    discount: 0,
                    total: Math.round(total * 100) / 100
                }
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const calculateCheckoutInternal = async (userId, couponCode) => {
    const checkoutResponse = await getCheckoutDataInternal(userId);
    if (!checkoutResponse.success) {
        return checkoutResponse;
    }

    const { cartItems, pricing } = checkoutResponse.data;
    let discount = 0;
    let couponDetails = null;

    if (couponCode) {
        try {
            const couponCartItems = cartItems.map(item => ({
                product: item.product.toString(),
                price: item.price,
                quantity: item.quantity
            }));

            const coupon = await Coupon.validateCoupon(couponCode, userId, couponCartItems, pricing.subtotal);
            discount = coupon.calculateDiscount(pricing.subtotal, pricing.subtotal);
            couponDetails = {
                code: coupon.code,
                name: coupon.name,
                discountAmount: discount,
                discountType: coupon.discountType
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    const finalPricing = {
        ...pricing,
        discount: Math.round(discount * 100) / 100,
        total: Math.round((pricing.subtotal + pricing.shipping + pricing.tax - discount) * 100) / 100
    };

    return {
        success: true,
        data: {
            cartItems,
            pricing: finalPricing,
            coupon: couponDetails
        }
    };
};

module.exports = {
    getCheckoutData,
    calculateCheckout,
    createOrder,
    saveAddress
};