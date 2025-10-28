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

// Admin product routes
router.patch('/admin/products/:id/status', isAuthenticatedUser, authorizeRoles('admin'), updateProductStatus);
router.put('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), updateProduct);
router.patch('/admin/products/:id/variants', isAuthenticatedUser, authorizeRoles('admin'), updateProductVariants);
router.patch('/admin/products/:id/partial', isAuthenticatedUser, authorizeRoles('admin'), partialUpdateProduct);
router.patch('/admin/products/:id/inventory', isAuthenticatedUser, authorizeRoles('admin'), updateProductInventory);




module.exports = router;