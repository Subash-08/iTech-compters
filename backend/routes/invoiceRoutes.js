const express = require('express');
const router = express.Router();
const {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoicePDF,
    downloadInvoicePDF,
    getInvoiceStats,
    searchInvoices,
    getRecentInvoices,
    getInvoiceTemplate
} = require('../controllers/invoiceController');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// Admin routes
router.post('/admin/invoices',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createInvoice
);

router.get('/admin/invoices',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getInvoices
);

router.get('/admin/invoices/search',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    searchInvoices
);

router.get('/admin/invoices/recent',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getRecentInvoices
);

router.get('/admin/invoices/stats',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getInvoiceStats
);

router.get('/admin/invoices/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    getInvoice
);

router.put('/admin/invoices/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateInvoice
);

router.delete('/admin/invoices/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteInvoice
);

// PDF Generation routes
router.post('/admin/invoices/:id/generate-pdf',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    generateInvoicePDF
);

router.get('/admin/invoices/:id/download',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    downloadInvoicePDF
);

// Public route for invoice template preview
router.get('/invoice-template',
    getInvoiceTemplate
);

module.exports = router;