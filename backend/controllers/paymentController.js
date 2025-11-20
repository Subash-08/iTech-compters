// controllers/paymentController.js
const razorpay = require('../config/razorpay');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const PreBuiltPC = require('../models/preBuiltPCModel');
const crypto = require('crypto');
const mongoose = require('mongoose');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Create Razorpay order for payment
// @route   POST /api/payment/razorpay/create-order
// @access  Private
// In your paymentController.js - Update createRazorpayOrder function
const createRazorpayOrder = catchAsyncErrors(async (req, res, next) => {
    try {
        const { orderId } = req.body;
        const userId = req.user._id;

        console.log('🟡 Creating Razorpay order for:', { orderId, userId });

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

        console.log('🟡 Creating Razorpay order with amount:', expectedAmount);

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

        console.log('✅ Razorpay order created:', razorpayOrder.id);

        // ✅ FIXED: Create payment attempt and get the actual _id
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

        console.log('🔑 Generated attemptId:', attemptId);

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
        // We need the order to check if it exists and to find the correct attempt ID
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return next(new ErrorHandler('Order not found', 404));
        }

        // 3. FAST EXIT: Idempotency Check
        // If the order is already marked as Paid, stop immediately.
        if (order.isPaid || order.status === 'confirmed') {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified',
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    paymentId: razorpay_payment_id,
                    alreadyVerified: true
                }
            });
        }

        // 4. Robust Attempt Lookup
        // Priority: Match the Razorpay Order ID from the gateway response.
        let attempt = order.payment.attempts.find(
            (a) => a.razorpayOrderId === razorpay_order_id
        );

        // Fallback: Use the attemptId sent by frontend
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
        // payment.amount is in paise (integer), order.pricing.total is standard currency
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
        // 9. ✅ ATOMIC SUCCESS UPDATE (The Fix)
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

        // We update everything in one DB call.
        // This CANNOT fail with ParallelSaveError.
        await Order.updateOne(
            {
                "_id": orderId,
                "payment.attempts._id": attempt._id
            },
            {
                $set: {
                    // 1. Update Specific Attempt
                    "payment.attempts.$.status": Order.PAYMENT_STATUS.CAPTURED,
                    "payment.attempts.$.razorpayPaymentId": razorpay_payment_id,
                    "payment.attempts.$.razorpaySignature": razorpay_signature,
                    "payment.attempts.$.gatewayPaymentMethod": payment.method,
                    "payment.attempts.$.signatureVerified": true,
                    "payment.attempts.$.capturedAt": new Date(),
                    "payment.attempts.$.gatewayResponse": gatewayResponse,

                    // 2. Update Top-Level Payment Status
                    "payment.status": Order.PAYMENT_STATUS.CAPTURED,

                    // 3. Update Top-Level Order Status
                    "status": Order.ORDER_STATUS.CONFIRMED,

                    // 4. Update Pricing
                    "pricing.amountPaid": order.pricing.total,
                    "pricing.amountDue": 0
                },
                // 5. Remove Expiry
                $unset: {
                    expiresAt: 1
                },
                // 6. Add Timeline Event
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
        // 2. CHANGE: Add this safety check immediately after
        if (updateResult.matchedCount === 0) {
            console.error('❌ Critical: Atomic update failed - Order/Attempt not found in DB query');
            // It is safe to throw an error here because it means the ID was wrong
            return next(new ErrorHandler('Failed to update order: Record not found', 500));
        }

        // 3. CHANGE: Add this log (but DO NOT throw error if modifiedCount is 0)
        if (updateResult.modifiedCount === 0) {
            console.log('⚠️ Note: Payment update matched but modified 0 documents. (Likely duplicate request or already paid)');
        } else {
            console.log('✅ Atomic update successful - order confirmed');
        }
        // 10. Stock Reservation (Optional - assuming this function exists)
        // Note: We fetch the order again if reserveStockForOrder expects a document
        // Or you can pass the ID if your function supports it.
        try {
            const refreshedOrder = await Order.findById(orderId);
            if (typeof reserveStockForOrder === 'function') {
                await reserveStockForOrder(refreshedOrder);
            }
        } catch (stockError) {
            console.error("Stock reservation warning:", stockError);
            // Don't fail the request, payment is already secure.
        }

        // 11. Send Success Response
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentId: razorpay_payment_id,
                amount: order.pricing.total,
                status: 'confirmed'
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        // Handle Razorpay specific errors
        if (error.error?.description) {
            return next(new ErrorHandler(`Payment verification error: ${error.error.description}`, 400));
        }
        next(new ErrorHandler(error.message || 'Payment verification failed', 500));
    }
});

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
        console.log('Razorpay Webhook Received:', event.event);

        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(event);
                break;

            case 'payment.failed':
                await handlePaymentFailed(event);
                break;

            default:
                console.log('Unhandled webhook event:', event.event);
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
        console.log('Order already confirmed, skipping stock reservation');
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
        console.log('Order already paid, skipping webhook processing');
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