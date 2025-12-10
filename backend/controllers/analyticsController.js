const catchAsyncErrors = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const PCQuote = require('../models/customPCQuote');
const PreBuiltPC = require('../models/preBuiltPCModel');

// Helper function to get date range
const getDateRange = (period) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        case 'lifetime':
            startDate.setFullYear(2020); // Your start year
            break;
        default:
            startDate.setDate(now.getDate() - 30); // Default to 30d
    }

    return { startDate, endDate: now };
};

// @desc    Get enhanced quick stats with time period
// @route   GET /api/admin/analytics/quick-stats
// @access  Private/Admin
exports.getQuickStats = catchAsyncErrors(async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        const [
            revenueStats,
            orderStats,
            userStats,
            productStats,
            pcStats,
            couponStats
        ] = await Promise.all([
            // Revenue and orders
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        'payment.status': 'captured'
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$pricing.total' },
                        orders: { $sum: 1 },
                        averageOrderValue: { $avg: '$pricing.total' }
                    }
                }
            ]),
            // Orders by status
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // User stats
            Promise.all([
                User.countDocuments({ createdAt: { $lte: endDate } }),
                User.countDocuments({
                    lastLogin: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        $lte: endDate
                    }
                }),
                User.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate }
                }),
                User.countDocuments({ isEmailVerified: true })
            ]),
            // Product stats
            Promise.all([
                Product.countDocuments(),
                Product.countDocuments({
                    $or: [
                        { stockQuantity: { $lt: 10, $gt: 0 } },
                        { 'variants.stockQuantity': { $lt: 10, $gt: 0 } }
                    ]
                })
            ]),
            // PC Builder stats
            Promise.all([
                PCQuote.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate }
                }),
                PCQuote.countDocuments({
                    status: 'pending',
                    createdAt: { $lte: endDate }
                }),
                PreBuiltPC.countDocuments({ isActive: true })
            ]),
            // Coupon stats
            Promise.all([
                Coupon.countDocuments(),
                Coupon.countDocuments({
                    status: 'active',
                    $and: [
                        { startDate: { $lte: endDate } },
                        { $or: [{ endDate: { $gte: new Date() } }, { endDate: null }] }
                    ]
                })
            ])
        ]);

        const statusCounts = {};
        orderStats.forEach(status => {
            statusCounts[status._id] = status.count;
        });

        const revenueData = revenueStats[0] || { revenue: 0, orders: 0, averageOrderValue: 0 };

        res.status(200).json({
            success: true,
            data: {
                period,
                revenue: revenueData.revenue,
                orders: revenueData.orders,
                averageOrderValue: revenueData.averageOrderValue,
                pendingOrders: statusCounts['pending'] || 0,
                deliveredOrders: statusCounts['delivered'] || 0,
                cancelledOrders: statusCounts['cancelled'] || 0,
                totalUsers: userStats[0],
                activeUsers: userStats[1],
                newUsers: userStats[2],
                verifiedUsers: userStats[3],
                totalProducts: productStats[0],
                lowStockItems: productStats[1],
                totalQuotes: pcStats[0],
                pendingQuotes: pcStats[1],
                prebuiltPCsPublished: pcStats[2],
                totalCoupons: couponStats[0],
                activeCoupons: couponStats[1]
            }
        });
    } catch (error) {
        console.error('Quick stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quick stats'
        });
    }
});

// @desc    Get sales chart data with time period
// @route   GET /api/admin/analytics/sales-chart
// @access  Private/Admin
exports.getSalesChartData = catchAsyncErrors(async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        const [dailyRevenue, paymentMethods, ordersTrend] = await Promise.all([
            // Daily revenue
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
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
            ]),
            // Payment methods
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        'payment.status': 'captured'
                    }
                },
                {
                    $group: {
                        _id: '$payment.method',
                        count: { $sum: 1 },
                        amount: { $sum: '$pricing.total' }
                    }
                }
            ]),
            // Orders trend
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                period,
                dailyRevenue: dailyRevenue.map(item => ({
                    date: item._id,
                    revenue: item.revenue,
                    orders: item.orders
                })),
                paymentMethods: paymentMethods.map(item => ({
                    method: item._id || 'unknown',
                    count: item.count,
                    amount: item.amount
                })),
                ordersTrend: ordersTrend.map(item => ({
                    date: item._id,
                    total: item.total,
                    completed: item.completed
                }))
            }
        });
    } catch (error) {
        console.error('Sales chart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales chart data'
        });
    }
});

