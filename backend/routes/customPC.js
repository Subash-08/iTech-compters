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
    extendQuoteExpiry
} = require('../controllers/customPCController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// Public routes
router.get('/custom-pc/config', getPCBuilderConfig);
router.get('/custom-pc/components/:category', getComponentsByCategory);
router.post('/custom-pc/quote', createPCQuote);

// Admin routes
router.get('/custom-pc/admin/quotes', isAuthenticatedUser, authorizeRoles('admin'), getPCQuotes);
router.get('/custom-pc/admin/quotes/stats', isAuthenticatedUser, authorizeRoles('admin'), getQuoteStats);
router.get('/custom-pc/admin/quotes/:id', isAuthenticatedUser, authorizeRoles('admin'), getPCQuote);
router.put('/custom-pc/admin/quotes/:id/status', isAuthenticatedUser, authorizeRoles('admin'), updateQuoteStatus);
router.put('/custom-pc/admin/quotes/:id/extend', isAuthenticatedUser, authorizeRoles('admin'), extendQuoteExpiry);
router.delete('/custom-pc/admin/quotes/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteQuote);

module.exports = router;