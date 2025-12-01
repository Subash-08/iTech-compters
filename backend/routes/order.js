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
    exportOrders,
    getOrderByNumber,
    handlePaymentSuccess,
    downloadInvoice,
    getOrderInvoices,
    uploadAdminInvoice,
    generateAutoInvoiceAdmin,
    deleteAdminInvoice,
    getEnhancedOrderAnalytics,
    getSalesChartData,
    getQuickStats,
} = require("../controllers/orderController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");
const { uploadInvoice } = require("../config/multer");

// ==================== PUBLIC ROUTES ====================
router.get("/orders/track/:orderNumber", trackOrder);


// ==================== USER ROUTES ====================
router.use(isAuthenticatedUser);

router.get("/orders", getUserOrders);
router.get("/orders/:orderId", getOrderDetails);
router.get("/order/number/:orderNumber", getOrderByNumber);
router.post("/orders/:orderId/payment-success", handlePaymentSuccess);
// ==================== NEW INVOICE ROUTES (USER) ====================
router.get("/orders/:orderId/invoices", getOrderInvoices); // Get all invoices
router.get("/orders/:orderId/invoice/:invoiceType", downloadInvoice);

// ==================== ADMIN ROUTES ====================
router.post("/admin/orders/:orderId/invoice/upload",
    authorizeRoles('admin'),
    uploadInvoice.single('invoice'),
    uploadAdminInvoice
);

router.post("/admin/orders/:orderId/invoice/generate",
    authorizeRoles('admin'),
    generateAutoInvoiceAdmin
);

router.delete("/admin/orders/:orderId/invoice/admin",
    authorizeRoles('admin'),
    deleteAdminInvoice
);

router.get("/admin/orders/:orderId/invoices",
    authorizeRoles('admin'),
    getOrderInvoices
);
router.get('/admin/analytics/sales-chart', authorizeRoles('admin'), getSalesChartData);
router.get("/admin/orders", authorizeRoles('admin'), getAllOrders);
router.get("/admin/orders/analytics", authorizeRoles('admin'), getOrderAnalytics);
router.get("/admin/orders/analytics/enhanced", authorizeRoles('admin'), getEnhancedOrderAnalytics);
router.get('/admin/analytics/quick-stats', authorizeRoles('admin'), getQuickStats);
router.get("/admin/orders/export", authorizeRoles('admin'), exportOrders);
router.get("/admin/orders/:orderId", authorizeRoles('admin'), getAdminOrderDetails);
router.put("/admin/orders/:orderId/status", authorizeRoles('admin'), updateOrderStatus);
router.post("/admin/orders/:orderId/notes", authorizeRoles('admin'), addAdminNote);


module.exports = router;