// @desc    Get user analytics with time period
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
exports.getUserAnalytics = catchAsyncErrors(async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        const [
            totalUsers,
            activeUsers,
            newUsers,
            verifiedUsers,
            usersWithOrders,
            topCustomers
        ] = await Promise.all([
            // Total users (all time)
            User.countDocuments(),
            // Active users (last 30 days)
            User.countDocuments({
                lastLogin: {
                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }),
            // New users in period
            User.countDocuments({
                createdAt: { $gte: startDate, $lte: endDate }
            }),
            // Verified users
            User.countDocuments({ isEmailVerified: true }),
            // Users with orders in period
            Order.distinct('user', {
                createdAt: { $gte: startDate, $lte: endDate },
                'payment.status': 'captured'
            }),
            // Top customers by spending in period
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        'payment.status': 'captured'
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: '$pricing.total' }
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                },
                { $unwind: '$userInfo' },
                {
                    $project: {
                        id: '$_id',
                        name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
                        email: '$userInfo.email',
                        totalOrders: 1,
                        totalSpent: 1
                    }
                }
            ])
        ]);

        // Calculate returning customer rate
        const totalCustomersWithOrders = await Order.distinct('user', {
            'payment.status': 'captured'
        });
        const returningRate = totalCustomersWithOrders.length > 0
            ? (usersWithOrders.length / totalCustomersWithOrders.length) * 100
            : 0;

        res.status(200).json({
            success: true,
            data: {
                period,
                totalUsers,
                activeUsers,
                newUsers,
                verifiedUsers,
                unverifiedUsers: totalUsers - verifiedUsers,
                usersWithOrders: usersWithOrders.length,
                returningRate: Math.round(returningRate * 100) / 100,
                topCustomers: topCustomers.map(customer => ({
                    id: customer.id,
                    name: customer.name || 'Unknown User',
                    email: customer.email,
                    totalOrders: customer.totalOrders,
                    totalSpent: customer.totalSpent
                }))
            }
        });
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user analytics'
        });
    }
});

exports.getProductAnalytics = catchAsyncErrors(async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        const [
            totalProducts,
            lowStockItems,
            activeProducts,
            topSellingProducts,
            categoryPerformance
        ] = await Promise.all([
            // Total products
            Product.countDocuments(),
            // Low stock items
            Product.countDocuments({
                $or: [
                    { stockQuantity: { $lt: 10, $gt: 0 } },
                    { 'variants.stockQuantity': { $lt: 10, $gt: 0 } }
                ]
            }),
            // Active products
            Product.countDocuments({ status: 'active', isActive: true }),
            // Top selling products in period - FIXED: Use discountedPrice
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        'payment.status': 'captured'
                    }
                },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product',
                        sales: { $sum: '$items.quantity' },
                        // FIX: Use discountedPrice (actual selling price)
                        revenue: {
                            $sum: {
                                $multiply: ['$items.quantity', '$items.discountedPrice']
                            }
                        }
                    }
                },
                { $sort: { sales: -1 } },
                { $limit: 8 },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'productInfo'
                    }
                },
                { $unwind: '$productInfo' },
                {
                    $project: {
                        id: '$_id',
                        name: '$productInfo.name',
                        image: {
                            $cond: {
                                if: {
                                    $and: [
                                        '$productInfo.images',
                                        '$productInfo.images.thumbnail',
                                        '$productInfo.images.thumbnail.url'
                                    ]
                                },
                                then: '$productInfo.images.thumbnail.url',
                                else: {
                                    $cond: {
                                        if: {
                                            $and: [
                                                '$productInfo.images',
                                                '$productInfo.images.gallery',
                                                { $gt: [{ $size: '$productInfo.images.gallery' }, 0] }
                                            ]
                                        },
                                        then: { $arrayElemAt: ['$productInfo.images.gallery.url', 0] },
                                        else: null
                                    }
                                }
                            }
                        },
                        sales: 1,
                        revenue: 1,
                        stock: '$productInfo.stockQuantity',
                        category: { $arrayElemAt: ['$productInfo.categories', 0] },
                        brand: '$productInfo.brand'
                    }
                }
            ]),
            // Category performance - FIXED: Use discountedPrice
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        'payment.status': 'captured'
                    }
                },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'productInfo'
                    }
                },
                { $unwind: '$productInfo' },
                { $unwind: '$productInfo.categories' },
                {
                    $group: {
                        _id: '$productInfo.categories',
                        sales: { $sum: '$items.quantity' },
                        // FIX: Use discountedPrice
                        revenue: {
                            $sum: {
                                $multiply: ['$items.quantity', '$items.discountedPrice']
                            }
                        }
                    }
                },
                { $sort: { revenue: -1 } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'categoryInfo'
                    }
                },
                { $unwind: '$categoryInfo' },
                {
                    $project: {
                        _id: 0,
                        category: '$categoryInfo.name',
                        sales: 1,
                        revenue: 1,
                        growth: { $literal: 0 }
                    }
                }
            ])
        ]);

        // Get low stock products details
        const lowStockProducts = await Product.find({
            $or: [
                { stockQuantity: { $lt: 10, $gt: 0 } },
                { 'variants.stockQuantity': { $lt: 10, $gt: 0 } }
            ]
        })
            .select('name images stockQuantity variants categories')
            .populate('categories', 'name')
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                period,
                totalProducts,
                lowStockItems,
                activeProducts,
                topSelling: topSellingProducts,
                lowStock: lowStockProducts.map(product => ({
                    id: product._id,
                    name: product.name,
                    image: product.images?.thumbnail?.url ||
                        (product.images?.gallery?.[0]?.url || null),
                    stock: product.stockQuantity,
                    minStock: 10,
                    category: product.categories?.[0]?.name || 'Uncategorized'
                })),
                categoryPerformance
            }
        });
    } catch (error) {
        console.error('Product analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product analytics'
        });
    }
});

