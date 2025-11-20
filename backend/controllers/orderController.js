const Order = require('../models/orderModel');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

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

// @desc    Get single order details
// @route   GET /api/orders/:orderId
// @access  Private
const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
        _id: orderId,
        user: userId
    }).populate('items.product', 'name images slug');

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    res.status(200).json({
        success: true,
        data: { order }
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
const getAdminOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone addresses')
        .populate('items.product', 'name images slug category')
        .populate('coupon.couponId', 'name discountType discountAmount');

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    res.status(200).json({
        success: true,
        data: { order }
    });
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

    order.adminNotes.push({
        note,
        addedBy: req.user._id
    });

    await order.addTimelineEvent('admin_note_added', 'Admin note added to order', {
        note,
        addedBy: req.user._id
    });

    await order.save();

    res.status(200).json({
        success: true,
        message: 'Note added successfully',
        data: { note: order.adminNotes[order.adminNotes.length - 1] }
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

module.exports = {
    // User routes
    getUserOrders,
    getOrderDetails,
    cancelOrder,
    trackOrder,

    // Admin routes
    getAllOrders,
    getAdminOrderDetails,
    updateOrderStatus,
    addAdminNote,
    getOrderAnalytics,
    exportOrders
};