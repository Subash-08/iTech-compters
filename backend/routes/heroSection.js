// backend/routes/heroSectionRoutes.js
const express = require('express');
const router = express.Router();
const {
    createHeroSection,
    addSlide,
    getActiveHeroSections,
    getHeroSectionById,
    updateSlide,
    deleteSlide,
    updateHeroSection,
    reorderSlides,
    toggleSlideActive,
    getAllHeroSections,
    getAvailableVideos,
    reorderHeroSections
} = require('../controllers/heroSectionController');
const { heroSectionUpload, handleMulterError } = require('../config/multerConfig');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================
router.get("/hero-sections/active", getActiveHeroSections);
router.get("/hero-sections/:id", getHeroSectionById);

// ==========================================
// 2. ADMIN ROUTES - STATIC/FIXED ROUTES FIRST
// ==========================================

// Get all hero sections
router.get(
    "/admin/hero-sections",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAllHeroSections
);

// Get available videos
router.get(
    "/admin/hero-sections/available-videos",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAvailableVideos
);

// Create hero section
router.post(
    "/admin/hero-sections",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createHeroSection
);

// ⚠️ CRITICAL: Reorder hero sections MUST come before :id routes
router.put(
    "/admin/hero-sections/reorder",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    reorderHeroSections
);

// ==========================================
// 3. ADMIN ROUTES - DYNAMIC ROUTES (/:id)
// ==========================================

// Get hero section by ID
router.get(
    "/admin/hero-sections/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getHeroSectionById
);

// Update hero section
router.put(
    "/admin/hero-sections/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateHeroSection
);

// ==========================================
// 4. SLIDE MANAGEMENT ROUTES
// ==========================================

// Add slide
router.post(
    "/admin/hero-sections/:heroSectionId/slides",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    heroSectionUpload.single('image'),
    handleMulterError,
    addSlide
);

// Update slide
router.put(
    "/admin/hero-sections/:heroSectionId/slides/:slideId",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    heroSectionUpload.single('image'),
    handleMulterError,
    updateSlide
);

// Delete slide
router.delete(
    "/admin/hero-sections/:heroSectionId/slides/:slideId",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteSlide
);

// Reorder slides within a section
router.put(
    "/admin/hero-sections/:heroSectionId/reorder",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    reorderSlides
);

// Toggle slide active status
router.put(
    "/admin/hero-sections/:heroSectionId/slides/:slideId/toggle",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    toggleSlideActive
);

module.exports = router;