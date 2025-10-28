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
    } else if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
};

module.exports = {
    userUpload,
    brandUpload,
    categoryUpload,
    productUpload,
    handleMulterError
};