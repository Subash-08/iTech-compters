// routes/admin.js
const express = require('express');
const router = express.Router();

// Import from your existing productController
const {
    updateProduct,
    updateProductStatus,
    updateProductVariants,
    partialUpdateProduct,
    updateProductInventory
} = require('../controllers/adminController'); // Make sure this points to your actual controller file

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { getQuickStats } = require('../controllers/analyticsController');

// 🆕 IMPORT MULTER CONFIGURATION
const { productUpload, handleMulterError, handleDynamicFields } = require("../config/multerConfig");

router.get('/admin/analytics/quick-stats', authorizeRoles('admin'), getQuickStats);

// Admin product routes

// 🆕 UPDATED: Add file upload middleware to update routes
router.put('/admin/product/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    handleDynamicFields(),
    handleMulterError,
    updateProduct
);

router.patch('/admin/products/:id/partial',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    productUpload.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'hoverImage', maxCount: 1 },
        { name: 'gallery', maxCount: 10 },
        { name: 'manufacturerImages', maxCount: 10 }
    ]),
    handleMulterError,
    partialUpdateProduct
);

// These routes don't need file uploads as they handle specific updates
router.patch('/admin/products/:id/status',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateProductStatus
);

router.patch('/admin/products/:id/variants',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateProductVariants
);

router.patch('/admin/products/:id/inventory',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateProductInventory
);

module.exports = router;