// config/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper function to ensure upload directory exists
const ensureUploadDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Generic storage configuration
const createStorage = (entityType) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                const uploadPath = path.join(__dirname, `../public/uploads/${entityType}`);
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory for ${entityType}: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);
                const filename = `${entityType}-${uniqueSuffix}${fileExtension}`;
                cb(null, filename);
            } catch (error) {
                cb(new Error(`Failed to generate filename for ${entityType}: ${error.message}`), null);
            }
        }
    });
};

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
    }

    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Unsupported image format. Use JPEG, PNG, WebP, or GIF.'), false);
    }

    cb(null, true);
};

// Create multer instances for different entities
const userUpload = multer({
    storage: createStorage('users'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB for user avatars
        files: 1
    }
});

const brandUpload = multer({
    storage: createStorage('brands'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

const categoryUpload = multer({
    storage: createStorage('categories'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

const productUpload = multer({
    storage: createStorage('products'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10
    }
});

// HERO SECTION UPLOAD CONFIGURATION
const heroSectionUpload = multer({
    storage: createStorage('hero-slides'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for hero slides
        files: 1
    }
});

// PRE-BUILT PC UPLOAD CONFIGURATIONS
const preBuiltPCUpload = multer({
    storage: createStorage('prebuilt-pcs'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for PC images
        files: 5 // Maximum 5 images per PC
    }
});

const preBuiltPCComponentUpload = multer({
    storage: createStorage('prebuilt-pc-components'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per component image
        files: 10 // Maximum 10 component images
    }
});

// Dynamic upload for multiple component images with field name pattern
const createComponentUpload = (maxComponents = 15) => {
    return multer({
        storage: createStorage('prebuilt-pc-components'),
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB per component image
            files: maxComponents
        }
    });
};

// Special upload for bulk operations
const preBuiltPCBulkUpload = multer({
    storage: createStorage('prebuilt-pcs-bulk'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB for bulk operations
        files: 20 // More files for bulk uploads
    }
});

// Error handling middleware
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Please check the size limit.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name or too many files.'
            });
        }
    } else if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
};

// Field configuration helpers for pre-built PCs
const preBuiltPCFields = [
    { name: 'images', maxCount: 5 }, // Main PC images
    { name: 'components[0][image]', maxCount: 1 },
    { name: 'components[1][image]', maxCount: 1 },
    { name: 'components[2][image]', maxCount: 1 },
    { name: 'components[3][image]', maxCount: 1 },
    { name: 'components[4][image]', maxCount: 1 },
    { name: 'components[5][image]', maxCount: 1 },
    { name: 'components[6][image]', maxCount: 1 },
    { name: 'components[7][image]', maxCount: 1 },
    { name: 'components[8][image]', maxCount: 1 },
    { name: 'components[9][image]', maxCount: 1 }
];

// Function to generate dynamic fields for components
const generateComponentFields = (componentCount = 10) => {
    const fields = [
        { name: 'images', maxCount: 5 } // Main PC images
    ];

    for (let i = 0; i < componentCount; i++) {
        fields.push({ name: `components[${i}][image]`, maxCount: 1 });
    }

    return fields;
};

// NEW: Enhanced pre-built PC upload that preserves form fields
const enhancedPreBuiltPCUpload = multer({
    storage: createStorage('prebuilt-pcs'),
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for PC images
        files: 15 // Total files (5 main + 10 component images)
    }
});

// NEW: Simple field configuration that matches frontend field names
const simplePreBuiltPCFields = [
    { name: 'images', maxCount: 5 },
    { name: 'componentImages', maxCount: 10 } // Matches frontend field name
];

// FIXED: Simple and working upload handler for pre-built PCs
const handlePreBuiltPCUpload = enhancedPreBuiltPCUpload.fields(simplePreBuiltPCFields);

// NEW: Alternative upload handler for testing without complex field names
const handleSimplePreBuiltPCUpload = () => {
    return (req, res, next) => {
        const upload = enhancedPreBuiltPCUpload.fields([
            { name: 'images', maxCount: 5 },
            { name: 'componentImages', maxCount: 10 }
        ]);

        upload(req, res, function (err) {
            if (err) {
                return handleMulterError(err, req, res, next);
            }
            next();
        });
    };
};

// NEW: Debug middleware to see what Multer is processing
const debugMulterUpload = (req, res, next) => {
    console.log('🔍 === MULTER DEBUG START ===');
    console.log('📝 Method:', req.method);
    console.log('📋 Content-Type:', req.headers['content-type']);
    console.log('📦 Request body keys:', Object.keys(req.body));
    console.log('🖼️ Request files:', req.files);

    // Log specific form fields
    const importantFields = ['name', 'category', 'description', 'components', 'tags', 'totalPrice'];
    importantFields.forEach(field => {
        if (req.body[field]) {
            console.log(`✅ ${field}:`, typeof req.body[field] === 'string' ?
                req.body[field].substring(0, 100) + '...' : 'EXISTS');
        } else {
            console.log(`❌ ${field}: MISSING`);
        }
    });

    console.log('🔍 === MULTER DEBUG END ===');
    next();
};

module.exports = {
    userUpload,
    brandUpload,
    categoryUpload,
    productUpload,
    heroSectionUpload,
    // Pre-built PC uploads
    preBuiltPCUpload,
    preBuiltPCComponentUpload,
    preBuiltPCBulkUpload,
    handlePreBuiltPCUpload,
    handleSimplePreBuiltPCUpload,
    handleMulterError,
    // Field configurations
    preBuiltPCFields,
    generateComponentFields,
    simplePreBuiltPCFields,
    // NEW: Debug middleware
    debugMulterUpload
};