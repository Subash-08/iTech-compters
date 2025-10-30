const express = require("express");
const router = express.Router();

const {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getUserCart,
    getAllCarts,
    getMyCart
} = require("../controllers/cartController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// ==================== USER ROUTES ====================

// @desc    Get user's cart
// @route   GET /api/v1/cart
router.route("/cart")
    .get(isAuthenticatedUser, getMyCart);

// @desc    Add item to cart
// @route   POST /api/v1/cart
router.route("/cart")
    .post(isAuthenticatedUser, addToCart);

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart
router.route("/cart")
    .put(isAuthenticatedUser, updateCartQuantity);

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart
router.route("/cart")
    .delete(isAuthenticatedUser, removeFromCart);

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart/clear
router.route("/cart/clear")
    .delete(isAuthenticatedUser, clearCart);

// ==================== ADMIN ROUTES ====================

// @desc    Get cart of any user (Admin)
// @route   GET /api/v1/admin/cart/user/:userId
router.route("/admin/cart/user/:userId")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getUserCart);

// @desc    Get all carts with pagination (Admin)
// @route   GET /api/v1/admin/carts
router.route("/admin/carts")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAllCarts);

module.exports = router;