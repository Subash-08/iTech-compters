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

// ========== ADD VIDEO CONFIGURATIONS HERE ==========

// File filter for VIDEOS
const videoFileFilter = (req, file, cb) => {
    // Check for video files
    const allowedVideoMimes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/ogg',
        'video/x-matroska'
    ];

    const allowedVideoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg', '.mkv'];

    // Check if it's a video file
    const isVideo = file.mimetype.startsWith('video/') ||
        allowedVideoMimes.includes(file.mimetype) ||
        allowedVideoExtensions.some(ext =>
            file.originalname.toLowerCase().endsWith(ext)
        );

    if (isVideo) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files (MP4, MOV, AVI, WebM, OGG, MKV) are allowed.'), false);
    }
};

// File filter for IMAGES (for thumbnails)
const imageFileFilter = (req, file, cb) => {
    const allowedImageMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedImageMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed.'), false);
    }
};

// File filter for BOTH videos and images
const videoAndImageFileFilter = (req, file, cb) => {
    // Check for video files
    const allowedVideoMimes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/ogg',
        'video/x-matroska'
    ];

    const allowedVideoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg', '.mkv'];

    // Check for image files
    const allowedImageMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    // Check if it's a video file
    const isVideo = file.mimetype.startsWith('video/') ||
        allowedVideoMimes.includes(file.mimetype) ||
        allowedVideoExtensions.some(ext =>
            file.originalname.toLowerCase().endsWith(ext)
        );

    // Check if it's an image file
    const isImage = allowedImageMimes.includes(file.mimetype);

    if (isVideo || isImage) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video (MP4, MOV, AVI, WebM, OGG, MKV) or image (JPEG, PNG, GIF, WebP) files are allowed.'), false);
    }
};

// VIDEO UPLOAD CONFIGURATIONS

// 1. Upload single video with thumbnail
const uploadVideoWithThumbnail = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                let uploadPath;
                if (file.fieldname === 'video') {
                    uploadPath = path.join(__dirname, '../public/uploads/videos/original');
                } else if (file.fieldname === 'thumbnail') {
                    uploadPath = path.join(__dirname, '../public/uploads/thumbnails');
                } else {
                    uploadPath = path.join(__dirname, '../public/uploads/videos');
                }
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);

                if (file.fieldname === 'video') {
                    cb(null, `video-${uniqueSuffix}${fileExtension}`);
                } else if (file.fieldname === 'thumbnail') {
                    cb(null, `thumb-${uniqueSuffix}.jpg`); // Always save as .jpg for consistency
                } else {
                    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
                }
            } catch (error) {
                cb(new Error(`Failed to generate filename: ${error.message}`), null);
            }
        }
    }),
    fileFilter: videoAndImageFileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
        files: 2 // Max 2 files (video + thumbnail)
    }
}).fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]);

// 2. Upload multiple videos with thumbnails
const uploadMultipleVideos = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                let uploadPath;
                if (file.fieldname === 'videos') {
                    uploadPath = path.join(__dirname, '../public/uploads/videos/original');
                } else if (file.fieldname === 'thumbnails') {
                    uploadPath = path.join(__dirname, '../public/uploads/thumbnails');
                } else {
                    uploadPath = path.join(__dirname, '../public/uploads/videos');
                }
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);

                if (file.fieldname === 'videos') {
                    cb(null, `video-${uniqueSuffix}${fileExtension}`);
                } else if (file.fieldname === 'thumbnails') {
                    cb(null, `thumb-${uniqueSuffix}.jpg`); // Always save as .jpg
                } else {
                    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
                }
            } catch (error) {
                cb(new Error(`Failed to generate filename: ${error.message}`), null);
            }
        }
    }),
    fileFilter: videoAndImageFileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB per file
        files: 10 // Max 10 files total (e.g., 5 videos + 5 thumbnails)
    }
}).fields([
    { name: 'videos', maxCount: 5 },
    { name: 'thumbnails', maxCount: 5 }
]);

// 3. Upload thumbnail only (for updating existing videos)
const uploadThumbnail = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                const uploadPath = path.join(__dirname, '../public/uploads/thumbnails');
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `thumb-${uniqueSuffix}.jpg`); // Always save as .jpg
            } catch (error) {
                cb(new Error(`Failed to generate filename: ${error.message}`), null);
            }
        }
    }),
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max for thumbnails
    }
}).single('thumbnail');

