const express = require('express');
const {
    // Public routes
    getProductReviews,

    // User routes
    addReview,
    updateReview,
    deleteReview,

    // Admin routes (direct from Review model)
    getAdminReviews,
    adminDeleteReview,

    // Debug routes
    debugReviewStats,
    forceUpdateReviewStats
} = require('../controllers/reviewController.js');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate.js');

const router = express.Router();

// =====================================================
// 🔓 PUBLIC ROUTES
// =====================================================
router.get("/product/:id/reviews", getProductReviews);

// =====================================================
// 🔐 USER ROUTES (Logged-in users)
// =====================================================
router.post("/product/:id/review", isAuthenticatedUser, addReview);
router.put("/product/:id/review", isAuthenticatedUser, updateReview);
router.delete("/product/:id/review", isAuthenticatedUser, deleteReview);

// =====================================================
// 👑 ADMIN ROUTES (Direct from Review collection)
// =====================================================
router.get("/admin/reviews",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAdminReviews
);

router.delete("/admin/review/:reviewId",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    adminDeleteReview
);

// =====================================================
// 🛠️ DEBUG/UTILITY ROUTES
// =====================================================
router.get("/admin/debug/review-stats/:productId",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    debugReviewStats
);

router.post("/admin/force-update-review-stats/:productId",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    forceUpdateReviewStats
);

module.exports = router;