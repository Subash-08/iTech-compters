const express = require("express");
const router = express.Router();
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getPaymentStatus,
    handleRazorpayWebhook
} = require("../controllers/paymentController");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// Public webhook route (no authentication, verified by signature)
router.post("/webhook/razorpay", handleRazorpayWebhook);

// All other routes require authentication
router.use(isAuthenticatedUser);

// Create Razorpay order for payment
router.post("/payment/razorpay/create-order", createRazorpayOrder);

// Verify Razorpay payment after successful transaction
router.post("/payment/razorpay/verify", verifyRazorpayPayment);

// Get payment status for an order
router.get("/payment/order/:orderId/status", getPaymentStatus);

module.exports = router;