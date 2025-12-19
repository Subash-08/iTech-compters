// controllers/paymentController.js
const razorpay = require('../config/razorpay');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const PreBuiltPC = require('../models/preBuiltPCModel');
const crypto = require('crypto');
const mongoose = require('mongoose');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const InvoiceGenerator = require('../utils/invoiceGenerator');
const N8NService = require('../services/n8nService');

// @desc    Create Razorpay order for payment
// @route   POST /api/payment/razorpay/create-order
// @access  Private
// In your paymentController.js - Update createRazorpayOrder function
const createRazorpayOrder = catchAsyncErrors(async (req, res, next) => {
    try {
        const { orderId } = req.body;
        const userId = req.user._id;
        // Validate order exists and belongs to user
        const order = await Order.findOne({
            _id: orderId,
            user: userId,
            status: Order.ORDER_STATUS.PENDING
        });

        if (!order) {
            console.error('❌ Order not found:', orderId);
            return next(new ErrorHandler('Order not found or already processed', 404));
        }

        // Check if already paid
        if (order.isPaid) {
            return res.status(200).json({
                success: true,
                message: 'Order already paid',
                data: {
                    alreadyPaid: true,
                    orderId: order._id,
                    orderNumber: order.orderNumber
                }
            });
        }

        // Check if retry is allowed
        if (!order.canRetryPayment()) {
            return next(new ErrorHandler('Maximum payment attempts reached. Please contact support.', 400));
        }

        // Use order's pricing directly
        const expectedAmount = order.pricing.total;
        if (expectedAmount <= 0) {
            console.error('❌ Invalid order amount:', expectedAmount);
            return next(new ErrorHandler('Invalid order amount', 400));
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(expectedAmount * 100), // Convert to paise
            currency: order.pricing.currency || 'INR',
            receipt: order.orderNumber,
            notes: {
                orderId: order._id.toString(),
                userId: userId.toString(),
                orderNumber: order.orderNumber
            },
            payment_capture: 1 // Auto capture payment
        });

        const paymentAttempt = {
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            status: Order.PAYMENT_STATUS.CREATED,
            createdAt: new Date()
        };

        // Add the attempt and save to get the actual _id
        order.payment.attempts.push(paymentAttempt);
        order.payment.totalAttempts = (order.payment.totalAttempts || 0) + 1;

        // Save to generate the _id
        await order.save();

        // ✅ FIXED: Get the actual _id of the newly created attempt
        const newAttempt = order.payment.attempts[order.payment.attempts.length - 1];
        const attemptId = newAttempt._id.toString();
        res.status(200).json({
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: order._id,
                attemptId: attemptId // ✅ This is the correct _id
            }
        });

    } catch (error) {
        console.error('❌ Create Razorpay order error:', error);

        if (error.error?.description) {
            return next(new ErrorHandler(`Payment gateway error: ${error.error.description}`, 400));
        }

        next(new ErrorHandler('Failed to create payment order', 500));
    }
});
// @desc    Verify Razorpay payment
// @route   POST /api/payment/razorpay/verify
// @access  Private
const verifyRazorpayPayment = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
            attemptId
        } = req.body;

        const userId = req.user._id;

        // 1. Input Validation
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new ErrorHandler('Missing payment verification data', 400));
        }

        // 2. Fetch Order (Read-Only for checks)
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return next(new ErrorHandler('Order not found', 404));
        }

        // 3. IDEMPOTENCY CHECK - If already paid and stock reduced, return success
        if (order.isPaid || order.status === 'confirmed') {
            const stockReduced = order.orderTimeline.some(event =>
                event.event === 'stock_reduced'
            );

            if (stockReduced) {
                return res.status(200).json({
                    success: true,
                    message: 'Payment already verified and stock processed',
                    data: {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        paymentId: razorpay_payment_id,
                        alreadyVerified: true,
                        stockReduced: true
                    }
                });
            } else {
            }
        }

        // 4. Robust Attempt Lookup
        let attempt = order.payment.attempts.find(
            (a) => a.razorpayOrderId === razorpay_order_id
        );

        if (!attempt && attemptId) {
            attempt = order.payment.attempts.id(attemptId);
        }

        if (!attempt) {
            console.error(`Payment attempt not found for Order: ${orderId}, RzpOrder: ${razorpay_order_id}`);
            return next(new ErrorHandler('Payment attempt record not found', 404));
        }

        // 5. Verify Signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            // Atomic Failure Update
            await Order.updateOne(
                { "_id": orderId, "payment.attempts._id": attempt._id },
                {
                    $set: {
                        "payment.attempts.$.status": Order.PAYMENT_STATUS.ATTEMPTED,
                        "payment.attempts.$.errorReason": 'Signature verification failed',
                        "payment.attempts.$.signatureVerified": false
                    },
                    $push: {
                        orderTimeline: {
                            event: "payment_failed",
                            message: "Signature verification failed",
                            changedBy: userId,
                            changedAt: new Date()
                        }
                    }
                }
            );
            return next(new ErrorHandler('Payment verification failed (Signature)', 400));
        }

        // 6. Fetch Payment Details from Razorpay
        let payment;
        try {
            payment = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (rzpError) {
            return next(new ErrorHandler('Failed to fetch payment details from Gateway', 502));
        }

        // 7. Validate Amount (Prevent tampering)
        const expectedAmountInPaise = Math.round(order.pricing.total * 100);

        if (expectedAmountInPaise !== payment.amount) {
            // Atomic Failure Update
            await Order.updateOne(
                { "_id": orderId, "payment.attempts._id": attempt._id },
                {
                    $set: {
                        "payment.attempts.$.status": Order.PAYMENT_STATUS.FAILED,
                        "payment.attempts.$.errorReason": 'Amount mismatch',
                        "payment.attempts.$.signatureVerified": false
                    },
                    $push: {
                        orderTimeline: {
                            event: "payment_failed",
                            message: `Amount mismatch. Expected: ${expectedAmountInPaise}, Got: ${payment.amount}`,
                            changedBy: userId,
                            changedAt: new Date()
                        }
                    }
                }
            );
            return next(new ErrorHandler('Payment amount mismatch', 400));
        }

        // 8. Check Capture Status
        if (payment.status !== 'captured') {
            await Order.updateOne(
                { "_id": orderId, "payment.attempts._id": attempt._id },
                {
                    $set: {
                        "payment.attempts.$.status": Order.PAYMENT_STATUS.FAILED,
                        "payment.attempts.$.errorReason": `Payment status: ${payment.status}`,
                        "payment.attempts.$.signatureVerified": false
                    },
                    $push: {
                        orderTimeline: {
                            event: "payment_failed",
                            message: `Payment not captured. Status: ${payment.status}`,
                            changedBy: userId,
                            changedAt: new Date()
                        }
                    }
                }
            );
            return next(new ErrorHandler('Payment not completed successfully', 400));
        }

        // ============================================================
        // 9. ✅ ATOMIC SUCCESS UPDATE
        // ============================================================

        const gatewayResponse = {
            id: payment.id,
            entity: payment.entity,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            created_at: payment.created_at
        };

        const updateResult = await Order.updateOne(
            {
                "_id": orderId,
                "payment.attempts._id": attempt._id
            },
            {
                $set: {
                    "payment.attempts.$.status": Order.PAYMENT_STATUS.CAPTURED,
                    "payment.attempts.$.razorpayPaymentId": razorpay_payment_id,
                    "payment.attempts.$.razorpaySignature": razorpay_signature,
                    "payment.attempts.$.gatewayPaymentMethod": payment.method,
                    "payment.attempts.$.signatureVerified": true,
                    "payment.attempts.$.capturedAt": new Date(),
                    "payment.attempts.$.gatewayResponse": gatewayResponse,
                    "payment.status": Order.PAYMENT_STATUS.CAPTURED,
                    "status": Order.ORDER_STATUS.CONFIRMED,
                    "pricing.amountPaid": order.pricing.total,
                    "pricing.amountDue": 0
                },
                $unset: {
                    expiresAt: 1
                },
                $push: {
                    orderTimeline: {
                        event: "payment_captured",
                        message: "Payment successfully verified and captured",
                        metadata: {
                            paymentId: razorpay_payment_id,
                            method: payment.method
                        },
                        changedBy: userId,
                        changedAt: new Date()
                    }
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            console.error('❌ Critical: Atomic update failed - Order/Attempt not found');
            return next(new ErrorHandler('Failed to update order: Record not found', 500));
        }
        try {
            await reduceStockForOrder(order);

            // Add stock reduction timeline event
            await Order.updateOne(
                { "_id": orderId },
                {
                    $push: {
                        orderTimeline: {
                            event: "stock_reduced",
                            message: "Product stock reduced after payment verification",
                            changedBy: userId,
                            changedAt: new Date()
                        }
                    }
                }
            );

        } catch (stockError) {
            console.error('❌ Stock reduction failed:', stockError);
            // Don't fail the payment, but log it for admin review
            await Order.updateOne(
                { "_id": orderId },
                {
                    $push: {
                        adminNotes: {
                            note: `Stock reduction failed: ${stockError.message}`,
                            addedBy: userId,
                            addedAt: new Date()
                        },
                        orderTimeline: {
                            event: "stock_reduction_failed",
                            message: `Stock reduction failed: ${stockError.message}`,
                            changedBy: userId,
                            changedAt: new Date()
                        }
                    }
                }
            );
        }

        try {
            const cartCleared = await require('./cartController').clearCartAfterPayment(userId);

        } catch (cartError) {
            console.error('❌ Cart clearance failed:', cartError);
            // Don't fail the payment process
        }

        let invoiceGenerated = false;
        let invoiceData = null;

        try {
            const orderForInvoice = await Order.findById(orderId)
                .populate('user', 'firstName lastName email phone');
            if (orderForInvoice) {

                // Generate invoice automatically after payment verification
                invoiceData = await InvoiceGenerator.generateAutoInvoice(orderForInvoice, orderForInvoice.user);

                // Update order with auto-generated invoice
                await Order.updateOne(
                    { "_id": orderId },
                    {
                        $set: {
                            "invoices.autoGenerated": {
                                invoiceNumber: invoiceData.invoiceNumber,
                                pdfPath: invoiceData.filePath,
                                pdfUrl: invoiceData.pdfUrl,
                                generatedAt: new Date(),
                                version: 1,
                                status: 'generated'
                            }
                        },
                        $push: {
                            orderTimeline: {
                                event: "invoice_generated",
                                message: "Invoice automatically generated after payment verification",
                                metadata: {
                                    invoiceNumber: invoiceData.invoiceNumber,
                                    type: 'auto_generated'
                                },
                                changedBy: userId,
                                changedAt: new Date()
                            }
                        }
                    }
                );

                invoiceGenerated = true;

            } else {
                console.error('❌ Could not find order for invoice generation');
            }

        } catch (invoiceError) {
            console.error('❌ Automatic invoice generation failed:', invoiceError);
            console.error('❌ Invoice error stack:', invoiceError.stack);

            // Mark invoice generation as failed but don't stop payment process
            await Order.updateOne(
                { "_id": orderId },
                {
                    $set: {
                        "invoices.autoGenerated": {
                            status: 'failed',
                            error: invoiceError.message,
                            attemptedAt: new Date()
                        }
                    },
                    $push: {
                        orderTimeline: {
                            event: "invoice_generation_failed",
                            message: "Automatic invoice generation failed after payment",
                            metadata: {
                                error: invoiceError.message
                            },
                            changedBy: userId,
                            changedAt: new Date()
                        }
                    }
                }
            );
        }

        try {
            // CRITICAL: Get fresh, populated order with all data
            const populatedOrder = await Order.findById(orderId)
                .populate('user', 'firstName lastName email phone');

            if (!populatedOrder) {
                console.error('❌ Could not find order for N8N trigger:', orderId);
                // Don't fail the payment process
                return;
            }

            // Extract customer info with shipping address priority
            const shippingAddress = populatedOrder.shippingAddress || {};
            const user = populatedOrder.user || {};

            const customerInfo = {
                name: shippingAddress.firstName && shippingAddress.lastName
                    ? `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim()
                    : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer',
                email: shippingAddress.email || user.email || '',
                phone: shippingAddress.phone ||
                    shippingAddress.mobile ||
                    user.phone ||
                    user.mobile ||
                    ''
            };

            // Send to N8N with complete order data
            await N8NService.run("paymentConfirmed", {
                event: "paymentConfirmed",
                workflowKey: "paymentConfirmed",
                orderId: populatedOrder._id.toString(),
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                customerPhone: customerInfo.phone,
                orderNumber: populatedOrder.orderNumber,
                amountPaid: populatedOrder.pricing?.total || 0,
                currency: '₹',
                paymentMethod: populatedOrder.payment?.attempts?.[0]?.gatewayPaymentMethod || 'razorpay',
                paymentId: razorpay_payment_id,
                items: (populatedOrder.items || []).map(item => ({
                    name: item.name || 'Product',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    total: (item.price || 0) * (item.quantity || 1)
                })),
                shippingAddress: {
                    street: shippingAddress.addressLine1 || '',
                    city: shippingAddress.city || '',
                    state: shippingAddress.state || '',
                    postalCode: shippingAddress.pincode || shippingAddress.postalCode || '',
                    country: shippingAddress.country || 'India'
                },
                billingAddress: populatedOrder.billingAddress || shippingAddress.addressLine1 || '',
                orderDate: populatedOrder.createdAt?.toISOString() || new Date().toISOString(),
                paymentDate: new Date().toISOString(),
                estimatedDelivery: populatedOrder.estimatedDelivery?.toISOString() ||
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                trackingNumber: populatedOrder.shippingMethod?.trackingNumber || 'Will be assigned soon',
                timestamp: new Date().toISOString(),
                source: "backend"
            });
        } catch (n8nError) {
            console.error('❌ N8N paymentConfirmed trigger failed (non-critical):', n8nError.message);
            // Don't fail payment process if N8N fails
        }
        // 12. Send Success Response
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentId: razorpay_payment_id,
                amount: order.pricing.total,
                status: 'confirmed',
                stockReduced: true
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        if (error.error?.description) {
            return next(new ErrorHandler(`Payment verification error: ${error.error.description}`, 400));
        }
        next(new ErrorHandler(error.message || 'Payment verification failed', 500));
    }
});


const reduceStockForOrder = async (order) => {
    const stockReductionResults = {
        successful: [],
        failed: []
    };

    // Process each item in the order
    for (const item of order.items) {
        try {
            if (item.productType === 'product') {
                await reduceProductStock(item);
            } else if (item.productType === 'prebuilt-pc') {
                await reducePreBuiltPCStock(item);
            } else {
                throw new Error(`Unknown product type: ${item.productType}`);
            }

            stockReductionResults.successful.push({
                productId: item.product,
                productType: item.productType,
                name: item.name,
                quantity: item.quantity
            });

        } catch (error) {
            console.error(`❌ Failed to reduce stock for ${item.name}:`, error.message);
            stockReductionResults.failed.push({
                productId: item.product,
                productType: item.productType,
                name: item.name,
                quantity: item.quantity,
                error: error.message
            });
        }
    }

    if (stockReductionResults.failed.length > 0) {
        throw new Error(`Stock reduction failed for ${stockReductionResults.failed.length} items`);
    }

    return stockReductionResults;
};

/**
 * Reduce stock for a regular product (with or without variants)
 */
const reduceProductStock = async (item) => {
    const Product = mongoose.model('Product');

    // Find the product
    const product = await Product.findById(item.product);
    if (!product) {
        throw new Error(`Product not found: ${item.product}`);
    }

    // Check if product has variants
    if (product.variantConfiguration.hasVariants && item.variant && item.variant.variantId) {
        // Reduce stock for specific variant
        await reduceVariantStock(product, item);
    } else {
        // Reduce stock for main product
        await reduceMainProductStock(product, item);
    }
};

/**
 * Reduce stock for a product variant
 */
const reduceVariantStock = async (product, item) => {
    const variant = product.variants.id(item.variant.variantId);
    if (!variant) {
        throw new Error(`Variant not found: ${item.variant.variantId}`);
    }

    if (variant.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for variant. Available: ${variant.stockQuantity}, Requested: ${item.quantity}`);
    }

    // Reduce variant stock
    variant.stockQuantity -= item.quantity;

    // Update variant status if stock becomes 0
    if (variant.stockQuantity === 0) {
        variant.isActive = false;
    }

    // Save the product
    await product.save()
};

/**
 * Reduce stock for main product (no variants)
 */
const reduceMainProductStock = async (product, item) => {
    if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
    }

    // Reduce main product stock
    product.stockQuantity -= item.quantity;

    // Update product status if stock becomes 0
    if (product.stockQuantity === 0 && product.status === 'Published') {
        product.status = 'OutOfStock';
    }

    // Save the product
    await product.save();

};

/**
 * Reduce stock for a prebuilt PC
 */
const reducePreBuiltPCStock = async (item) => {
    const PreBuiltPC = mongoose.model('PreBuiltPC');

    // Find the prebuilt PC
    const preBuiltPC = await PreBuiltPC.findById(item.product);
    if (!preBuiltPC) {
        throw new Error(`PreBuilt PC not found: ${item.product}`);
    }

    if (preBuiltPC.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for PreBuilt PC. Available: ${preBuiltPC.stockQuantity}, Requested: ${item.quantity}`);
    }

    // Reduce prebuilt PC stock
    preBuiltPC.stockQuantity -= item.quantity;

    // Update status if stock becomes 0
    if (preBuiltPC.stockQuantity === 0) {
        preBuiltPC.isActive = false;
    }

    // Save the prebuilt PC
    await preBuiltPC.save();
};

// @desc    Get payment status
// @route   GET /api/payment/order/:orderId/status
// @access  Private
const getPaymentStatus = catchAsyncErrors(async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({
            _id: orderId,
            user: userId
        }).select('orderNumber status payment pricing');

        if (!order) {
            return next(new ErrorHandler('Order not found', 404));
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.payment.status,
                amountPaid: order.pricing.amountPaid,
                amountDue: order.pricing.amountDue,
                isPaid: order.isPaid,
                currentAttempt: order.currentPaymentAttempt,
                retryAllowed: order.payment.retryAllowed !== false,
                totalAttempts: order.payment.totalAttempts || 0
            }
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        next(new ErrorHandler('Failed to get payment status', 500));
    }
});

// @desc    Handle Razorpay webhook
// @route   POST /api/webhook/razorpay
// @access  Public (verified by signature)
const handleRazorpayWebhook = catchAsyncErrors(async (req, res, next) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            console.error('Webhook signature verification failed');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const event = req.body;

        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(event);
                break;

            case 'payment.failed':
                await handlePaymentFailed(event);
                break;

            default:
        }

        res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
});

// ✅ FIXED: Helper Functions

// ✅ FIXED: Stock reservation with atomic operations
const reserveStockForOrder = async (order) => {
    // Check if already processed
    if (order.status === Order.ORDER_STATUS.CONFIRMED) {
        return;
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        for (const item of order.items) {
            if (item.productType === 'product') {
                const product = await Product.findById(item.product).session(session);

                if (!product) {
                    throw new ErrorHandler(`Product not found: ${item.product}`, 400);
                }

                // Atomic stock check and update
                let updateQuery = {};
                let stockCheckQuery = {};

                if (item.variant?.variantId) {
                    const variant = product.variants.id(item.variant.variantId);
                    if (!variant) {
                        throw new ErrorHandler(`Variant not found: ${item.variant.variantId}`, 400);
                    }

                    stockCheckQuery[`variants.$.stockQuantity`] = { $gte: item.quantity };
                    updateQuery[`$inc`] = { [`variants.$.stockQuantity`]: -item.quantity };

                } else {
                    stockCheckQuery.stockQuantity = { $gte: item.quantity };
                    updateQuery[`$inc`] = { stockQuantity: -item.quantity };
                }

                // Atomic update with stock check
                const result = await Product.updateOne(
                    {
                        _id: item.product,
                        ...stockCheckQuery
                    },
                    updateQuery
                ).session(session);

                if (result.modifiedCount === 0) {
                    throw new ErrorHandler(`Insufficient stock for ${product.name}`, 400);
                }
            }
        }

        await session.commitTransaction();

    } catch (error) {
        await session.abortTransaction();

        // Revert order status if stock reservation fails
        await Order.findByIdAndUpdate(order._id, {
            status: Order.ORDER_STATUS.PENDING,
            'payment.status': Order.PAYMENT_STATUS.FAILED
        });

        throw error;
    } finally {
        session.endSession();
    }
};

// ✅ FIXED: Webhook handlers with proper object format
const handlePaymentCaptured = async (event) => {
    const payment = event.payload.payment.entity;

    const order = await Order.findByRazorpayPaymentId(payment.id);

    if (!order) {
        console.error('Order not found for payment:', payment.id);
        return;
    }

    // Check if already processed
    if (order.isPaid) {
        return;
    }

    // Find the attempt with this payment ID
    const attempt = order.payment.attempts.find(
        attempt => attempt.razorpayPaymentId === payment.id
    );

    if (attempt && attempt.status !== Order.PAYMENT_STATUS.CAPTURED) {
        // ✅ FIXED: Use plain object
        const gatewayResponse = {
            id: payment.id,
            entity: payment.entity,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            order_id: payment.order_id,
            method: payment.method,
            captured: payment.captured,
            description: payment.description,
            card_id: payment.card_id,
            bank: payment.bank,
            wallet: payment.wallet,
            vpa: payment.vpa,
            email: payment.email,
            contact: payment.contact,
            created_at: payment.created_at
        };

        await order.updatePaymentAttempt(attempt._id, {
            status: Order.PAYMENT_STATUS.CAPTURED,
            gatewayPaymentMethod: payment.method,
            signatureVerified: true,
            capturedAt: new Date(),
            gatewayResponse: gatewayResponse // ✅ Plain object
        });

        // Stock reservation with protection
        if (!order.isPaid) {
            await reserveStockForOrder(order);
        }
    }
};

const handlePaymentFailed = async (event) => {
    const payment = event.payload.payment.entity;

    const order = await Order.findByRazorpayPaymentId(payment.id);

    if (order) {
        const attempt = order.payment.attempts.find(
            attempt => attempt.razorpayPaymentId === payment.id
        );

        if (attempt && attempt.status !== Order.PAYMENT_STATUS.FAILED) {
            // ✅ FIXED: Use plain object
            const gatewayResponse = {
                id: payment.id,
                entity: payment.entity,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                order_id: payment.order_id,
                method: payment.method,
                error_code: payment.error_code,
                error_description: payment.error_description,
                created_at: payment.created_at
            };

            await order.updatePaymentAttempt(attempt._id, {
                status: Order.PAYMENT_STATUS.FAILED,
                errorReason: payment.error_description || 'Payment failed',
                gatewayResponse: gatewayResponse // ✅ Plain object
            });
        }
    }
};

// ✅ REMOVED: recalculateOrderTotal function completely
// ✅ REMOVED: handleOrderPaid function (not needed)

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getPaymentStatus,
    handleRazorpayWebhook
};