// 4. Simple video upload (for backward compatibility)
const uploadVideo = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                const uploadPath = path.join(__dirname, '../public/uploads/videos/original');
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);
                cb(null, `video-${uniqueSuffix}${fileExtension}`);
            } catch (error) {
                cb(new Error(`Failed to generate filename: ${error.message}`), null);
            }
        }
    }),
    fileFilter: videoFileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
        files: 1
    }
}).single('video');

// ========== END OF VIDEO CONFIGURATIONS ==========

// Rest of your existing code (keep all your existing configurations)...

// File filter for images only (existing - keep this)
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

// Create multer instances for different entities (existing - keep these)
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

const variantImagesUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                // Save variant images to same directory as products
                const uploadPath = path.join(__dirname, '../public/uploads/products');
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);
                const filename = `variant-${uniqueSuffix}${fileExtension}`;
                cb(null, filename);
            } catch (error) {
                cb(new Error(`Failed to generate filename: ${error.message}`), null);
            }
        }
    }),
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

const productUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                const uploadPath = path.join(__dirname, '../public/uploads/products');
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);

                // 🆕 Generate filename based on field type
                let filename;
                if (file.fieldname.includes('thumbnail') && file.fieldname.includes('variants')) {
                    const variantMatch = file.fieldname.match(/variants\[(\d+)\]/);
                    const variantIndex = variantMatch ? variantMatch[1] : '0';
                    filename = `variant-${variantIndex}-thumbnail-${uniqueSuffix}${fileExtension}`;
                } else if (file.fieldname.includes('gallery') && file.fieldname.includes('variants')) {
                    const variantMatch = file.fieldname.match(/variants\[(\d+)\]/);
                    const variantIndex = variantMatch ? variantMatch[1] : '0';
                    filename = `variant-${variantIndex}-gallery-${uniqueSuffix}${fileExtension}`;
                } else if (file.fieldname === 'thumbnail') {
                    filename = `product-thumbnail-${uniqueSuffix}${fileExtension}`;
                } else if (file.fieldname === 'hoverImage') {
                    filename = `product-hover-${uniqueSuffix}${fileExtension}`;
                } else if (file.fieldname === 'gallery') {
                    filename = `product-gallery-${uniqueSuffix}${fileExtension}`;
                } else if (file.fieldname === 'manufacturerImages') {
                    filename = `manufacturer-${uniqueSuffix}${fileExtension}`;
                } else {
                    filename = `product-${uniqueSuffix}${fileExtension}`;
                }

                cb(null, filename);
            } catch (error) {
                cb(new Error(`Failed to generate filename: ${error.message}`), null);
            }
        }
    }),
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 50 // Increased to handle variant images
    }
});

// 🆕 NEW: Function to handle dynamic field names
const handleDynamicFields = () => {
    return (req, res, next) => {
        const upload = productUpload.any(); // Use .any() to accept any field name

        upload(req, res, function (err) {
            if (err) {
                return handleMulterError(err, req, res, next);
            }

            // 🆕 Organize files by field name for easier processing
            if (req.files) {
                const organizedFiles = {};
                req.files.forEach(file => {
                    if (!organizedFiles[file.fieldname]) {
                        organizedFiles[file.fieldname] = [];
                    }
                    organizedFiles[file.fieldname].push(file);
                });
                req.files = organizedFiles;
            }

            next();
        });
    };
};

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

const blogUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            try {
                const uploadPath = path.join(__dirname, '../public/uploads/blogs');
                ensureUploadDir(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Failed to create upload directory: ${error.message}`), null);
            }
        },
        filename: function (req, file, cb) {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);
                const filename = `blog-${uniqueSuffix}${fileExtension}`;
                cb(null, filename);
            } catch (error) {
                cb(new Error(`Failed to generate filename: ${error.message}`), null);
            }
        }
    }),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for blog images
        files: 1
    }
});

// ========== EXPORT EVERYTHING ==========

module.exports = {
    // Existing exports
    userUpload,
    brandUpload,
    categoryUpload,
    productUpload,
    heroSectionUpload,
    preBuiltPCUpload,
    preBuiltPCComponentUpload,
    preBuiltPCBulkUpload,
    handlePreBuiltPCUpload,
    handleSimplePreBuiltPCUpload,
    handleMulterError,
    blogUpload,
    variantImagesUpload,
    preBuiltPCFields,
    generateComponentFields,
    simplePreBuiltPCFields,
    handleDynamicFields,

    // NEW: Video upload exports (ADD THESE)
    uploadVideoWithThumbnail,
    uploadMultipleVideos,
    uploadThumbnail,
    uploadVideo,
    videoFileFilter,
    imageFileFilter,
    videoAndImageFileFilter
};