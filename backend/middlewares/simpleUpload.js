// backend/middlewares/simpleUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const imageThumbnail = require('image-thumbnail');

// Create directories
const createDirectories = () => {
    const dirs = [
        'uploads/videos',
        'uploads/thumbnails'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

createDirectories();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/videos');
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `video_${Date.now()}_${uniqueId.slice(0, 8)}${extension}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'video/mp4',
        'video/mpeg',
        'video/webm'
    ];

    const allowedExtensions = ['.mp4', '.mpeg', '.webm', '.mov', '.avi'];
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
        fileSize: 100 * 1024 * 1024, // 100MB max
        files: 1
    }
});

// Single upload
const uploadSingle = upload.single('video');

// Multiple upload
const uploadMultiple = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 5
    }
}).array('videos', 5);

// Create placeholder thumbnail
const createPlaceholderThumbnail = async (videoFilename) => {
    try {
        const thumbnailFilename = `thumb_${path.basename(videoFilename, path.extname(videoFilename))}.jpg`;
        const thumbnailPath = path.join(__dirname, '..', 'uploads/thumbnails', thumbnailFilename);

        // Create a simple colored rectangle as thumbnail
        const thumbnail = await imageThumbnail(null, {
            width: 320,
            height: 180,
            background: { r: 45, g: 55, b: 72, alpha: 1 },
            responseType: 'buffer',
            jpegOptions: { quality: 80 }
        });

        fs.writeFileSync(thumbnailPath, thumbnail);
        return thumbnailPath;
    } catch (error) {
        return '';
    }
};

// Get basic file metadata
const getFileMetadata = (filePath, file) => {
    const stats = fs.statSync(filePath);

    return {
        duration: 0, // We can't get duration without FFmpeg
        size: stats.size,
        format: path.extname(file.originalname).replace('.', ''),
        resolution: { width: 0, height: 0 },
        bitrate: 0,
        hasAudio: true
    };
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    createPlaceholderThumbnail,
    getFileMetadata,
    upload
};