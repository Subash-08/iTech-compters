const express = require("express");
const router = express.Router();
const {
    getCheckoutData,
    calculateCheckout,
    createOrder,
    saveAddress,
    updateAddress,
    deleteAddress
} = require("../controllers/checkout");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// All checkout routes require authentication
router.use(isAuthenticatedUser);

router.get("/checkout", getCheckoutData);
router.post("/checkout/calculate", calculateCheckout);
router.post("/checkout/create-order", createOrder);
router.post("/checkout/address", saveAddress);
router.put("/checkout/address/:id", updateAddress);
router.delete("/checkout/address/:id", deleteAddress);

module.exports = router;