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
    getAllHeroSections
} = require('../controllers/heroSectionController');
const { heroSectionUpload, handleMulterError } = require('../config/multerConfig');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// Public Routes - No authentication required
router.get("/hero-sections/active", getActiveHeroSections);
router.get("/hero-sections/:id", getHeroSectionById);

// Admin Routes - Hero Section Management (with authentication and authorization)
router.get(
    "/admin/hero-sections",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAllHeroSections
);

router.post(
    "/admin/hero-sections",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createHeroSection
);

router.get(
    "/admin/hero-sections/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getHeroSectionById
);

router.put(
    "/admin/hero-sections/:id",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateHeroSection
);

// Slide Management Routes
router.post(
    "/admin/hero-sections/:heroSectionId/slides",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    heroSectionUpload.single('image'),
    handleMulterError,
    addSlide
);

router.put(
    "/admin/hero-sections/:heroSectionId/slides/:slideId",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    heroSectionUpload.single('image'),
    handleMulterError,
    updateSlide
);

router.delete(
    "/admin/hero-sections/:heroSectionId/slides/:slideId",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteSlide
);

router.put(
    "/admin/hero-sections/:heroSectionId/reorder",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    reorderSlides
);

router.put(
    "/admin/hero-sections/:heroSectionId/slides/:slideId/toggle",
    isAuthenticatedUser,
    authorizeRoles('admin'),
    toggleSlideActive
);

module.exports = router;