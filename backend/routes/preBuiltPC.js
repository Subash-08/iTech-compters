// routes/preBuiltPCRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllPreBuiltPCs,
    getPreBuiltPC,
    getPreBuiltPCBySlug,
    updatePreBuiltPC,
    deletePreBuiltPC,
    getPreBuiltPCCategories,
    getFeaturedPreBuiltPCs,
    // New test-related functions
    addBenchmarkTests,
    updateBenchmarkTest,
    removeBenchmarkTest,
    getPCsByPerformance,
    getBenchmarkCategories,
    getPerformanceStats,
    createPreBuiltPC,
    getAdminPreBuiltPCs,
    getPreBuiltPCAnalytics,
    reactivatePreBuiltPC,
    deactivatePreBuiltPC
} = require('../controllers/preBuiltPCController');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { handlePreBuiltPCUpload, handleMulterError } = require('../config/multerConfig');

// Public routes
router.get('/prebuilt-pcs', getAllPreBuiltPCs);
router.get('/prebuilt-pcs/categories', getPreBuiltPCCategories);
router.get('/prebuilt-pcs/featured', getFeaturedPreBuiltPCs);
router.get('/prebuilt-pcs/performance', getPCsByPerformance);
router.get('/prebuilt-pcs/benchmark-categories', getBenchmarkCategories);
router.get('/prebuilt-pcs/performance-stats', getPerformanceStats);
router.get('/prebuilt-pcs/:id', getPreBuiltPC);
router.get('/prebuilt-pcs/slug/:slug', getPreBuiltPCBySlug);

// Admin routes
router.get(
    '/admin/prebuilt-pcs',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getAdminPreBuiltPCs
);
router.get(
    '/admin/prebuilt-pcs/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getPreBuiltPC // Reusing the same controller, but now req.user will be populated!
);
// FIXED: Admin routes with file uploads - ADD handlePreBuiltPCUpload middleware
router.post(
    '/admin/prebuilt-pcs',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    handlePreBuiltPCUpload, // ADD THIS - processes file uploads
    handleMulterError,      // Error handling for uploads
    createPreBuiltPC        // Controller function
);

router.get('/admin/analytics/prebuilt-pcs', isAuthenticatedUser, authorizeRoles('admin'), getPreBuiltPCAnalytics);
router.put(
    '/admin/prebuilt-pcs/:id/reactivate',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    reactivatePreBuiltPC
);

router.put(
    '/admin/prebuilt-pcs/:id/deactivate',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deactivatePreBuiltPC
);
router.put(
    '/admin/prebuilt-pcs/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    handlePreBuiltPCUpload, // ADD THIS - processes file uploads
    handleMulterError,      // Error handling for uploads
    updatePreBuiltPC        // Controller function
);

// Routes without file uploads
router.delete(
    '/admin/prebuilt-pcs/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deletePreBuiltPC
);

// Test results management routes (no file uploads needed)
router.post(
    '/admin/prebuilt-pcs/:id/benchmark-tests',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    addBenchmarkTests
);

router.put(
    '/admin/prebuilt-pcs/:id/benchmark-tests/:testId',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateBenchmarkTest
);

router.delete(
    '/admin/prebuilt-pcs/:id/benchmark-tests/:testId',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    removeBenchmarkTest
);

module.exports = router;