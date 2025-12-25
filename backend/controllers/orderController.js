const Order = require('../models/orderModel');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const { uploadInvoice } = require('../config/multer');
const ErrorHandler = require('../utils/errorHandler');
const mongoose = require('mongoose');
const InvoiceGenerator = require('../utils/invoiceGenerator');
const fs = require('fs').promises;
const path = require('path');
const Product = require('../models/productModel');
// ==================== USER ORDER ROUTES ====================

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
        query.status = status;
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-payment.attempts.gatewayResponse'); // Exclude large fields

    const total = await Order.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }
    });
});


// @desc    Cancel an order
// @route   PUT /api/orders/:orderId/cancel
// @access  Private
const cancelOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;

    const order = await Order.findOne({
        _id: orderId,
        user: userId
    });

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    if (!order.canBeCancelled) {
        return next(new ErrorHandler('Order cannot be cancelled', 400));
    }

    order.status = Order.ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();

    await order.addTimelineEvent('order_cancelled', 'Order was cancelled by user', {
        reason,
        cancelledBy: userId
    });

    await order.save();

    res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order }
    });
});

// @desc    Get order by order number (public)
// @route   GET /api/orders/track/:orderNumber
// @access  Public
const trackOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
        .select('orderNumber status shippingMethod shippingEvents estimatedDelivery createdAt items')
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name images');

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    res.status(200).json({
        success: true,
        data: { order }
    });
});

// ==================== ADMIN ORDER ROUTES ====================

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = catchAsyncErrors(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        startDate,
        endDate,
        search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query['payment.status'] = paymentStatus;

    // Date range filter
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by order number or customer email
    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'shippingAddress.email': { $regex: search, $options: 'i' } }
        ];
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'firstName lastName email phone')
        .select('-payment.attempts.gatewayResponse');

    const total = await Order.countDocuments(query);

    // Get summary stats
    const stats = await Order.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$pricing.total' },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: '$pricing.total' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            stats: stats[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }
        }
    });
});

// @desc    Get order details (Admin)
// @route   GET /api/admin/orders/:orderId
// @access  Private/Admin
// controllers/orderController.js - Fixed version
// @desc    Get order details for admin
// @route   GET /api/admin/orders/:orderId
// @access  Private/Admin
const getAdminOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId)
            .populate('user', 'firstName lastName email phone')
            .populate('adminNotes.addedBy', 'firstName lastName email'); // ✅ Keep this

        if (!order) {
            return next(new ErrorHandler('Order not found', 404));
        }

        res.status(200).json({
            success: true,
            data: { order }
        });
    } catch (error) {
        console.error('Error fetching admin order details:', error);
        next(new ErrorHandler('Failed to fetch order details', 500));
    }
});


// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:orderId/status
// @access  Private/Admin
const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const { status, trackingNumber, carrier, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    const previousStatus = order.status;

    // Update shipping info if provided
    if (trackingNumber) {
        order.shippingMethod.trackingNumber = trackingNumber;
    }
    if (carrier) {
        order.shippingMethod.carrier = carrier;
    }

    // Update status
    order.status = status;

    // Add shipping event if status is shipped
    if (status === Order.ORDER_STATUS.SHIPPED && trackingNumber) {
        order.shippingEvents.push({
            event: 'shipped',
            description: 'Order has been shipped',
            location: 'Distribution Center',
            metadata: { trackingNumber, carrier }
        });
    }

    // Add admin note if provided
    if (notes) {
        order.adminNotes.push({
            note: notes,
            addedBy: req.user._id
        });
    }

    await order.addTimelineEvent('status_updated', `Order status updated to ${status}`, {
        previousStatus,
        newStatus: status,
        trackingNumber,
        carrier,
        updatedBy: req.user._id
    });

    await order.save();

    // ✅ ADD ORDER SHIPPED N8N TRIGGER HERE
    if (status === Order.ORDER_STATUS.SHIPPED) {
        try {
            // 1. POPULATE USER (for name and email)
            const populatedOrder = await Order.findById(orderId)
                .populate('user', 'firstName lastName email');

            const N8NService = require('../services/n8nService');
            const user = populatedOrder?.user || {};

            // 2. EXTRACT SHIPPING ADDRESS (contains phone!)
            const shippingAddress = order.shippingAddress || {};
            const customerPhone = shippingAddress.phone ||
                shippingAddress.mobile ||
                user.phone ||
                user.mobile ||
                '';

            // 4. SEND N8N TRIGGER WITH COMPLETE DATA
            await N8NService.run("orderShipped", {
                event: "orderShipped",
                orderId: order._id.toString(),
                customerName: shippingAddress.firstName && shippingAddress.lastName
                    ? `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim()
                    : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer',
                customerEmail: shippingAddress.email || user.email || '',
                customerPhone: customerPhone,
                orderNumber: order.orderNumber,
                trackingNumber: order.shippingMethod?.trackingNumber || '',
                carrier: order.shippingMethod?.carrier || 'Standard Shipping',
                shippingDate: new Date().toISOString(),
                estimatedDelivery: order.estimatedDelivery ||
                    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity
                })),
                shippingAddress: {
                    street: shippingAddress.addressLine1 || '',
                    city: shippingAddress.city || '',
                    state: shippingAddress.state || '',
                    postalCode: shippingAddress.pincode || shippingAddress.postalCode || '',
                    country: shippingAddress.country || 'India'
                },
                orderDate: order.createdAt.toISOString(),
                trackingUrl: order.shippingMethod?.trackingUrl ||
                    `https://track.${(order.shippingMethod?.carrier || 'standard').toLowerCase().replace(/\s+/g, '')}.com/${order.shippingMethod?.trackingNumber}`
            });
        } catch (n8nError) {
            console.error('❌ N8N trigger failed (non-critical):', n8nError.message);
        }
    }
    res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: { order }
    });
});

