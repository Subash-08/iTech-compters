const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const PreBuiltPC = require("../models/preBuiltPCModel");
const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const {
    normalizeTaxRate,
    calculateTaxBreakdown,
    calculatePriceWithTax,
    calculateTaxAmount,
    calculateItemLevelTaxBreakdown
} = require("../utils/taxUtils");

const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${dateStr}-${random}`;
};

const getCheckoutData = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Use internal helper to get data
        const checkoutResponse = await getCheckoutDataInternal(userId);

        if (!checkoutResponse.success) {
            // Handle "Cart is empty" as 400 or other errors
            return next(new ErrorHandler(checkoutResponse.error || 'Failed to get checkout data', 400));
        }

        const { cartItems, pricing } = checkoutResponse.data;
        const user = await User.findById(userId).select('addresses defaultAddressId');

        res.status(200).json({
            success: true,
            data: {
                cartItems: cartItems,
                addresses: user.addresses || [],
                defaultAddressId: user.defaultAddressId,
                pricing: pricing,
                summary: {
                    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
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
                    pricing.total
                );

                // Calculate discount amount
                let applicableItemsTotal = pricing.total;

                if (coupon.applicableTo !== 'all_products') {
                    applicableItemsTotal = cartItems.reduce((total, item) => {
                        let isApplicable = false;

                        if (coupon.applicableTo === 'specific_products') {
                            isApplicable = coupon.specificProducts.includes(item.product.toString());
                        }
                        // Add other applicability checks as needed

                        // use tax-inclusive item total for applicable items
                        return isApplicable ? total + item.total + (item.taxAmount || 0) : total;
                    }, 0);
                }

                // Apply coupon on the tax-inclusive total, not subtotal
                discount = coupon.calculateDiscount(pricing.total, applicableItemsTotal);
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

        // Recalculate totals with discount applied BEFORE tax (per-item, using each item's taxRate)
        // For free_shipping coupons: discount = 0 on items, shipping reduced to 0 separately
        const shippingAfterCoupon = couponDetails?.discountType === 'free_shipping' ? 0 : pricing.shipping;
        const finalPricing = calculateItemLevelTaxBreakdown(cartItems, discount, shippingAfterCoupon);

        console.log(`[DEBUG] /api/checkout/calculate - Coupon: ${couponCode || 'None'}`);
        console.log(`[DEBUG] /api/checkout/calculate - Original Total: ${pricing.total}, Discount: ${discount}, Final Total: ${finalPricing.total}`);


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
            console.error('❌ User not found:', userId);
            return next(new ErrorHandler('User not found', 404));
        }

        // Find addresses
        const shippingAddress = user.addresses.id(shippingAddressId);
        if (!shippingAddress) {
            console.error('❌ Shipping address not found:', shippingAddressId);
            return next(new ErrorHandler('Shipping address not found', 400));
        }
        const billingAddress = billingAddressId ?
            user.addresses.id(billingAddressId) : shippingAddress;
        let calculationResponse;
        try {
            calculationResponse = await calculateCheckoutInternal(userId, couponCode);
        } catch (calcError) {
            console.error('❌ Calculate checkout error:', calcError);
            return next(new ErrorHandler('Failed to calculate order totals: ' + calcError.message, 400));
        }

        if (!calculationResponse.success) {
            console.error('❌ Calculation failed:', calculationResponse);
            return next(new ErrorHandler('Failed to calculate order totals', 400));
        }

        const { cartItems, pricing, couponDetails } = calculationResponse.data;

        // Check if cart is empty
        if (!cartItems || cartItems.length === 0) {
            console.error('❌ Cart is empty');
            return next(new ErrorHandler('Cart is empty', 400));
        }

        // Use pre-validated items from checkout calculation
        // Do NOT re-fetch or re-calculate tax to ensure consistency
        const orderItems = cartItems.map((item) => {
            return {
                productType: item.productType,
                product: item.product,
                variant: item.variant,
                name: item.name,
                sku: item.sku || `ITEM-${item.product?.toString().slice(-6) || 'UNKNOWN'}`,
                image: item.image,
                quantity: item.quantity,
                originalPrice: item.originalPrice,
                discountedPrice: item.price, // item.price is the selling price
                total: item.total,
                taxRate: item.taxRate, // Already percentage
                taxAmount: item.taxAmount, // Pre-calculated
                returnable: true,
                returnWindow: 7
            };
        });
        const orderNumber = generateOrderNumber();

        // Create order data with validated pricing
        // Strict Pricing Rule:
        // total = subtotal + tax + shipping (before discount)
        // amountDue = total - discount
        const orderData = {
            user: userId,
            orderNumber: orderNumber,
            items: orderItems,
            pricing: {
                subtotal: pricing.subtotal || 0,
                shipping: pricing.shipping || 0,
                tax: pricing.tax || 0,
                discount: pricing.discount || 0,
                total: pricing.total || 0, // This is now subtotal + tax + shipping
                currency: 'INR',
                amountPaid: 0,
                amountDue: pricing.amountDue || 0, // This is now total - discount
                totalSavings: pricing.discount + orderItems.reduce((savings, item) => {
                    return savings + ((item.originalPrice - item.discountedPrice) * item.quantity);
                }, 0)
            },
            coupon: couponDetails ? {
                couponId: couponDetails.couponId,
                code: couponDetails.code,
                name: couponDetails.name,
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

        console.log(`[DEBUG] /api/checkout/create-order - Saving order with totalAmount: ${orderData.pricing.total}, discount: ${orderData.pricing.discount}, amountDue: ${orderData.pricing.amountDue}`);



        const order = await Order.create(orderData);
        if (couponDetails && couponDetails.code) {
            try {
                await Coupon.findOneAndUpdate(
                    { code: couponDetails.code },
                    {
                        $inc: { usageCount: 1 },
                        $addToSet: { usedBy: userId }
                    }
                );
            } catch (couponError) {
                console.warn('⚠️ Could not update coupon usage:', couponError.message);
            }
        }

        // Update user's orders array
        await User.findByIdAndUpdate(userId, {
            $push: { orders: order._id }
        });

        // Cart clearance removed from here. 
        // Cart will be cleared in paymentController.js AFTER successful payment.

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: order,
            orderId: order._id,
            orderNumber: order.orderNumber
        });

    } catch (error) {
        console.error('❌ Create order error:', error);
        console.error('❌ Error stack:', error.stack);

        // More specific error handling for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return next(new ErrorHandler(`Order validation failed: ${validationErrors.join(', ')}`, 400));
        }

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

        // Create new address - MongoDB will auto-generate _id
        const newAddress = {
            ...address
        };

        user.addresses.push(newAddress);

        await user.save();

        // Get the saved address with the generated _id
        const savedAddress = user.addresses[user.addresses.length - 1];

        // Set as default AFTER saving to get the generated _id
        if (setAsDefault || user.addresses.length === 1) {
            user.defaultAddressId = savedAddress._id;
            // Update all addresses' isDefault flags
            user.addresses.forEach(addr => {
                addr.isDefault = (addr._id.toString() === savedAddress._id.toString());
            });
            await user.save();
        }

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

// @desc    Delete user address
// @route   DELETE /api/checkout/address/:id
// @access  Private
const deleteAddress = catchAsyncErrors(async (req, res, next) => {
    try {
        const addressId = req.params.id;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Find the address to delete using findIndex
        const addressIndex = user.addresses.findIndex(addr =>
            addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return next(new ErrorHandler('Address not found', 404));
        }

        const deletedAddress = user.addresses[addressIndex];

        // Remove the address from the array
        user.addresses.splice(addressIndex, 1);

        // If deleted address was default, set a new default
        if (user.defaultAddressId && user.defaultAddressId.toString() === addressId) {
            if (user.addresses.length > 0) {
                user.defaultAddressId = user.addresses[0]._id;
                user.addresses[0].isDefault = true;
            } else {
                user.defaultAddressId = null;
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
            deletedAddressId: addressId
        });
    } catch (error) {
        console.error('Delete address error:', error);
        next(error);
    }
});
// @desc    Update user address
// @route   PUT /api/checkout/address/:id
// @access  Private
const updateAddress = catchAsyncErrors(async (req, res, next) => {
    try {
        const addressId = req.params.id;
        const { address: addressData, setAsDefault = false } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Find the address to update using findIndex
        const addressIndex = user.addresses.findIndex(addr =>
            addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return next(new ErrorHandler('Address not found', 404));
        }

        // Update address fields
        Object.keys(addressData).forEach(key => {
            if (addressData[key] !== undefined) {
                user.addresses[addressIndex][key] = addressData[key];
            }
        });

        // Handle default address setting
        if (setAsDefault) {
            user.defaultAddressId = addressId;
            // Update all addresses' isDefault flags
            user.addresses.forEach(addr => {
                addr.isDefault = (addr._id.toString() === addressId);
            });
        }

        await user.save();

        // Get the updated address
        const updatedAddress = user.addresses[addressIndex];

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            address: updatedAddress
        });
    } catch (error) {
        console.error('Update address error:', error);
        next(error);
    }
});
const getCheckoutDataInternal = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.product',
                select: 'name slug images basePrice mrp stockQuantity taxRate variants',
            })
            .populate('items.preBuiltPC', 'name slug images basePrice totalPrice taxRate specifications');

        if (!cart || cart.items.length === 0) {
            return { success: false, error: 'Cart is empty' };
        }
        const validatedItems = [];
        let subtotal = 0;

        for (const item of cart.items) {
            let currentPrice = 0;
            let originalPrice = 0;
            let taxRate = 18; // Default percentage
            let name = 'Product';
            let image = '';
            let sku = 'UNKNOWN';

            if (item.productType === 'product') {
                name = item.product?.name || 'Product';
                image = item.product?.images?.thumbnail?.url ||
                    item.product?.images?.gallery?.[0]?.url ||
                    '';

                // Use variant price if available
                if (item.variant?.price) {
                    currentPrice = item.variant.price;
                    originalPrice = item.variant.mrp || item.variant.price;
                } else if (item.product?.basePrice) {
                    currentPrice = item.product.basePrice;
                    originalPrice = item.product.mrp || item.product.basePrice;
                } else {
                    currentPrice = 100;
                    originalPrice = 100;
                }

                taxRate = normalizeTaxRate(item.product?.taxRate);
                sku = item.product?.sku || 'UNKNOWN';

            } else if (item.productType === 'prebuilt-pc' && item.preBuiltPC) {
                name = item.preBuiltPC.name;
                currentPrice = item.preBuiltPC.basePrice || item.preBuiltPC.totalPrice;
                originalPrice = item.preBuiltPC.totalPrice;
                image = item.preBuiltPC.images?.thumbnail?.url ||
                    item.preBuiltPC.images?.gallery?.[0]?.url || '';
                sku = item.preBuiltPC.sku || 'PREBUILT-PC';
                // Read taxRate from populated preBuiltPC model — never hardcode
                taxRate = normalizeTaxRate(item.preBuiltPC?.taxRate);
            } else {
                continue;
            }

            currentPrice = Number(currentPrice) || 0;
            originalPrice = Number(originalPrice) || currentPrice;

            const itemTotal = currentPrice * item.quantity;
            const itemTax = calculateTaxAmount(itemTotal, taxRate);
            subtotal += itemTotal;

            validatedItems.push({
                cartItemId: item._id,
                productType: item.productType,
                product: item.productType === 'product' ? item.product._id : item.preBuiltPC._id,
                variant: item.variant,
                name: name,
                slug: item.product?.slug || item.preBuiltPC?.slug,
                image: image,
                quantity: item.quantity,
                price: currentPrice,
                originalPrice: originalPrice,
                discountedPrice: currentPrice,
                total: itemTotal,
                taxRate: taxRate,
                taxAmount: itemTax,
                available: true,
                sku: sku
            });
        }

        if (validatedItems.length === 0) {
            return { success: false, error: 'No valid items in cart' };
        }

        const shipping = subtotal >= 1000 ? 0 : 100;

        // Initial breakdown with 0 discount (coupon applied later in calculateCheckoutInternal)
        // Uses per-item taxRate — no flat rate hardcoded
        const taxBreakdown = calculateItemLevelTaxBreakdown(validatedItems, 0, shipping);

        return {
            success: true,
            data: {
                cartItems: validatedItems,
                pricing: taxBreakdown
            }
        };
    } catch (error) {
        console.error('❌ getCheckoutDataInternal error:', error);
        return { success: false, error: error.message };
    }
};

const calculateCheckoutInternal = async (userId, couponCode) => {
    try {
        const checkoutResponse = await getCheckoutDataInternal(userId);


        if (!checkoutResponse.success) {
            console.error('❌ Checkout data failed:', checkoutResponse);
            return checkoutResponse;
        }

        const { cartItems, pricing } = checkoutResponse.data;
        // Check if cart is empty
        if (!cartItems || cartItems.length === 0) {
            console.error('❌ Cart is empty');
            return {
                success: false,
                error: 'Cart is empty'
            };
        }

        let discount = 0;
        let couponDetails = null;

        // Apply coupon if provided
        if (couponCode) {
            try {

                const couponCartItems = cartItems.map(item => ({
                    product: item.product?.toString?.(),
                    price: item.price,
                    quantity: item.quantity
                }));

                const coupon = await Coupon.validateCoupon(couponCode, userId, couponCartItems, pricing.total);

                let applicableItemsTotal = null;
                if (coupon.applicableTo !== 'all_products') {
                    applicableItemsTotal = cartItems.reduce((total, item) => {
                        let isApplicable = false;
                        if (coupon.applicableTo === 'specific_products') {
                            isApplicable = coupon.specificProducts.includes(item.product?._id?.toString() || item.product?.toString());
                        } else if (coupon.applicableTo === 'specific_categories') {
                            // simplistic check if category logic is needed, although cartItems may not populate it deep
                            isApplicable = coupon.specificCategories.includes(item.category?.toString());
                        }
                        return isApplicable ? total + item.total + (item.taxAmount || 0) : total;
                    }, 0);
                }

                discount = coupon.calculateDiscount(pricing.total, applicableItemsTotal || pricing.total);

                couponDetails = {
                    couponId: coupon._id,
                    code: coupon.code,
                    name: coupon.name,
                    discountAmount: discount,
                    discountType: coupon.discountType
                };

            } catch (error) {
                console.error('❌ Coupon validation error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        // Calculate final pricing: discount applied BEFORE tax, per-item taxRate used
        // For free_shipping coupons: discount = 0, shipping = 0
        const shippingAfterCoupon = couponDetails?.discountType === 'free_shipping' ? 0 : pricing.shipping;
        const finalPricing = calculateItemLevelTaxBreakdown(cartItems, discount, shippingAfterCoupon);

        console.log(`[DEBUG] calculateCheckoutInternal - Coupon: ${couponCode || 'None'}`);
        console.log(`[DEBUG] calculateCheckoutInternal - Original Total: ${pricing.total}, Discount: ${discount}, Final Total: ${finalPricing.total}`);


        return {
            success: true,
            data: {
                cartItems,
                pricing: finalPricing,
                couponDetails // Changed from 'coupon' to 'couponDetails' to match your createOrder function
            }
        };

    } catch (error) {
        console.error('❌ calculateCheckoutInternal error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Add this as a backup
const getCheckoutDataFallback = async (userId) => {
    try {
        // Get cart directly
        const cart = await Cart.findOne({ userId })
            .populate('items.product', 'name price images sku')
            .populate('items.variant', 'name price sku');

        if (!cart || !cart.items || cart.items.length === 0) {
            return {
                success: false,
                error: 'Cart is empty'
            };
        }

        // Calculate pricing manually — taxRate read from each product (never hardcoded)
        const cartItems = cart.items.map(item => {
            const itemPrice = item.variant?.price || item.product?.price || item.price || 0;
            const itemQty = item.quantity || 1;
            const itemTotal = itemPrice * itemQty;
            // taxRate is percentage (e.g., 18); normalizeTaxRate handles decimal legacy values
            const itemTaxRate = normalizeTaxRate(item.product?.taxRate);
            const itemTaxAmount = Math.round(calculateTaxAmount(itemTotal, itemTaxRate) * 100) / 100;
            return {
                productType: 'product',
                product: item.product?._id || item.product,
                variant: item.variant,
                name: item.product?.name || 'Product',
                sku: item.product?.sku || item.variant?.sku || 'UNKNOWN',
                image: item.product?.images?.[0] || item.variant?.image,
                quantity: itemQty,
                price: itemPrice,
                originalPrice: itemPrice,
                discountedPrice: itemPrice,
                total: itemTotal,       // pre-discount, tax-exclusive
                taxRate: itemTaxRate,   // percentage form
                taxAmount: itemTaxAmount
            };
        });

        const subtotal = Math.round(
            cartItems.reduce((s, i) => s + i.total, 0) * 100
        ) / 100;
        const shipping = subtotal >= 1000 ? 0 : 150;
        const pricing = calculateItemLevelTaxBreakdown(cartItems, 0, shipping);

        return {
            success: true,
            data: {
                cartItems,
                pricing
            }
        };

    } catch (error) {
        console.error('❌ Fallback checkout data error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    getCheckoutData,
    calculateCheckout,
    createOrder,
    saveAddress,
    deleteAddress,
    updateAddress
};