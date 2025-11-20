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

        // ✅ Use order's pricing directly (no recalculation needed)
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

        // ✅ FIXED: Handle expires_at properly
        let expiresAt = null;
        if (razorpayOrder.expires_at) {
            expiresAt = new Date(razorpayOrder.expires_at * 1000); // Convert from seconds to milliseconds
        }

        // ✅ FIXED: Create payment attempt with proper error handling
        const paymentAttempt = {
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            status: Order.PAYMENT_STATUS.CREATED,
            createdAt: new Date(),
            razorpayExpiresAt: expiresAt
        };

        // ✅ FIXED: Use atomic update to avoid parallel save issues
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId },
            {
                $push: {
                    'payment.attempts': paymentAttempt
                },
                $inc: {
                    'payment.totalAttempts': 1
                },
                $set: {
                    'payment.currentPaymentAttempt': paymentAttempt
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedOrder) {
            throw new ErrorHandler('Failed to update order with payment attempt', 500);
        }

        // Get the newly created attempt's _id
        const currentAttempt = updatedOrder.payment.attempts[updatedOrder.payment.attempts.length - 1];

        res.status(200).json({
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: order._id,
                attemptId: currentAttempt._id.toString()
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

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new ErrorHandler('Missing payment verification data', 400));
        }

        // Find order
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return next(new ErrorHandler('Order not found', 404));
        }

        // ✅ Check if already paid before any processing
        if (order.isPaid) {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified',
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    alreadyVerified: true
                }
            });
        }

        // Use _id to find attempt
        const attempt = order.payment.attempts.id(attemptId);
        if (!attempt) {
            return next(new ErrorHandler('Payment attempt not found', 404));
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            // Mark as attempted (not failed) to allow retry
            await order.updatePaymentAttempt(attemptId, {
                status: Order.PAYMENT_STATUS.ATTEMPTED,
                errorReason: 'Signature verification failed',
                signatureVerified: false
            });

            return next(new ErrorHandler('Payment verification failed. Please try again.', 400));
        }

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        // Verify amount matches order snapshot
        if (Math.round(order.pricing.total * 100) !== payment.amount) {
            await order.updatePaymentAttempt(attemptId, {
                status: Order.PAYMENT_STATUS.FAILED,
                errorReason: 'Amount mismatch',
                signatureVerified: false
            });

            return next(new ErrorHandler('Payment amount mismatch detected', 400));
        }

        if (payment.status !== 'captured') {
            await order.updatePaymentAttempt(attemptId, {
                status: Order.PAYMENT_STATUS.FAILED,
                errorReason: `Payment not captured: ${payment.status}`,
                signatureVerified: false
            });

            return next(new ErrorHandler('Payment not completed successfully', 400));
        }

        // ✅ Check again if order is already paid (race condition protection)
        if (order.isPaid) {
            return res.status(200).json({
                success: true,
                message: 'Payment already processed',
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    alreadyProcessed: true
                }
            });
        }

        // ✅ FIXED: Use plain object instead of Map
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
            notes: payment.notes,
            fee: payment.fee,
            tax: payment.tax,
            created_at: payment.created_at
        };

        // Update payment attempt as successful
        await order.updatePaymentAttempt(attemptId, {
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: Order.PAYMENT_STATUS.CAPTURED,
            gatewayPaymentMethod: payment.method,
            signatureVerified: true,
            capturedAt: new Date(),
            gatewayResponse: gatewayResponse // ✅ Plain object
        });

        // Stock reservation with concurrency protection
        await reserveStockForOrder(order);

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentId: razorpay_payment_id,
                amount: order.pricing.total
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);

        if (error.error?.description) {
            return next(new ErrorHandler(`Payment verification error: ${error.error.description}`, 400));
        }

        next(new ErrorHandler('Payment verification failed', 500));
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