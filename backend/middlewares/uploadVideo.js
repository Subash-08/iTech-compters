// backend/middleware/uploadVideo.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const createDirectories = () => {
    const dirs = [
        'uploads/videos',
        'uploads/videos/original',
        'uploads/videos/optimized',
        'uploads/thumbnails',
        'uploads/temp'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

createDirectories();

// Configure storage for original videos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const destPath = path.join(__dirname, '..', 'uploads/videos/original');
        cb(null, destPath);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `video_${Date.now()}_${uniqueId.slice(0, 8)}${extension}`;
        cb(null, filename);
    }
});

// File filter for video files
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
        'video/webm',
        'video/ogg'
    ];

    const allowedExtensions = ['.mp4', '.mpeg', '.mov', '.avi', '.webm', '.ogg', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} are allowed.`), false);
    }
};

// Configure multer with different configurations
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
        files: 1 // Max 1 file for single upload
    }
});

// Single file upload
const uploadSingle = upload.single('video');

// Multiple files upload
const uploadMultiple = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max per file
        files: 5 // Max 5 files at once
    }
}).array('videos', 5);

// Generate thumbnail from video using ffmpeg
const generateThumbnail = async (videoPath, outputFilename) => {
    return new Promise((resolve, reject) => {
        const thumbnailPath = path.join(__dirname, '..', 'public/uploads/thumbnails', outputFilename);

        ffmpeg(videoPath)
            .on('end', () => {
                resolve(thumbnailPath);
            })
            .on('error', (err) => {
                console.error('Error generating thumbnail:', err);
                // Fallback: create a placeholder thumbnail
                createPlaceholderThumbnail(thumbnailPath)
                    .then(() => resolve(thumbnailPath))
                    .catch(() => reject(err));
            })
            .screenshots({
                timestamps: ['00:00:01'],
                filename: outputFilename,
                folder: path.dirname(thumbnailPath),
                size: '320x180'
            });
    });
};

// Create placeholder thumbnail (fallback)
const createPlaceholderThumbnail = async (thumbnailPath) => {
    const sharp = require('sharp');

    await sharp({
        create: {
            width: 320,
            height: 180,
            channels: 3,
            background: { r: 45, g: 55, b: 72 } // Dark gray
        }
    })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

    return thumbnailPath;
};

// Get video metadata
const getVideoMetadata = async (videoPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

            resolve({
                duration: parseFloat(metadata.format.duration) || 0,
                size: parseInt(metadata.format.size) || 0,
                format: metadata.format.format_name || 'unknown',
                resolution: {
                    width: videoStream?.width || 0,
                    height: videoStream?.height || 0
                },
                bitrate: parseInt(metadata.format.bit_rate) || 0,
                codec: videoStream?.codec_name || 'unknown',
                hasAudio: !!audioStream
            });
        });
    });
};

// Optimize video for web
const optimizeVideo = async (inputPath, outputPath, quality = 'medium') => {
    const presets = {
        low: { size: '640x360', bitrate: '500k' },
        medium: { size: '1280x720', bitrate: '1500k' },
        high: { size: '1920x1080', bitrate: '4000k' }
    };

    const preset = presets[quality] || presets.medium;

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .size(preset.size)
            .videoBitrate(preset.bitrate)
            .audioCodec('aac')
            .audioBitrate('128k')
            .fps(30)
            .on('start', (commandLine) => {
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                }
            })
            .on('end', () => {
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error optimizing video:', err);
                reject(err);
            })
            .run();
    });
};

// Clean up temporary files
const cleanupTempFiles = async (req, res, next) => {
    try {
        const tempDir = path.join(__dirname, '..', 'public/uploads/temp');
        if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            const now = Date.now();

            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                try {
                    const stats = fs.statSync(filePath);

                    // Delete files older than 1 hour
                    if (now - stats.mtimeMs > 3600000) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    console.error(`Error cleaning file ${file}:`, err);
                }
            });
        }
    } catch (error) {
        console.error('Error in cleanupTempFiles:', error);
    }
    next();
};

// Validate uploaded file
const validateUploadedFile = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    // Check file extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.mov', '.avi', '.webm', '.ogg', '.mkv'];

    if (!allowedExts.includes(ext)) {
        // Delete the uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(400).json({
            success: false,
            message: `File type not allowed. Allowed types: ${allowedExts.join(', ')}`
        });
    }

    next();
};

// Middleware to handle multer errors
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 500MB'
            });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 5 files'
            });
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Invalid field name for file upload'
            });
        }
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
        });
    }

    next();
};
// Ensure upload directories exist
const ensureUploadDirs = () => {
    const dirs = [
        'uploads/videos/original',
        'uploads/thumbnails',
        'uploads/videos/optimized'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

ensureUploadDirs();

// Video storage configuration
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, 'uploads/videos/original');
        } else if (file.fieldname === 'thumbnail') {
            cb(null, 'uploads/thumbnails');
        } else if (file.fieldname === 'videos') {
            cb(null, 'uploads/videos/original');
        } else if (file.fieldname === 'thumbnails') {
            cb(null, 'uploads/thumbnails');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);

        if (file.fieldname === 'video' || file.fieldname === 'videos') {
            cb(null, `video_${uniqueSuffix}${ext}`);
        } else {
            cb(null, `thumb_${uniqueSuffix}.jpg`); // Always save as JPG for consistency
        }
    }
});

// Create multer instances
const uploadVideoWithThumbnail = multer({
    storage: videoStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB for videos
        files: 2 // Max 2 files (video + thumbnail)
    }
}).fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]);

const uploadMultipleVideos = multer({
    storage: videoStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB per file
        files: 10 // Max 10 files total (5 videos + 5 thumbnails)
    }
}).fields([
    { name: 'videos', maxCount: 5 },
    { name: 'thumbnails', maxCount: 5 }
]);

const uploadThumbnail = multer({
    storage: videoStorage,
    fileFilter: (req, file, cb) => {
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
            cb(new Error('Only image files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB for thumbnails
    }
}).single('thumbnail');
module.exports = {
    uploadSingle,
    uploadMultiple,
    generateThumbnail,
    getVideoMetadata,
    optimizeVideo,
    cleanupTempFiles,
    validateUploadedFile,
    handleMulterErrors,
    uploadVideoWithThumbnail,
    uploadMultipleVideos,
    uploadThumbnail,
    // For backward compatibility
    uploadVideo: upload,
    upload
};