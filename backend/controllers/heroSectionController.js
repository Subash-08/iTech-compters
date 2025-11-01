const HeroSection = require('../models/HeroSection');
const fs = require('fs');
const path = require('path');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

// Helper function to get image URL
const getImageUrl = (filename) => {
    return `/uploads/hero-slides/${filename}`;
};

// Helper function to delete image file
const deleteImageFile = (imagePath) => {
    if (imagePath) {
        const filename = imagePath.split('/').pop();
        const fullPath = path.join(__dirname, `../public/uploads/hero-slides/${filename}`);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return true;
        }
    }
    return false;
};

// Create new hero section
exports.createHeroSection = catchAsyncErrors(async (req, res, next) => {
    const { name, autoPlay, autoPlaySpeed, transitionEffect } = req.body;

    const heroSection = await HeroSection.create({
        name,
        autoPlay: autoPlay || true,
        autoPlaySpeed: autoPlaySpeed || 5000,
        transitionEffect: transitionEffect || 'slide',
        slides: []
    });

    res.status(201).json({
        success: true,
        message: 'Hero section created successfully',
        data: heroSection
    });
});

// Add slide to hero section
exports.addSlide = catchAsyncErrors(async (req, res, next) => {
    const { heroSectionId } = req.params;
    const {
        title,
        subtitle,
        description,
        buttonText,
        buttonLink,
        backgroundColor,
        textColor,
        order,
        startDate,
        endDate
    } = req.body;

    // Find hero section
    const heroSection = await HeroSection.findById(heroSectionId);
    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    // Handle image upload
    let imagePath = '';
    if (req.file) {
        imagePath = getImageUrl(req.file.filename);
    } else {
        return next(new ErrorHandler('Image is required', 400));
    }

    // Create new slide
    const newSlide = {
        title,
        subtitle,
        description,
        buttonText,
        buttonLink,
        backgroundColor,
        textColor,
        image: imagePath,
        order: order || heroSection.slides.length,
        startDate,
        endDate
    };

    heroSection.slides.push(newSlide);
    await heroSection.save();

    res.status(201).json({
        success: true,
        message: 'Slide added successfully',
        data: heroSection
    });
});

// Get all active hero sections with active slides
exports.getActiveHeroSections = catchAsyncErrors(async (req, res, next) => {
    const now = new Date();

    const heroSections = await HeroSection.aggregate([
        {
            $match: {
                isActive: true
            }
        },
        {
            $addFields: {
                slides: {
                    $filter: {
                        input: "$slides",
                        as: "slide",
                        cond: {
                            $and: [
                                { $eq: ["$$slide.isActive", true] },
                                {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: [{ $ifNull: ["$$slide.startDate", null] }, null] },
                                                { $eq: [{ $ifNull: ["$$slide.endDate", null] }, null] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $lte: [{ $ifNull: ["$$slide.startDate", now] }, now] },
                                                { $gte: [{ $ifNull: ["$$slide.endDate", now] }, now] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                "slides.0": { $exists: true }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    res.status(200).json({
        success: true,
        count: heroSections.length,
        data: heroSections
    });
});

// Get all hero sections (for admin)
exports.getAllHeroSections = catchAsyncErrors(async (req, res, next) => {
    const heroSections = await HeroSection.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: heroSections.length,
        data: heroSections
    });
});

// Get hero section by ID
exports.getHeroSectionById = catchAsyncErrors(async (req, res, next) => {
    const heroSection = await HeroSection.findById(req.params.id);

    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    res.status(200).json({
        success: true,
        data: heroSection
    });
});

// Update slide
exports.updateSlide = catchAsyncErrors(async (req, res, next) => {
    const { heroSectionId, slideId } = req.params;
    const updateData = { ...req.body };

    const heroSection = await HeroSection.findById(heroSectionId);
    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    const slide = heroSection.slides.id(slideId);
    if (!slide) {
        return next(new ErrorHandler('Slide not found', 404));
    }

    // Handle image update
    if (req.file) {
        // Delete old image file
        deleteImageFile(slide.image);

        // Update with new image path
        updateData.image = getImageUrl(req.file.filename);
    }

    // Update slide fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
            slide[key] = updateData[key];
        }
    });

    await heroSection.save();

    res.status(200).json({
        success: true,
        message: 'Slide updated successfully',
        data: heroSection
    });
});

// Delete slide
exports.deleteSlide = catchAsyncErrors(async (req, res, next) => {
    const { heroSectionId, slideId } = req.params;

    const heroSection = await HeroSection.findById(heroSectionId);
    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    const slide = heroSection.slides.id(slideId);
    if (!slide) {
        return next(new ErrorHandler('Slide not found', 404));
    }

    // Delete image file
    deleteImageFile(slide.image);

    // Remove slide
    heroSection.slides.pull(slideId);
    await heroSection.save();

    res.status(200).json({
        success: true,
        message: 'Slide deleted successfully',
        data: heroSection
    });
});

// Update hero section settings
exports.updateHeroSection = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;

    const heroSection = await HeroSection.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    );

    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Hero section updated successfully',
        data: heroSection
    });
});

// Reorder slides
exports.reorderSlides = catchAsyncErrors(async (req, res, next) => {
    const { heroSectionId } = req.params;
    const { slidesOrder } = req.body;

    const heroSection = await HeroSection.findById(heroSectionId);
    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    // Create a map for quick lookup
    const slideMap = new Map();
    heroSection.slides.forEach(slide => {
        slideMap.set(slide._id.toString(), slide);
    });

    // Reorder slides based on provided order
    const orderedSlides = [];
    slidesOrder.forEach((slideId, index) => {
        const slide = slideMap.get(slideId);
        if (slide) {
            slide.order = index;
            orderedSlides.push(slide);
        }
    });

    heroSection.slides = orderedSlides;
    await heroSection.save();

    res.status(200).json({
        success: true,
        message: 'Slides reordered successfully',
        data: heroSection
    });
});

// Toggle slide active status
exports.toggleSlideActive = catchAsyncErrors(async (req, res, next) => {
    const { heroSectionId, slideId } = req.params;

    const heroSection = await HeroSection.findById(heroSectionId);
    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    const slide = heroSection.slides.id(slideId);
    if (!slide) {
        return next(new ErrorHandler('Slide not found', 404));
    }

    slide.isActive = !slide.isActive;
    await heroSection.save();

    res.status(200).json({
        success: true,
        message: `Slide ${slide.isActive ? 'activated' : 'deactivated'} successfully`,
        data: heroSection
    });
});