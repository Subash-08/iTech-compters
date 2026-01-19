// routes/featuredBrandRoutes.js
const express = require("express");
const router = express.Router();
const {
    createFeaturedBrand,
    getFeaturedBrands,
    getAllFeaturedBrandsForAdmin,
    getFeaturedBrandById,
    updateFeaturedBrand,
    updateFeaturedBrandStatus,
    deleteFeaturedBrand,
    updateDisplayOrder,
    getFeaturedBrandsCount
} = require("../controllers/featuredBrandController");
const { featuredBrandUpload } = require("../config/multerConfig");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// Public Routes - Fixed paths
router.get("/featured-brands", getFeaturedBrands);
router.get("/featured-brands/count", getFeaturedBrandsCount);

// Admin Routes - Fixed paths
router.post(
    "/admin/featured-brands",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    featuredBrandUpload.single('logo'),
    createFeaturedBrand
);

router.get(
    "/admin/featured-brands",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAllFeaturedBrandsForAdmin
);

router.get(
    "/admin/featured-brands/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getFeaturedBrandById
);

router.put(
    "/admin/featured-brands/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    featuredBrandUpload.single('logo'),
    updateFeaturedBrand
);

router.patch(
    "/admin/featured-brands/:id/status",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateFeaturedBrandStatus
);

router.put(
    "/admin/featured-brands/update-order",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateDisplayOrder
);

router.delete(
    "/admin/featured-brands/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteFeaturedBrand
);

module.exports = router;