// @desc    Add admin note to order
// @route   POST /api/admin/orders/:orderId/notes
// @access  Private/Admin
const addAdminNote = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const { note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    // Add the note
    order.adminNotes.push({
        note,
        addedBy: req.user._id,
        createdAt: new Date()
    });

    await order.addTimelineEvent('admin_note_added', 'Admin note added to order', {
        note,
        addedBy: req.user._id
    });

    await order.save();

    // ✅ FIXED: Populate the addedBy field before sending response
    await order.populate('adminNotes.addedBy', 'firstName lastName email');

    res.status(200).json({
        success: true,
        message: 'Note added successfully',
        data: {
            note: order.adminNotes[order.adminNotes.length - 1]
        }
    });
});

// @desc    Get order analytics (Admin)
// @route   GET /api/admin/orders/analytics
// @access  Private/Admin
const getOrderAnalytics = catchAsyncErrors(async (req, res, next) => {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Basic analytics
    const analytics = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                'payment.status': 'captured'
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$pricing.total' },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: '$pricing.total' },
                successfulOrders: {
                    $sum: { $cond: [{ $eq: ['$payment.status', 'captured'] }, 1, 0] }
                }
            }
        }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Revenue by day (last 7 days)
    const revenueByDay = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 7))
                },
                'payment.status': 'captured'
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                revenue: { $sum: '$pricing.total' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            summary: analytics[0] || {
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                successfulOrders: 0
            },
            ordersByStatus,
            revenueByDay
        }
    });
});

// @desc    Get enhanced order analytics (Admin)
// @route   GET /api/admin/orders/analytics/enhanced
// @access  Private/Admin
const getEnhancedOrderAnalytics = catchAsyncErrors(async (req, res, next) => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's revenue and orders
    const todayAnalytics = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfToday },
                'payment.status': 'captured'
            }
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: '$pricing.total' },
                orders: { $sum: 1 }
            }
        }
    ]);

    // Monthly revenue and orders
    const monthlyAnalytics = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfMonth },
                'payment.status': 'captured'
            }
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: '$pricing.total' },
                orders: { $sum: 1 }
            }
        }
    ]);

    // Orders by status (all time for main stats)
    const ordersByStatus = await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Convert ordersByStatus to object for easy access
    const statusCounts = {};
    ordersByStatus.forEach(status => {
        statusCounts[status._id] = status.count;
    });
    const avgOrderValue = await Order.aggregate([
        {
            $match: {
                'payment.status': 'captured'
            }
        },
        {
            $group: {
                _id: null,
                averageOrderValue: { $avg: '$pricing.total' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            todayRevenue: todayAnalytics[0]?.revenue || 0,
            todayOrders: todayAnalytics[0]?.orders || 0,
            monthlyRevenue: monthlyAnalytics[0]?.revenue || 0,
            monthlyOrders: monthlyAnalytics[0]?.orders || 0,
            totalOrders: await Order.countDocuments(),
            pendingOrders: statusCounts['pending'] || 0,
            deliveredOrders: statusCounts['delivered'] || 0,
            cancelledOrders: statusCounts['cancelled'] || 0,
            processingOrders: statusCounts['processing'] || 0,
            shippedOrders: statusCounts['shipped'] || 0
        }
    });
});

