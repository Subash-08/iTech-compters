const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");
const {
    createCategory,
    getAllCategories,
    getCategoryBySlug,
} = require("../controllers/categoryController");

// Create new category (Admin only)
router.post(
    "/admin/category/new",
    createCategory
);

// Get all categories (Admin only)
router.get(
    "/admin/categories",
    getAllCategories
);
router.get(
    "/categories",
    getAllCategories
);
// Get single category by slug (public or admin)
router.get("/category/:slug", getCategoryBySlug);

module.exports = router;
