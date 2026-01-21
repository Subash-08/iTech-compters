const express = require("express");
const router = express.Router();
const {
    createBrand,
    getAllBrands,
    getBrand,
    updateBrand,
    updateBrandStatus,
    deleteBrand,
    createMultipleBrands,
    getHomeShowcaseBrands,
    updateHomeShowcaseSettings
} = require("../controllers/brandController");
const { brandUpload } = require("../config/multerConfig");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");
router.get("/brands/home-showcase", getHomeShowcaseBrands);
// Public Routes - No authentication required
router.get("/brands", getAllBrands);
router.get("/brand/slug/:slug", getBrand);

// Admin Routes - Brand Management (with authentication and authorization)
router.post(
    "/admin/brands",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    brandUpload.single('logo'),
    createBrand
);

router.post(
    "/admin/brands/bulk",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createMultipleBrands
);

router.get(
    "/admin/brands",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAllBrands
);
router.get(
    "/admin/brands/home-showcase",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getHomeShowcaseBrands
);

// Update settings (Order/Featured) for a specific brand
router.patch(
    "/admin/brands/:id/home-showcase",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateHomeShowcaseSettings
);
router.get(
    "/admin/brands/:slug",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getBrand
);

// Updated route to handle logo uploads and brand updates
router.put(
    "/admin/brands/:slug",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    brandUpload.single('logo'),
    updateBrand
);

router.patch(
    "/admin/brands/:id/status",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateBrandStatus
);

router.delete(
    "/admin/brands/:slug",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteBrand
);

module.exports = router;