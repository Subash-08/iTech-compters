// middleware/multer.js - EXTEND your existing file

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Your existing image storage configuration
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Your existing image upload logic
        cb(null, path.join(process.cwd(), 'uploads', 'images'));
    },
    filename: function (req, file, cb) {
        // Your existing filename logic
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// NEW: Invoice storage configuration
const invoiceStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const invoiceDir = path.join(process.cwd(), 'uploads', 'invoices', 'admin-uploaded');

        try {
            await fs.access(invoiceDir);
        } catch (error) {
            await fs.mkdir(invoiceDir, { recursive: true });
        }

        cb(null, invoiceDir);
    },
    filename: function (req, file, cb) {
        const orderId = req.params.orderId || 'unknown';
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const ext = path.extname(file.originalname);

        const filename = `admin-invoice-${orderId}-${timestamp}${ext}`;
        cb(null, filename);
    }
});

// Your existing file filters
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// NEW: Invoice file filter
const invoiceFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed for invoices!'), false);
    }
};

// Your existing upload configurations
const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// NEW: Invoice upload configuration
const uploadInvoice = multer({
    storage: invoiceStorage,
    fileFilter: invoiceFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
});

// Export both (add uploadInvoice to your existing exports)
module.exports = {
    uploadImage,
    uploadInvoice
};