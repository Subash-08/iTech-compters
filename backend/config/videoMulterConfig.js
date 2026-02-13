const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
const ensureUploadDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Storage configuration (Temporary storage before Cloudinary upload)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads/temp');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'video/mp4', 'video/webm', 'video/quicktime', // Videos
        'image/jpeg', 'image/png', 'image/webp'       // Thumbnails
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP4, WebM, MOV videos and JPEG, PNG, WebP images are allowed.'), false);
    }
};

// Multer upload instance
const videoUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
    }
});

module.exports = videoUpload;
