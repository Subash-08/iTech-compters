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

const getCheckoutData = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId }).populate([
            {
                path: 'items.product',
                model: 'Product',
                select: 'name basePrice mrp taxRate variants images slug'
            },
            {
                path: 'items.preBuiltPC',
                model: 'PreBuiltPC',
                select: 'name totalPrice discountPrice images slug'
            }
        ]);

        const user = await User.findById(userId).select('addresses defaultAddressId');

        if (!cart || cart.items.length === 0) {
            return next(new ErrorHandler('Cart is empty', 400));
        }

        const validatedItems = [];
        let subtotal = 0;
        let totalTax = 0;
        let totalSavings = 0; // ✅ ADD savings calculation

        for (const item of cart.items) {
            let productData, currentPrice, originalPrice, taxRate;

            if (item.productType === 'product') {
                productData = item.product;
                if (!productData) continue;

                // ✅ FIXED: Use actual tax rate from product
                let rawTaxRate = productData.taxRate;
                if (!rawTaxRate || rawTaxRate <= 0) {
                    console.warn('⚠️ No tax rate found for product, using 18%:', productData.name);
                    rawTaxRate = 18;
                }

                // Convert to decimal if it's a percentage
                if (rawTaxRate > 1) {
                    taxRate = rawTaxRate / 100;
                } else {
                    taxRate = rawTaxRate;
                }

                // ✅ UPDATED: Use basePrice as selling price, mrp as original price
                currentPrice = productData.basePrice; // Selling price
                originalPrice = productData.mrp || productData.basePrice; // Original price for savings calculation

                // Handle variants
                if (item.variant?.variantId && productData.variants) {
                    const variant = productData.variants.id(item.variant.variantId);
                    if (variant) {
                        // ✅ UPDATED: Use variant price as selling price, variant mrp as original
                        currentPrice = variant.price; // Selling price
                        originalPrice = variant.mrp || variant.price; // Original price

                        // Use variant tax rate if available
                        let variantTaxRate = variant.taxRate || taxRate;
                        if (variantTaxRate > 1) variantTaxRate = variantTaxRate / 100;
                        taxRate = variantTaxRate;
                    }
                }

            } else if (item.productType === 'prebuilt-pc') {
                productData = item.preBuiltPC;
                if (!productData) continue;

                taxRate = 0.18;
                currentPrice = productData.discountPrice > 0 ? productData.discountPrice : productData.totalPrice;
                originalPrice = productData.totalPrice;
            }

            // Fallback to stored price from cart
            if (!currentPrice || currentPrice <= 0) {
                currentPrice = item.price;
                originalPrice = item.price;
            }

            const itemTotal = currentPrice * item.quantity;
            const itemTax = itemTotal * taxRate;
            const itemSavings = (originalPrice - currentPrice) * item.quantity;

            subtotal += itemTotal;
            totalTax += itemTax;
            totalSavings += itemSavings;

            console.log(`✅ Updated pricing for ${productData.name}:`, {
                originalPrice: originalPrice,
                sellingPrice: currentPrice,
                quantity: item.quantity,
                taxRate: (taxRate * 100).toFixed(2) + '%',
                itemTax: itemTax,
                itemTotal: itemTotal,
                itemSavings: itemSavings
            });

            validatedItems.push({
                cartItemId: item._id,
                productType: item.productType,
                product: item.productType === 'product' ? item.product._id : item.preBuiltPC._id,
                variant: item.variant,
                name: productData.name,
                slug: productData.slug,
                image: productData.images?.thumbnail?.url || productData.images?.gallery?.[0]?.url || productData.images?.main?.url,
                quantity: item.quantity,
                price: currentPrice, // Selling price
                originalPrice: originalPrice, // MRP/Original price
                total: itemTotal,
                taxRate: taxRate,
                taxAmount: itemTax,
                available: true
            });
        }

        const shipping = subtotal >= 1000 ? 0 : 100;
        const total = subtotal + shipping + totalTax;

        console.log('💰 UPDATED FINAL PRICING:', {
            subtotal: subtotal,
            totalTax: totalTax,
            shipping: shipping,
            total: total,
            totalSavings: totalSavings,
            averageTaxRate: ((totalTax / subtotal) * 100).toFixed(2) + '%'
        });

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
                    total: Math.round(total * 100) / 100,
                    totalSavings: Math.round(totalSavings * 100) / 100 // ✅ ADD savings
                },
                summary: {
                    totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
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
        console.log('🟡 Request body:', JSON.stringify(req.body, null, 2));

        const {
            shippingAddressId,
            billingAddressId,
            couponCode,
            gstInfo,
            paymentMethod
        } = req.body;
        const userId = req.user._id;

        console.log('🟡 User ID:', userId);
        console.log('🟡 Shipping Address ID:', shippingAddressId);

        // Get user and addresses
        const user = await User.findById(userId);
        if (!user) {
            console.error('❌ User not found:', userId);
            return next(new ErrorHandler('User not found', 404));
        }

        console.log('🟡 User found:', user.email);

        // Find addresses
        const shippingAddress = user.addresses.id(shippingAddressId);
        if (!shippingAddress) {
            console.error('❌ Shipping address not found:', shippingAddressId);
            console.log('🟡 Available addresses:', user.addresses);
            return next(new ErrorHandler('Shipping address not found', 400));
        }

        console.log('🟡 Shipping address found:', shippingAddress);

        const billingAddress = billingAddressId ?
            user.addresses.id(billingAddressId) : shippingAddress;

        // Recalculate totals with better error handling
        console.log('🟡 Recalculating totals...');
        let calculationResponse;
        try {
            calculationResponse = await calculateCheckoutInternal(userId, couponCode);
            console.log('🟡 Calculation response:', calculationResponse);
        } catch (calcError) {
            console.error('❌ Calculate checkout error:', calcError);
            return next(new ErrorHandler('Failed to calculate order totals: ' + calcError.message, 400));
        }

        if (!calculationResponse.success) {
            console.error('❌ Calculation failed:', calculationResponse);
            return next(new ErrorHandler('Failed to calculate order totals', 400));
        }

        const { cartItems, pricing, couponDetails } = calculationResponse.data;

        console.log('🟡 Cart items:', cartItems);
        console.log('🟡 Pricing:', pricing);
        console.log('🟡 Coupon details:', couponDetails);

        // Check if cart is empty
        if (!cartItems || cartItems.length === 0) {
            console.error('❌ Cart is empty');
            return next(new ErrorHandler('Cart is empty', 400));
        }

        const orderItems = await Promise.all(cartItems.map(async (item) => {
            // Get product details to determine MRP and base price
            let productDetails = null;
            try {
                if (item.productType === 'product') {
                    productDetails = await Product.findById(item.product)
                        .select('mrp basePrice variants');
                }
            } catch (error) {
                console.warn('⚠️ Could not fetch product details for:', item.product);
            }

            let originalPrice = item.originalPrice || item.price;
            let discountedPrice = item.price;

            // Calculate proper prices based on product data
            if (productDetails) {
                // If product has variants and we have variant info
                if (item.variant && item.variant.variantId && productDetails.variants) {
                    const variant = productDetails.variants.id(item.variant.variantId);
                    if (variant) {
                        originalPrice = variant.mrp || originalPrice;
                        discountedPrice = variant.price || discountedPrice;
                    }
                } else {
                    // Use product-level pricing
                    originalPrice = productDetails.mrp || originalPrice;
                    discountedPrice = productDetails.basePrice || discountedPrice;
                }
            }

            // Ensure prices are valid numbers
            originalPrice = Number(originalPrice) || item.price;
            discountedPrice = Number(discountedPrice) || item.price;

            const itemTotal = discountedPrice * item.quantity;

            // 🚨 CRITICAL FIX: Convert tax rate from percentage to decimal
            const taxRate = item.taxRate || 18;
            const taxAmount = itemTotal * (taxRate / 100); // ✅ FIXED: Divide by 100

            console.log(`🟡 Item ${item.name}:`, {
                originalPrice,
                discountedPrice,
                quantity: item.quantity,
                total: itemTotal,
                taxRate: taxRate + '%',
                taxAmount,
                savings: (originalPrice - discountedPrice) * item.quantity
            });

            return {
                productType: item.productType,
                product: item.product,
                variant: item.variant,
                name: item.name,
                sku: item.sku || `ITEM-${item.product?.toString().slice(-6) || 'UNKNOWN'}`,
                image: item.image,
                quantity: item.quantity,
                originalPrice: originalPrice,
                discountedPrice: discountedPrice,
                total: itemTotal,
                taxRate: taxRate, // Keep as percentage for display
                taxAmount: taxAmount, // Now correctly calculated
                returnable: true,
                returnWindow: 7
            };
        }));

        // ✅ Generate order number manually
        const orderNumber = generateOrderNumber();
        console.log('✅ Generated order number:', orderNumber);

        // Create order data with validated pricing
        const orderData = {
            user: userId,
            orderNumber: orderNumber,
            items: orderItems,
            pricing: {
                subtotal: pricing.subtotal || 0,
                shipping: pricing.shipping || 0,
                tax: pricing.tax || 0,
                discount: pricing.discount || 0,
                total: pricing.total || 0,
                currency: 'INR',
                amountPaid: 0,
                amountDue: pricing.total || 0,
                totalSavings: orderItems.reduce((savings, item) => {
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

        console.log('🟡 Creating order with orderNumber:', orderNumber);
        console.log('🟡 Order items with prices:', orderItems.map(item => ({
            name: item.name,
            originalPrice: item.originalPrice,
            discountedPrice: item.discountedPrice,
            total: item.total,
            taxAmount: item.taxAmount
        })));

        // Create order
        const order = await Order.create(orderData);

        console.log('✅ Order created successfully:', order.orderNumber);

        // Update coupon usage
        if (couponDetails && couponDetails.code) {
            try {
                await Coupon.findOneAndUpdate(
                    { code: couponDetails.code },
                    {
                        $inc: { usageCount: 1 },
                        $addToSet: { usedBy: userId }
                    }
                );
                console.log('✅ Coupon usage updated:', couponDetails.code);
            } catch (couponError) {
                console.warn('⚠️ Could not update coupon usage:', couponError.message);
            }
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

        console.log('✅ Cart cleared for user:', userId);

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
        console.log('🟡 getCheckoutDataInternal started for user:', userId);

        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.product',
                select: 'name slug images basePrice mrp stockQuantity taxRate variants',
            })
            .populate('items.preBuiltPC', 'name slug images basePrice totalPrice specifications');

        if (!cart || cart.items.length === 0) {
            console.log('❌ Cart is empty');
            return { success: false, error: 'Cart is empty' };
        }

        console.log('🟡 Cart found with items:', cart.items.length);

        const validatedItems = [];
        let subtotal = 0;
        let totalTax = 0;

        for (const item of cart.items) {
            console.log('🟡 Processing cart item:', {
                productType: item.productType,
                productId: item.product?._id,
                variantId: item.variant?.variantId,
                quantity: item.quantity
            });

            let currentPrice = 0;
            let originalPrice = 0;
            let taxRate = 18; // ✅ CHANGED: Default to 18 (percentage), not 0.18
            let name = 'Product';
            let image = '';
            let sku = 'UNKNOWN';

            if (item.productType === 'product') {
                name = item.product?.name || 'Product';
                image = item.product?.images?.thumbnail?.url ||
                    item.product?.images?.gallery?.[0]?.url ||
                    '';

                // METHOD 1: Use variant price from cart if available
                if (item.variant?.price) {
                    currentPrice = item.variant.price;
                    originalPrice = item.variant.mrp || item.variant.price;
                    console.log('✅ Using variant price from cart:', currentPrice);
                }
                // METHOD 2: Use product basePrice
                else if (item.product?.basePrice) {
                    currentPrice = item.product.basePrice;
                    originalPrice = item.product.mrp || item.product.basePrice;
                    console.log('✅ Using product basePrice:', currentPrice);
                }
                // METHOD 3: Last resort - use a default price
                else {
                    currentPrice = 100;
                    originalPrice = 100;
                    console.warn('⚠️ Using default price for product');
                }

                // ✅ FIXED: Get tax rate and ensure it's a percentage
                taxRate = item.product?.taxRate || 18;
                // If taxRate is less than 1, it's already decimal - convert to percentage
                if (taxRate < 1) {
                    taxRate = taxRate * 100;
                    console.log(`🔄 Converted tax rate from decimal to percentage: ${taxRate}%`);
                }

                sku = item.product?.sku || 'UNKNOWN';

            } else if (item.productType === 'prebuilt-pc' && item.preBuiltPC) {
                name = item.preBuiltPC.name;
                currentPrice = item.preBuiltPC.basePrice || item.preBuiltPC.totalPrice;
                originalPrice = item.preBuiltPC.totalPrice;
                image = item.preBuiltPC.images?.thumbnail?.url ||
                    item.preBuiltPC.images?.gallery?.[0]?.url || '';
                sku = item.preBuiltPC.sku || 'PREBUILT-PC';
                taxRate = 18; // Pre-built PCs use 18%
            } else {
                console.warn('⚠️ Skipping invalid cart item');
                continue;
            }

            // Ensure prices are valid numbers
            currentPrice = Number(currentPrice) || 0;
            originalPrice = Number(originalPrice) || currentPrice;

            const itemTotal = currentPrice * item.quantity;

            // ✅ FIXED: Calculate tax correctly - taxRate is now in percentage
            const itemTax = itemTotal * (taxRate / 100);

            subtotal += itemTotal;
            totalTax += itemTax;

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
                taxRate: taxRate, // Store as percentage
                taxAmount: itemTax,
                available: true,
                sku: sku
            });

            console.log(`✅ Cart item "${name}":`, {
                price: currentPrice,
                quantity: item.quantity,
                total: itemTotal,
                taxRate: taxRate + '%',
                taxAmount: itemTax
            });
        }

        // Check if we have any valid items
        if (validatedItems.length === 0) {
            console.error('❌ No valid items after processing');
            return { success: false, error: 'No valid items in cart' };
        }

        const shipping = subtotal >= 1000 ? 0 : 100;
        const total = subtotal + shipping + totalTax;

        console.log('🟡 Final pricing calculation:', {
            subtotal,
            shipping,
            totalTax,
            total,
            itemCount: validatedItems.length
        });

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
        console.error('❌ getCheckoutDataInternal error:', error);
        return { success: false, error: error.message };
    }
};

