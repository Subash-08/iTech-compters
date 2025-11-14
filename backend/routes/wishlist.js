const express = require("express");
const router = express.Router();

const {
    addToWishlist,
    removeFromWishlist,
    getMyWishlist,
    checkWishlistItem,
    clearWishlist,
    getUserWishlist,
    getAllWishlists,
    getCurrentWishlist,
    syncGuestWishlist,
    addPreBuiltPCToWishlist,
    removePreBuiltPCFromWishlist
} = require("../controllers/wishlistController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");
const { optionalAuth } = require("../middlewares/cartAuth");

// ==================== USER ROUTES ====================

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist/add
router.route("/wishlist/add")
    .post(isAuthenticatedUser, addToWishlist);

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/remove/:productId
router.route("/wishlist/remove/:productId")
    .delete(isAuthenticatedUser, removeFromWishlist);

// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
router.route("/wishlist")
    .get(isAuthenticatedUser, getMyWishlist);

// @desc    Check if product is in wishlist
// @route   GET /api/v1/wishlist/check/:productId
router.route("/wishlist/check/:productId")
    .get(isAuthenticatedUser, checkWishlistItem);

// @desc    Clear entire wishlist
// @route   DELETE /api/v1/wishlist/clear
router.route("/wishlist/clear")
    .delete(isAuthenticatedUser, clearWishlist);

// ==================== ADMIN ROUTES ====================

// @desc    Get wishlist of any user (Admin)
// @route   GET /api/v1/admin/wishlist/user/:userId
router.route("/admin/wishlist/user/:userId")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getUserWishlist);

// @desc    Get all wishlists with pagination (Admin)
// @route   GET /api/v1/admin/wishlists
router.route("/admin/wishlists")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAllWishlists);

// @desc    Get current wishlist (works for both guest and authenticated)
// @route   GET /api/v1/wishlist/current
router.route("/wishlist/current")
    .get(optionalAuth, getCurrentWishlist);

// @desc    Sync guest wishlist after login
// @route   POST /api/v1/wishlist/sync-guest
router.route("/wishlist/sync-guest")
    .post(isAuthenticatedUser, syncGuestWishlist);


// NEW: Pre-built PC routes
router.post('/prebuilt-pc/add', isAuthenticatedUser, addPreBuiltPCToWishlist);
router.delete('/prebuilt-pc/remove/:pcId', isAuthenticatedUser, removePreBuiltPCFromWishlist);

module.exports = router;