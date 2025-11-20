const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/orderController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// ==================== PUBLIC ROUTES ====================
router.get("/orders/track/:orderNumber", trackOrder);

// ==================== USER ROUTES ====================
router.use(isAuthenticatedUser);

router.get("/orders", getUserOrders);
router.get("/orders/:orderId", getOrderDetails);
router.put("/orders/:orderId/cancel", cancelOrder);

// ==================== ADMIN ROUTES ====================
router.get("/admin/orders", authorizeRoles('admin'), getAllOrders);
router.get("/admin/orders/analytics", authorizeRoles('admin'), getOrderAnalytics);
router.get("/admin/orders/export", authorizeRoles('admin'), exportOrders);
router.get("/admin/orders/:orderId", authorizeRoles('admin'), getAdminOrderDetails);
router.put("/admin/orders/:orderId/status", authorizeRoles('admin'), updateOrderStatus);
router.post("/admin/orders/:orderId/notes", authorizeRoles('admin'), addAdminNote);

module.exports = router;