const calculateCheckoutInternal = async (userId, couponCode) => {
    try {
        console.log('🟡 Starting calculateCheckoutInternal for user:', userId);
        console.log('🟡 Coupon code:', couponCode);

        // Get checkout data
        const checkoutResponse = await getCheckoutDataInternal(userId);
        console.log('🟡 Checkout response:', checkoutResponse);

        if (!checkoutResponse.success) {
            console.error('❌ Checkout data failed:', checkoutResponse);
            return checkoutResponse;
        }

        const { cartItems, pricing } = checkoutResponse.data;

        console.log('🟡 Cart items count:', cartItems?.length);
        console.log('🟡 Initial pricing:', pricing);

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
                console.log('🟡 Applying coupon:', couponCode);

                const couponCartItems = cartItems.map(item => ({
                    product: item.product?.toString?.(),
                    price: item.price,
                    quantity: item.quantity
                }));

                console.log('🟡 Coupon cart items:', couponCartItems);

                const coupon = await Coupon.validateCoupon(couponCode, userId, couponCartItems, pricing.subtotal);
                console.log('🟡 Coupon validated:', coupon);

                discount = coupon.calculateDiscount(pricing.subtotal, pricing.subtotal);
                console.log('🟡 Discount calculated:', discount);

                couponDetails = {
                    couponId: coupon._id,
                    code: coupon.code,
                    name: coupon.name,
                    discountAmount: discount,
                    discountType: coupon.discountType
                };

                console.log('🟡 Coupon details:', couponDetails);

            } catch (error) {
                console.error('❌ Coupon validation error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        // Calculate final pricing
        const finalPricing = {
            ...pricing,
            discount: Math.round(discount * 100) / 100,
            total: Math.round((pricing.subtotal + pricing.shipping + pricing.tax - discount) * 100) / 100
        };

        console.log('🟡 Final pricing:', finalPricing);

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
        console.log('🟡 Using fallback checkout data calculation');

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

        // Calculate pricing manually
        const subtotal = cart.items.reduce((sum, item) => {
            const itemPrice = item.variant?.price || item.product?.price || item.price || 0;
            return sum + (itemPrice * item.quantity);
        }, 0);

        const shipping = subtotal >= 1000 ? 0 : 50; // Free shipping above ₹1000
        const tax = subtotal * 0.18; // 18% GST
        const total = subtotal + shipping + tax;

        const cartItems = cart.items.map(item => ({
            productType: 'product',
            product: item.product?._id || item.product,
            variant: item.variant,
            name: item.product?.name || 'Product',
            sku: item.product?.sku || item.variant?.sku || 'UNKNOWN',
            image: item.product?.images?.[0] || item.variant?.image,
            quantity: item.quantity,
            price: item.variant?.price || item.product?.price || item.price,
            originalPrice: item.variant?.price || item.product?.price || item.price,
            discountedPrice: item.variant?.price || item.product?.price || item.price,
            total: (item.variant?.price || item.product?.price || item.price) * item.quantity,
            taxRate: 0.18,
            taxAmount: ((item.variant?.price || item.product?.price || item.price) * item.quantity) * 0.18
        }));

        const pricing = {
            subtotal: Math.round(subtotal * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            discount: 0,
            total: Math.round(total * 100) / 100
        };

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