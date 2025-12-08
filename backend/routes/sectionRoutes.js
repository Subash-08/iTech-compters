// backend/routes/sectionRoutes.js
const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { validateSection, validateVideoReorder } = require('../middlewares/validateVideo');

// Public routes (for homepage)
router.get('/visible', sectionController.getVisibleSections);

// Admin routes
router.post('/',
    validateSection,
    sectionController.createSection
);

router.get('/', sectionController.getAllSections);
router.get('/:id', sectionController.getSectionById);
router.put('/:id',
    validateSection,
    sectionController.updateSection
);
router.delete('/:id', sectionController.deleteSection);

// Video management within sections
router.put('/:sectionId/videos',
    sectionController.addVideoToSection
);

router.delete('/:sectionId/videos/:videoId',
    sectionController.removeVideoFromSection
);

router.put('/:sectionId/videos/:videoId',
    sectionController.updateVideoInSection
);

router.put('/:sectionId/reorder-videos',
    sectionController.reorderVideosInSection
);

// Reordering sections
router.put('/reorder-sections',
    validateVideoReorder,
    sectionController.reorderSections
);

module.exports = router;