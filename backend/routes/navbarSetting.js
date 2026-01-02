const express = require('express');
const router = express.Router();
const {
    getNavbarSettings,
    updateNavbarSettings,
    resetNavbarSettings
} = require('../controllers/navbarSettingController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { navbarUpload } = require('../config/multerConfig');

// Public route - get navbar settings
router.get('/navbar-settings', getNavbarSettings);

// Protected routes (admin only)
router.put(
    '/admin/navbar-settings',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    navbarUpload.single('logo'),
    updateNavbarSettings
);

router.post(
    '/admin/navbar-settings/reset',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    resetNavbarSettings
);

module.exports = router;