const express = require("express");
const router = express.Router();
const {
    createCoupon,
    getAllCoupons,
    getCoupon,
    updateCoupon,
    updateCouponStatus,
    deleteCoupon,
    validateCoupon,
    getActiveCoupons,
    getCouponAnalytics
} = require("../controllers/couponController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// User Routes - Coupon Validation
router.post(
    "/coupons/validate",
    isAuthenticatedUser,
    validateCoupon
);

router.get(
    "/coupons/active",
    isAuthenticatedUser,
    getActiveCoupons
);

// Admin Routes - Coupon Management
router.post(
    "/admin/coupons",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createCoupon
);

router.get('/admin/analytics/coupons', isAuthenticatedUser, authorizeRoles('admin'), getCouponAnalytics);

router.get(
    "/admin/coupons",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAllCoupons
);

router.get(
    "/admin/coupons/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getCoupon
);

router.put(
    "/admin/coupons/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateCoupon
);

router.patch(
    "/admin/coupons/:id/status",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateCouponStatus
);

router.delete(
    "/admin/coupons/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteCoupon
);

module.exports = router;