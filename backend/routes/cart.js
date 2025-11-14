// routes/cartRoutes.js
const express = require("express");
const router = express.Router();

const {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getUserCart,
    getAllCarts,
    getMyCart,
    validateGuestCart,
    syncGuestCart,
    addPreBuiltPCToCart,
    updatePreBuiltPCQuantity,
    removePreBuiltPCFromCart
} = require("../controllers/cartController");

// ✅ Import cart-specific authentication
const { optionalAuth, requireAuth } = require("../middlewares/cartAuth");
// ✅ Keep existing authentication for admin routes
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// ==================== PUBLIC/GUEST ROUTES ====================

// @desc    Validate guest cart items
// @route   POST /api/v1/cart/guest/validate
router.route("/cart/guest/validate")
    .post(validateGuestCart);

// ==================== MIXED ROUTES (Guest + Auth) ====================

// @desc    Get user's cart (works for guests too)
// @route   GET /api/v1/cart
router.route("/cart")
    .get(optionalAuth, getMyCart); // ✅ Uses optional auth

// @desc    Add item to cart (works for guests too)
// @route   POST /api/v1/cart
router.route("/cart")
    .post(optionalAuth, addToCart); // ✅ Uses optional auth

// @desc    Update cart item quantity (works for guests too)
// @route   PUT /api/v1/cart
router.route("/cart")
    .put(optionalAuth, updateCartQuantity); // ✅ Uses optional auth

// @desc    Remove item from cart (works for guests too)
// @route   DELETE /api/v1/cart
router.route("/cart")
    .delete(optionalAuth, removeFromCart); // ✅ Uses optional auth

// ==================== PROTECTED CART ROUTES ====================

// @desc    Sync guest cart after login
// @route   POST /api/v1/cart/sync
router.route("/cart/sync")
    .post(requireAuth, syncGuestCart); // ✅ Uses cart requireAuth

// @desc    Clear entire cart (requires auth)
// @route   DELETE /api/v1/cart/clear
router.route("/cart/clear")
    .delete(requireAuth, clearCart); // ✅ Uses cart requireAuth

// ==================== ADMIN ROUTES (Use existing auth) ====================

// @desc    Get cart of any user (Admin)
// @route   GET /api/v1/admin/cart/user/:userId
router.route("/admin/cart/user/:userId")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getUserCart); // ✅ Uses existing auth

// @desc    Get all carts with pagination (Admin)
// @route   GET /api/v1/admin/carts
router.route("/admin/carts")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAllCarts); // ✅ Uses existing auth

router.post('/cart/prebuilt-pc/add', isAuthenticatedUser, addPreBuiltPCToCart);
router.put('/cart/prebuilt-pc/update/:pcId', isAuthenticatedUser, updatePreBuiltPCQuantity);
router.delete('/cart/prebuilt-pc/remove/:pcId', isAuthenticatedUser, removePreBuiltPCFromCart);

module.exports = router;