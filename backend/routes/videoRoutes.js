// backend/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const simpleVideoController = require('../controllers/simpleVideoController');

// Import from the correct location
const multerConfig = require('../config/multerConfig');


// Test route
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Video routes are working',
        videoFunctions: ['uploadVideoWithThumbnail', 'uploadMultipleVideos', 'updateThumbnail']
    });
});

// Upload single video with thumbnail
router.post('/upload-with-thumbnail',
    multerConfig.uploadVideoWithThumbnail,
    simpleVideoController.uploadVideoWithThumbnail
);

// Upload multiple videos with thumbnails
router.post('/upload-multiple-with-thumbnails',
    multerConfig.uploadMultipleVideos,
    simpleVideoController.uploadMultipleVideosWithThumbnails
);

// Update thumbnail for existing video
router.post('/:id/thumbnail',
    multerConfig.uploadThumbnail,
    simpleVideoController.updateThumbnail
);

// Regenerate thumbnail
router.post('/:id/regenerate-thumbnail',
    simpleVideoController.regenerateThumbnail
);

// Original endpoints (for backward compatibility)
router.post('/upload',
    multerConfig.uploadVideo,  // Using uploadVideo which is .single('video')
    simpleVideoController.uploadVideo
);

// For multiple uploads without thumbnails (backward compatibility)
router.post('/upload-multiple',
    (req, res, next) => {
        // Handle multiple videos without thumbnails
        const upload = multerConfig.uploadVideo.array('videos', 5);
        upload(req, res, next);
    },
    simpleVideoController.uploadMultipleVideos
);

// Other routes
router.get('/', simpleVideoController.getAllVideos);
router.get('/:id', simpleVideoController.getVideoById);
router.put('/:id', simpleVideoController.updateVideo);
router.delete('/:id', simpleVideoController.deleteVideo);

module.exports = router;