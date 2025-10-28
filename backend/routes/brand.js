const express = require("express");
const router = express.Router();
const {
    createBrand,
    getAllBrands,
    getBrand,
    updateBrand,
    updateBrandStatus,
    deleteBrand
} = require("../controllers/brandController");
const { brandUpload } = require("../config/multerConfig");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

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

router.get(
    "/admin/brands",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAllBrands
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