const express = require('express');
const router = express.Router();
const {
    getQuickStats,
    getSalesChartData,
    getUserAnalytics,
    getProductAnalytics,
    getPCAnalytics,
    getCouponAnalytics
} = require('../controllers/analyticsController');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// All routes are protected and admin only
router.get('/quick-stats', isAuthenticatedUser, authorizeRoles('admin'), getQuickStats);
router.get('/sales-chart', isAuthenticatedUser, authorizeRoles('admin'), getSalesChartData);
router.get('/users', isAuthenticatedUser, authorizeRoles('admin'), getUserAnalytics);
router.get('/products', isAuthenticatedUser, authorizeRoles('admin'), getProductAnalytics);
router.get('/pc-builder', isAuthenticatedUser, authorizeRoles('admin'), getPCAnalytics);
router.get('/coupons', isAuthenticatedUser, authorizeRoles('admin'), getCouponAnalytics);

module.exports = router;