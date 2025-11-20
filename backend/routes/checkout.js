const express = require("express");
const router = express.Router();
const {
    getCheckoutData,
    calculateCheckout,
    createOrder,
    saveAddress,
    updateAddress
} = require("../controllers/checkout");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// All checkout routes require authentication
router.use(isAuthenticatedUser);

router.get("/checkout", getCheckoutData);
router.post("/checkout/calculate", calculateCheckout);
router.post("/checkout/create-order", createOrder);
router.post("/checkout/address", saveAddress);

module.exports = router;