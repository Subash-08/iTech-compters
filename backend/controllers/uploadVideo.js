// backend/middleware/uploadVideo.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

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
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createDirectories();

// Configure storage for original videos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/videos/original');
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        const filename = `video_${uniqueId}${extension}`;
        cb(null, filename);
    }
});

// File filter for video files
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/ogg'
    ];

    const allowedExtensions = ['.mp4', '.mpeg', '.mov', '.avi', '.webm', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} are allowed.`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
        files: 5 // Max 5 files at once
    }
});

// Generate thumbnail from video
const generateThumbnail = async (videoPath, filename) => {
    try {
        const thumbnailPath = `uploads/thumbnails/${path.basename(filename, path.extname(filename))}.jpg`;

        // Using sharp for image processing (you might need ffmpeg for video frames)
        // This is a simplified version - in production, use ffmpeg
        await sharp({
            create: {
                width: 320,
                height: 180,
                channels: 3,
                background: { r: 0, g: 0, b: 0 }
            }
        })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        return thumbnailPath;
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return '';
    }
};

// Clean up temp files middleware
const cleanupTempFiles = async (req, res, next) => {
    try {
        if (req.files) {
            const tempDir = 'uploads/temp';
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                const now = Date.now();

                files.forEach(file => {
                    const filePath = path.join(tempDir, file);
                    const stats = fs.statSync(filePath);

                    // Delete files older than 1 hour
                    if (now - stats.mtimeMs > 3600000) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error cleaning temp files:', error);
    }
    next();
};

module.exports = {
    uploadVideo: upload,
    generateThumbnail,
    cleanupTempFiles,
    uploadMultiple: upload.array('videos', 5),
    uploadSingle: upload.single('video')
};