// @desc    Export orders (Admin)
// @route   GET /api/admin/orders/export
// @access  Private/Admin
const exportOrders = catchAsyncErrors(async (req, res, next) => {
    const { startDate, endDate, format = 'json' } = req.query;

    const query = {};
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate('user', 'firstName lastName email')
        .select('orderNumber createdAt pricing.total status payment.status shippingAddress');

    if (format === 'csv') {
        // Simple CSV export
        const csvData = orders.map(order => ({
            'Order Number': order.orderNumber,
            'Date': order.createdAt.toISOString().split('T')[0],
            'Customer': `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            'Email': order.shippingAddress.email,
            'Amount': order.pricing.total,
            'Status': order.status,
            'Payment Status': order.payment.status,
            'City': order.shippingAddress.city,
            'State': order.shippingAddress.state
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');

        // Simple CSV string (you might want to use a CSV library for production)
        let csv = 'Order Number,Date,Customer,Email,Amount,Status,Payment Status,City,State\n';
        csvData.forEach(row => {
            csv += `"${row['Order Number']}","${row['Date']}","${row['Customer']}","${row['Email']}",${row['Amount']},"${row['Status']}","${row['Payment Status']}","${row['City']}","${row['State']}"\n`;
        });

        return res.send(csv);
    }

    // Default JSON export
    res.status(200).json({
        success: true,
        data: { orders },
        meta: {
            exportedAt: new Date(),
            total: orders.length,
            format
        }
    });
});

// Add this function near your other order fetching functions

const getOrderByNumber = catchAsyncErrors(async (req, res, next) => {
    // 1. Get the order number from the URL parameter
    const orderNumber = req.params.orderNumber;

    // 2. Find the order in the database using the orderNumber field
    const order = await Order.findOne({ orderNumber });

    if (!order) {
        // If the order is not found, return a 404 error
        return next(new ErrorHandler('Order not found with that number', 404));
    }

    // 3. Return the order details
    res.status(200).json({
        success: true,
        order
    });
});


// controllers/orderController.js


const handlePaymentSuccess = catchAsyncErrors(async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
        // 1. Find the order with necessary population for invoice generation
        const order = await Order.findById(orderId)
            .populate('user', 'firstName lastName email phone')
            .populate('items.productId', 'name sku brand category specifications images')
            .populate('items.variantId', 'ram storage color price stock specifications');

        if (!order) {
            return next(new ErrorHandler('Order not found', 404));
        }
        try {
            // Ensure reduceStockForOrder is defined in your file or imported
            await reduceStockForOrder(order);
        } catch (stockError) {
            console.error('❌ Stock reduction failed:', stockError);
            // Add failure note but continue with payment recording
            order.adminNotes.push({
                note: `Stock reduction failed: ${stockError.message}`,
                addedBy: req.user._id,
                addedAt: new Date()
            });
        }

        // 3. Update Payment Details
        order.payment.status = 'captured';
        order.payment.razorpayPaymentId = razorpayPaymentId;
        order.payment.razorpayOrderId = razorpayOrderId;
        order.payment.razorpaySignature = razorpaySignature;
        order.payment.paidAt = new Date();

        order.payment.attempts.push({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            amount: order.pricing.total,
            currency: 'INR',
            status: 'captured',
            signatureVerified: true,
            capturedAt: new Date()
        });

        order.status = 'confirmed';

        // Add Timeline Events
        order.orderTimeline.push({
            event: 'payment_captured',
            message: 'Payment successfully captured',
            metadata: {
                razorpayPaymentId,
                razorpayOrderId,
                amount: order.pricing.total
            },
            changedBy: req.user._id,
            changedAt: new Date()
        });

        order.orderTimeline.push({
            event: 'stock_reduced',
            message: 'Product stock reduced after payment',
            changedBy: req.user._id,
            changedAt: new Date()
        });


        // Make sure to save the order after adding invoice data
        await order.save();

        // 6. Clear User Cart
        let cartCleared = false;
        try {
            // Ensure strict path is used or imported correctly
            const Cart = require('../models/Cart'); // OR ../models/cartModel based on your structure
            await Cart.findOneAndUpdate(
                { user: req.user._id },
                {
                    items: [],
                    totalPrice: 0,
                    totalItems: 0,
                    couponApplied: null
                }
            );
            cartCleared = true;
        } catch (cartError) {
            console.error('❌ Cart clearance failed:', cartError);
        }

        // 7. Send Response
        res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                order: {
                    _id: savedOrder._id,
                    orderNumber: savedOrder.orderNumber,
                    status: savedOrder.status,
                    pricing: savedOrder.pricing,
                    invoice: savedOrder.invoices?.autoGenerated || null
                },
                cartCleared: cartCleared,
                invoiceGenerated: invoiceGenerated,
                invoiceUrl: invoiceData?.pdfUrl || null,
                invoiceNumber: invoiceData?.invoiceNumber || null
            }
        });

    } catch (error) {
        console.error('❌ PAYMENT SUCCESS ERROR:', error);
        console.error('❌ Error stack:', error.stack);
        next(new ErrorHandler('Failed to process payment success', 500));
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
    await product.save();
};

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


// @desc    Upload admin invoice for order
// @route   POST /api/admin/orders/:orderId/invoice/upload
// @access  Private/Admin
const uploadAdminInvoice = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const { invoiceNumber, notes } = req.body;

    if (!req.file) {
        return next(new ErrorHandler('Please upload a PDF file', 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    try {
        // Process the uploaded invoice
        const invoiceData = await InvoiceGenerator.processAdminUploadedInvoice(
            req.file,
            order,
            req.user,
            invoiceNumber,
            notes
        );

        // Update order with admin uploaded invoice
        order.invoices.adminUploaded = {
            invoiceNumber: invoiceData.invoiceNumber,
            originalFileName: invoiceData.fileName,
            pdfPath: invoiceData.filePath,
            pdfUrl: invoiceData.pdfUrl,
            uploadedAt: new Date(),
            uploadedBy: req.user._id,
            notes: notes,
            fileSize: invoiceData.fileSize,
            mimeType: invoiceData.mimeType
        };

        // Add timeline event
        await order.addTimelineEvent('admin_invoice_uploaded', 'Admin uploaded custom invoice', {
            invoiceNumber: invoiceData.invoiceNumber,
            fileName: invoiceData.fileName,
            uploadedBy: req.user._id
        });

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Invoice uploaded successfully',
            data: {
                invoice: {
                    type: 'admin_uploaded',
                    invoiceNumber: order.invoices.adminUploaded.invoiceNumber,
                    pdfUrl: order.invoices.adminUploaded.pdfUrl,
                    uploadedAt: order.invoices.adminUploaded.uploadedAt,
                    uploadedBy: order.invoices.adminUploaded.uploadedBy,
                    notes: order.invoices.adminUploaded.notes,
                    fileSize: order.invoices.adminUploaded.fileSize
                }
            }
        });

    } catch (error) {
        console.error('Admin invoice upload error:', error);
        return next(new ErrorHandler('Failed to upload invoice', 500));
    }
});

// @desc    Auto-generate invoice for order (trigger manually if needed)
// @route   POST /api/admin/orders/:orderId/invoice/generate
// @access  Private/Admin

const generateAutoInvoiceAdmin = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone');

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }
    try {
        const invoiceData = await InvoiceGenerator.generateAutoInvoice(order, order.user);
        order.invoices = order.invoices || {};
        order.invoices.autoGenerated = {
            invoiceNumber: invoiceData.invoiceNumber,
            pdfPath: invoiceData.filePath,
            pdfUrl: invoiceData.pdfUrl,
            generatedAt: new Date(),
            version: 1,
            status: 'generated'
        };

        await order.addTimelineEvent('auto_invoice_generated', 'Admin manually generated invoice', {
            invoiceNumber: invoiceData.invoiceNumber,
            generatedAt: new Date()
        });

        await order.save();
        res.status(200).json({
            success: true,
            message: 'Invoice generated successfully',
            data: {
                invoice: {
                    type: 'auto_generated',
                    invoiceNumber: order.invoices.autoGenerated.invoiceNumber,
                    pdfUrl: order.invoices.autoGenerated.pdfUrl,
                    generatedAt: order.invoices.autoGenerated.generatedAt
                }
            }
        });

    } catch (error) {
        console.error('❌ Admin invoice generation error:', error);

        if (order.invoices && order.invoices.autoGenerated) {
            order.invoices.autoGenerated.status = 'failed';
            await order.save();
        }

        return next(new ErrorHandler('Failed to generate invoice: ' + error.message, 500));
    }
});


// controllers/orderController.js - Fix getUserOrderDetails

// @desc    Get single order details (User)
// @route   GET /api/orders/:orderId
// @access  Private
const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    // FIXED: Remove problematic population that causes schema errors
    const order = await Order.findOne({
        _id: orderId,
        user: userId
    })
        .populate('user', 'firstName lastName email phone') // Only populate user
        .populate('coupon.couponId', 'name discountType discountAmount'); // Only safe populations

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    res.status(200).json({
        success: true,
        data: { order }
    });
});

// Also fix getOrderInvoices to avoid population issues
const getOrderInvoices = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user: userId })
        .select('orderNumber invoices status payment.status');

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    const invoices = [];

    // Auto-generated invoice
    if (order.invoices?.autoGenerated && order.invoices.autoGenerated.pdfPath) {
        invoices.push({
            id: 'auto_generated',
            type: 'auto_generated',
            title: 'System Generated Invoice',
            invoiceNumber: order.invoices.autoGenerated.invoiceNumber,
            pdfUrl: order.invoices.autoGenerated.pdfUrl,
            generatedAt: order.invoices.autoGenerated.generatedAt,
            version: order.invoices.autoGenerated.version,
            source: 'system',
            canDownload: true,
            canDelete: false
        });
    }

    // Admin-uploaded invoice
    if (order.invoices?.adminUploaded && order.invoices.adminUploaded.pdfPath) {
        invoices.push({
            id: 'admin_uploaded',
            type: 'admin_uploaded',
            title: 'Admin Uploaded Invoice',
            invoiceNumber: order.invoices.adminUploaded.invoiceNumber,
            originalFileName: order.invoices.adminUploaded.originalFileName,
            pdfUrl: order.invoices.adminUploaded.pdfUrl,
            uploadedAt: order.invoices.adminUploaded.uploadedAt,
            uploadedBy: order.invoices.adminUploaded.uploadedBy,
            notes: order.invoices.adminUploaded.notes,
            fileSize: order.invoices.adminUploaded.fileSize,
            source: 'admin',
            canDownload: true,
            canDelete: false
        });
    }

    res.status(200).json({
        success: true,
        data: {
            orderNumber: order.orderNumber,
            invoices,
            totalInvoices: invoices.length
        }
    });
});

// @desc    Delete admin-uploaded invoice
// @route   DELETE /api/admin/orders/:orderId/invoice/admin
// @access  Private/Admin
const deleteAdminInvoice = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    if (!order.invoices.adminUploaded || !order.invoices.adminUploaded.pdfPath) {
        return next(new ErrorHandler('No admin uploaded invoice found', 404));
    }

    try {
        // Delete the physical file
        await fs.unlink(order.invoices.adminUploaded.pdfPath);

        // Clear admin uploaded invoice data
        order.invoices.adminUploaded = undefined;
        await order.save();

        await order.addTimelineEvent('admin_invoice_deleted', 'Admin uploaded invoice was deleted', {
            deletedBy: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Admin invoice deleted successfully'
        });

    } catch (error) {
        console.error('Admin invoice deletion error:', error);
        // Even if file deletion fails, clear the database record
        order.invoices.adminUploaded = undefined;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Admin invoice reference removed successfully'
        });
    }
});

const downloadInvoice = catchAsyncErrors(async (req, res, next) => {
    const { orderId, invoiceType } = req.params; // auto or admin
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin ? { _id: orderId } : { _id: orderId, user: userId };

    const order = await Order.findOne(query);

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    let invoicePath, invoiceFileName;

    // Check for admin uploaded invoice
    if (invoiceType === 'admin' && order.invoices?.adminUploaded?.pdfPath) {
        invoicePath = order.invoices.adminUploaded.pdfPath;
        invoiceFileName = `admin-invoice-${order.orderNumber}.pdf`;
    }
    // Check for auto generated invoice
    else if (invoiceType === 'auto' && order.invoices?.autoGenerated?.pdfPath) {
        invoicePath = order.invoices.autoGenerated.pdfPath;
        invoiceFileName = `invoice-${order.orderNumber}.pdf`;
    }
    // Fallback to old single invoice if exists
    else if (order.invoiceUrl && invoiceType === 'auto') {
        // Handle legacy invoice format
        invoicePath = path.join(process.cwd(), 'public', order.invoiceUrl);
        invoiceFileName = `invoice-${order.orderNumber}.pdf`;
    }
    else {
        return next(new ErrorHandler('Invoice not found', 404));
    }

    try {
        // Check if file exists
        await fs.access(invoicePath);
        const pdfBuffer = await fs.readFile(invoicePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${invoiceFileName}`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ Invoice file access error:', error);
        return next(new ErrorHandler('Invoice file not found on server', 404));
    }
});

// Add to orderController.js
const getSalesChartData = catchAsyncErrors(async (req, res, next) => {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Daily revenue for the period
    const dailyRevenue = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                'payment.status': 'captured'
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                revenue: { $sum: '$pricing.total' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: sixMonthsAgo },
                'payment.status': 'captured'
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m', date: '$createdAt' }
                },
                revenue: { $sum: '$pricing.total' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Payment methods distribution
    const paymentMethods = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$payment.method',
                count: { $sum: 1 },
                amount: { $sum: '$pricing.total' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            dailyRevenue: dailyRevenue.map(item => ({
                date: item._id,
                revenue: item.revenue,
                orders: item.orders
            })),
            monthlyRevenue: monthlyRevenue.map(item => ({
                month: item._id,
                revenue: item.revenue,
                orders: item.orders
            })),
            paymentMethods: paymentMethods.map(item => ({
                method: item._id || 'unknown',
                count: item.count,
                amount: item.amount
            }))
        }
    });
});

// Add to orderController.js or create analyticsController.js
const getQuickStats = catchAsyncErrors(async (req, res, next) => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
        todayRevenue,
        monthlyRevenue,
        totalOrders,
        ordersByStatus,
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        totalProducts,
        lowStockItems,
        pcQuotesPending,
        prebuiltPCsPublished,
        couponsActive
    ] = await Promise.all([
        // Today's revenue
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfToday },
                    'payment.status': 'captured'
                }
            },
            { $group: { _id: null, revenue: { $sum: '$pricing.total' } } }
        ]),
        // Monthly revenue
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth },
                    'payment.status': 'captured'
                }
            },
            { $group: { _id: null, revenue: { $sum: '$pricing.total' } } }
        ]),
        // Total orders
        Order.countDocuments(),
        // Orders by status
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        // Total users
        User.countDocuments(),
        // Active users
        User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
        // New users this month
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        // Total products
        Product.countDocuments(),
        // Low stock items
        Product.countDocuments({
            $or: [
                { stockQuantity: { $lt: 10, $gt: 0 } },
                { 'variants.stockQuantity': { $lt: 10, $gt: 0 } }
            ]
        }),
        // PC quotes pending
        PCQuote.countDocuments({ status: 'pending' }),
        // Pre-built PCs published
        PreBuiltPC.countDocuments({ isActive: true }),
        // Active coupons
        Coupon.countDocuments({
            status: 'active',
            $and: [
                { startDate: { $lte: today } },
                { $or: [{ endDate: { $gte: today } }, { endDate: null }] }
            ]
        })
    ]);

    // Convert orders by status to object
    const statusCounts = {};
    ordersByStatus.forEach(status => {
        statusCounts[status._id] = status.count;
    });

    res.status(200).json({
        success: true,
        data: {
            todayRevenue: todayRevenue[0]?.revenue || 0,
            monthlyRevenue: monthlyRevenue[0]?.revenue || 0,
            totalOrders,
            pendingOrders: statusCounts['pending'] || 0,
            deliveredOrders: statusCounts['delivered'] || 0,
            cancelledOrders: statusCounts['cancelled'] || 0,
            totalUsers,
            activeUsers,
            newUsers: newUsersThisMonth,
            totalProducts,
            lowStockItems,
            pcQuotesPending,
            prebuiltPCsPublished,
            couponsActive
        }
    });
});


module.exports = {
    // User routes
    getUserOrders,
    getOrderDetails,
    cancelOrder,
    trackOrder,
    getOrderByNumber,
    handlePaymentSuccess,

    // Admin routes
    getAllOrders,
    getAdminOrderDetails,
    updateOrderStatus,
    addAdminNote,
    getOrderAnalytics,
    getEnhancedOrderAnalytics,
    exportOrders,
    uploadAdminInvoice,
    generateAutoInvoiceAdmin,
    getOrderInvoices,
    deleteAdminInvoice,
    downloadInvoice,
    getSalesChartData,
    getQuickStats,
};