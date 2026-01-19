// backend/middlewares/validateVideo.js (FIXED VERSION)
const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    };
};

// Video upload validation - SIMPLIFIED VERSION
const validateVideoUpload = validate([
    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Title must be less than 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('tags')
        .optional()
        .customSanitizer(value => {
            if (!value) return [];
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                // If it's a string with commas, convert to array
                if (typeof value === 'string') {
                    return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                }
                return [];
            }
        })
]);

// Section validation
const validateSection = validate([
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title must be less than 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('layoutType')
        .isIn(['card', 'full-video', 'slider', 'grid', 'masonry', 'reels'])
        .withMessage('Invalid layout type'),
    body('visible')
        .optional()
        .isBoolean()
        .withMessage('Visible must be a boolean'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer')
]);

// Video reorder validation
const validateVideoReorder = validate([
    body('videos')
        .isArray()
        .withMessage('Videos must be an array'),
    body('videos.*.videoId')
        .isMongoId()
        .withMessage('Invalid video ID'),
    body('videos.*.order')
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer')
]);
const validateSectionReorder = async (req, res, next) => {
    await body('sections')
        .isArray({ min: 1 })
        .withMessage('sections must be an array')
        .run(req);

    await body('sections.*.id')
        .isMongoId()
        .withMessage('Invalid section id')
        .run(req);

    await body('sections.*.order')
        .isInt({ min: 0 })
        .withMessage('Order must be >= 0')
        .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    next();
};
module.exports = {
    validateVideoUpload,
    validateSection,
    validateVideoReorder,
    validate,
    validateSectionReorder
};