// @desc    Get PC builder analytics with time period
// @route   GET /api/admin/analytics/pc-builder
// @access  Private/Admin
exports.getPCAnalytics = catchAsyncErrors(async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        const [
            basicStats,
            topComponents,
            weeklyQuotes
        ] = await Promise.all([
            // Basic stats with period filter
            PCQuote.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $facet: {
                        byStatus: [
                            {
                                $group: {
                                    _id: '$status',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        total: [
                            { $count: 'count' }
                        ],
                        expired: [
                            {
                                $match: {
                                    quoteExpiry: { $lt: new Date() },
                                    status: { $in: ['pending', 'contacted', 'quoted'] }
                                }
                            },
                            { $count: 'count' }
                        ]
                    }
                }
            ]),
            // Top components in period
            PCQuote.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                { $unwind: '$components' },
                {
                    $group: {
                        _id: {
                            componentId: '$components.component',
                            category: '$components.category'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id.componentId',
                        foreignField: '_id',
                        as: 'componentInfo'
                    }
                },
                { $unwind: '$componentInfo' },
                {
                    $project: {
                        component: '$componentInfo.name',
                        category: '$_id.category',
                        count: 1
                    }
                }
            ]),
            // Weekly quotes trend
            PCQuote.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $week: '$createdAt'
                        },
                        quotes: { $sum: 1 },
                        conversions: {
                            $sum: { $cond: [{ $in: ['$status', ['approved', 'converted']] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const stats = basicStats[0];
        const total = stats?.total[0]?.count || 0;
        const expired = stats?.expired[0]?.count || 0;
        const approved = stats?.byStatus.find(s => s._id === 'approved')?.count || 0;
        const pending = stats?.byStatus.find(s => s._id === 'pending')?.count || 0;
        const conversionRate = total > 0 ? (approved / total) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                period,
                totalQuotes: total,
                approvedQuotes: approved,
                expiredQuotes: expired,
                pendingQuotes: pending,
                conversionRate: Math.round(conversionRate * 100) / 100,
                topComponents,
                weeklyQuotes: weeklyQuotes.map(week => ({
                    week: `Week ${week._id}`,
                    quotes: week.quotes,
                    conversions: week.conversions
                }))
            }
        });
    } catch (error) {
        console.error('PC analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching PC builder analytics'
        });
    }
});

// @desc    Get coupon analytics with time period
// @route   GET /api/admin/analytics/coupons
// @access  Private/Admin
exports.getCouponAnalytics = catchAsyncErrors(async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        const [
            totalCoupons,
            activeCoupons,
            couponUsage,
            mostUsedCoupon,
            couponTimeline
        ] = await Promise.all([
            // Total coupons
            Coupon.countDocuments(),
            // Active coupons
            Coupon.countDocuments({
                status: 'active',
                $and: [
                    { startDate: { $lte: endDate } },
                    { $or: [{ endDate: { $gte: new Date() } }, { endDate: null }] }
                ]
            }),
            // Coupon usage in period
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        'payment.status': 'captured',
                        'coupon.code': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$coupon.code',
                        usageCount: { $sum: 1 },
                        totalDiscount: { $sum: '$coupon.discountAmount' }
                    }
                },
                { $sort: { usageCount: -1 } }
            ]),
            // Most used coupon overall
            Coupon.findOne().sort({ usageCount: -1 }),
            // Coupon usage timeline
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        'payment.status': 'captured',
                        'coupon.code': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        usage: { $sum: 1 },
                        revenue: { $sum: '$pricing.total' }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const totalUsage = couponUsage.reduce((acc, curr) => acc + curr.usageCount, 0);
        const totalDiscount = couponUsage.reduce((acc, curr) => acc + (curr.totalDiscount || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                period,
                totalCoupons,
                activeCoupons,
                totalUsage,
                discountGiven: totalDiscount,
                mostUsed: mostUsedCoupon ? {
                    code: mostUsedCoupon.code,
                    usageCount: mostUsedCoupon.usageCount,
                    discountAmount: mostUsedCoupon.discountValue
                } : null,
                performance: couponUsage.map(coupon => ({
                    code: coupon._id,
                    usage: coupon.usageCount,
                    revenue: 0, // You might want to calculate this
                    successRate: 100 // You might want to calculate this
                })),
                timeline: couponTimeline.map(item => ({
                    date: item._id,
                    usage: item.usage,
                    revenue: item.revenue
                }))
            }
        });
    } catch (error) {
        console.error('Coupon analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupon analytics'
        });
    }
});