const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");
const { createBrand, getAllBrands, createMultipleBrands } = require("../controllers/brandController");

// Create new brand (Admin only)
router.post(
    "/admin/brand/new",
    createBrand
);

// Get all brands (Admin only)
router.get(
    "/admin/brands",
    getAllBrands
);

router.get(
    "/brands",
    getAllBrands
);
// Create multiple brands in one request (Admin only)
router.post(
    "/admin/brands/bulk",
    createMultipleBrands
);
module.exports = router;
