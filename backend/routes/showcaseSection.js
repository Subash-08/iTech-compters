// routes/showcaseSection.js
const express = require('express');
const {
    getActiveShowcaseSections,
    getShowcaseSectionById,
    getAdminShowcaseSections,
    createShowcaseSection,
    updateShowcaseSection,
    deleteShowcaseSection,
    bulkUpdateDisplayOrder,
    toggleSectionStatus,
    recordSectionClick
} = require('../controllers/showcaseSectionController');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

const router = express.Router();

// Public routes
router.get('/showcase-sections', getActiveShowcaseSections);
router.get('/showcase-sections/:id', getShowcaseSectionById);
router.post('/showcase-sections/:id/click', recordSectionClick);

// Admin routes
router.get('/admin/showcase-sections', isAuthenticatedUser, authorizeRoles('admin'), getAdminShowcaseSections);
router.post('/admin/showcase-sections', isAuthenticatedUser, authorizeRoles('admin'), createShowcaseSection);
router.put('/admin/showcase-sections/:id', isAuthenticatedUser, authorizeRoles('admin'), updateShowcaseSection);
router.delete('/admin/showcase-sections/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteShowcaseSection);
router.put('/admin/showcase-sections/display-order/bulk', isAuthenticatedUser, authorizeRoles('admin'), bulkUpdateDisplayOrder);
router.put('/admin/showcase-sections/:id/toggle-status', isAuthenticatedUser, authorizeRoles('admin'), toggleSectionStatus);

module.exports = router;