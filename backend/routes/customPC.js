const express = require('express');
const router = express.Router();
const {
    getPCBuilderConfig,
    getComponentsByCategory,
    createPCQuote,
    getPCQuotes,
    getPCQuote,
    updateQuoteStatus,
    getQuoteStats,
    deleteQuote,
    extendQuoteExpiry,
    getPCAnalytics,
    submitPCRequirements,
    getAllPCRequirements,
    getPCRequirementsStats,
    getPCRequirement,
    updatePCRequirement
} = require('../controllers/customPCController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// Public routes
router.get('/custom-pc/config', getPCBuilderConfig);
router.get('/custom-pc/components/:category', getComponentsByCategory);
router.post('/custom-pc/quote', createPCQuote);
router.get('/admin/analytics/pc-builder', isAuthenticatedUser, authorizeRoles('admin'), getPCAnalytics);
router.post('/custom-pc/requirements', submitPCRequirements);

// Admin routes for requirements
router.get('/custom-pc/admin/requirements', isAuthenticatedUser, authorizeRoles('admin'), getAllPCRequirements);
router.get('/custom-pc/admin/requirements/stats', isAuthenticatedUser, authorizeRoles('admin'), getPCRequirementsStats);
router.get('/custom-pc/admin/requirements/:id', isAuthenticatedUser, authorizeRoles('admin'), getPCRequirement);
router.put('/custom-pc/admin/requirements/:id', isAuthenticatedUser, authorizeRoles('admin'), updatePCRequirement);
router.get('/custom-pc/admin/quotes', isAuthenticatedUser, authorizeRoles('admin'), getPCQuotes);
router.get('/custom-pc/admin/quotes/stats', isAuthenticatedUser, authorizeRoles('admin'), getQuoteStats);
router.get('/custom-pc/admin/quotes/:id', isAuthenticatedUser, authorizeRoles('admin'), getPCQuote);
router.put('/custom-pc/admin/quotes/:id/status', isAuthenticatedUser, authorizeRoles('admin'), updateQuoteStatus);
router.put('/custom-pc/admin/quotes/:id/extend', isAuthenticatedUser, authorizeRoles('admin'), extendQuoteExpiry);
router.delete('/custom-pc/admin/quotes/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteQuote);

module.exports = router;