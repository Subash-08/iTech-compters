// backend/routes/sectionRoutes.js
const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { validateSection, validateVideoReorder, validateSectionReorder } = require('../middlewares/validateVideo');

// ==========================================
// 1. Static & Specific Routes (MUST BE FIRST)
// ==========================================

// Public route for homepage
router.get('/visible', sectionController.getVisibleSections);

// Reordering sections 
// ⚠️ IMPORTANT: This must be defined BEFORE the '/:id' route
router.put('/reorder-sections',
    validateSectionReorder, // Ensure this middleware accepts { sections: [...] }
    sectionController.reorderSections
);

// ==========================================
// 2. General Root Routes
// ==========================================

router.get('/', sectionController.getAllSections);

router.post('/',
    validateSection,
    sectionController.createSection
);

// ==========================================
// 3. Dynamic ID Routes (/:id)
// ==========================================

router.get('/:id', sectionController.getSectionById);

router.put('/:id',
    validateSection,
    sectionController.updateSection
);

router.delete('/:id', sectionController.deleteSection);

// ==========================================
// 4. Video Management Sub-Routes
// ==========================================

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

module.exports = router;