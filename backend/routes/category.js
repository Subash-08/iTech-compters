const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");
const {
    createCategory,
    getAllCategories,
    getCategoryBySlug,
    updateCategory,
    updateCategoryStatus,
    partialUpdateCategory,
    getCategory,
    getCategoryTree,
    getCategoriesDropdown,
    deleteAllBrands,
    deleteAllCategories,
    createMultipleCategories,
    getHomeShowcaseCategories,
    updateHomeShowcaseCategorySettings
} = require("../controllers/categoryController");
const { categoryUpload, handleMulterError } = require("../config/multerConfig");
router.get("/categories/home-showcase", getHomeShowcaseCategories);
// Public routes - No authentication required
router.get("/categories", getAllCategories);
router.get("/category/:slug", getCategoryBySlug);


router.get(
    "/admin/categories/home-showcase",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getHomeShowcaseCategories
);

// 2. NEW: Update Showcase Settings
router.patch(
    "/admin/categories/:id/home-showcase",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateHomeShowcaseCategorySettings
);
// Admin routes - Category Management (Admin only)
router.post(
    "/admin/categories",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    categoryUpload.single('image'),
    handleMulterError,
    createCategory
);

router.get(
    "/admin/categories",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAllCategories
);
router.post(
    "/admin/categories/bulk",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createMultipleCategories
);

router.get(
    "/admin/categories/tree",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getCategoryTree
);

router.get(
    "/admin/categories/dropdown",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getCategoriesDropdown
);

router.get(
    "/admin/categories/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getCategory
);

router.put(
    "/admin/categories/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    categoryUpload.single('image'),
    handleMulterError,
    updateCategory
);

router.patch(
    "/admin/categories/:id/status",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateCategoryStatus
);

router.patch(
    "/admin/categories/:id/partial",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    partialUpdateCategory
);

module.exports = router;