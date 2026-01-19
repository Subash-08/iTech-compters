const HeroSection = require('../models/HeroSection');
const Video = require('../models/Video');
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

// Helper function to get video details
const getVideoDetails = async (videoId) => {
    try {
        const video = await Video.findById(videoId)
            .select('title description url thumbnailUrl durationFormatted optimizedUrl');
        if (!video) return null;

        return {
            videoUrl: video.optimizedUrl || video.url,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.durationFormatted,
            title: video.title,
            description: video.description
        };
    } catch (error) {
        console.error('Error fetching video details:', error);
        return null;
    }
};

// Create new hero section
exports.createHeroSection = catchAsyncErrors(async (req, res, next) => {
    const { name, autoPlay, autoPlaySpeed, transitionEffect, showNavigation, showPagination, order } = req.body;

    // Get next order if not provided
    let sectionOrder = order;
    if (order === undefined) {
        const lastSection = await HeroSection.findOne().sort('-order');
        sectionOrder = lastSection ? lastSection.order + 1 : 0;
    }

    const heroSection = await HeroSection.create({
        name,
        autoPlay: autoPlay !== undefined ? autoPlay : true,
        autoPlaySpeed: autoPlaySpeed || 5000,
        transitionEffect: transitionEffect || 'slide',
        showNavigation: showNavigation !== undefined ? showNavigation : true,
        showPagination: showPagination !== undefined ? showPagination : true,
        order: sectionOrder,
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
        endDate,
        mediaType = 'image',
        videoId,
        videoSettings
    } = req.body;

    // Find hero section
    const heroSection = await HeroSection.findById(heroSectionId);
    if (!heroSection) {
        return next(new ErrorHandler('Hero section not found', 404));
    }

    // Validate media type
    if (!['image', 'video'].includes(mediaType)) {
        return next(new ErrorHandler('Invalid media type. Must be "image" or "video"', 400));
    }

    let slideData = {
        title: title || '',
        subtitle: subtitle || '',
        description: description || '',
        buttonText: buttonText || '',
        buttonLink: buttonLink || '',
        backgroundColor: backgroundColor || '',
        textColor: textColor || '#000000',
        mediaType,
        order: order !== undefined ? parseInt(order) : heroSection.slides.length,
        startDate: startDate || null,
        endDate: endDate || null
    };

    // Handle different media types
    if (mediaType === 'image') {
        if (!req.file) {
            return next(new ErrorHandler('Image is required for image slides', 400));
        }
        slideData.image = getImageUrl(req.file.filename);

    } else if (mediaType === 'video') {
        if (!videoId) {
            return next(new ErrorHandler('Video ID is required for video slides', 400));
        }

        // Get video details from Video model
        const videoDetails = await getVideoDetails(videoId);
        if (!videoDetails) {
            return next(new ErrorHandler('Video not found', 404));
        }

        slideData.videoId = videoId;
        slideData.videoUrl = videoDetails.videoUrl;
        slideData.thumbnailUrl = videoDetails.thumbnailUrl;
        slideData.duration = videoDetails.duration;

        // Set video settings
        slideData.videoSettings = {
            autoplay: videoSettings?.autoplay !== undefined ? videoSettings.autoplay === 'true' : true,
            loop: videoSettings?.loop !== undefined ? videoSettings.loop === 'true' : true,
            muted: videoSettings?.muted !== undefined ? videoSettings.muted === 'true' : true,
            controls: videoSettings?.controls !== undefined ? videoSettings.controls === 'true' : false,
            playsInline: videoSettings?.playsInline !== undefined ? videoSettings.playsInline === 'true' : true
        };
    }

    heroSection.slides.push(slideData);
    await heroSection.save();

    // Populate video details if using videoId
    if (slideData.videoId) {
        await heroSection.populate({
            path: 'slides.videoId',
            select: 'title description url thumbnailUrl durationFormatted optimizedUrl'
        });
    }

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
            $sort: { order: 1, createdAt: -1 }
        }
    ]);

    // Populate video details for slides with videoId
    for (let section of heroSections) {
        for (let slide of section.slides) {
            if (slide.videoId) {
                const video = await Video.findById(slide.videoId)
                    .select('title description url thumbnailUrl durationFormatted optimizedUrl');
                if (video) {
                    slide.videoDetails = video;
                }
            }
        }
    }

    res.status(200).json({
        success: true,
        count: heroSections.length,
        data: heroSections
    });
});

// Get all hero sections (for admin)
exports.getAllHeroSections = catchAsyncErrors(async (req, res, next) => {
    const heroSections = await HeroSection.find()
        .sort({ order: 1, createdAt: -1 })
        .populate({
            path: 'slides.videoId',
            select: 'title description url thumbnailUrl durationFormatted optimizedUrl',
            options: { allowNull: true }
        });

    res.status(200).json({
        success: true,
        count: heroSections.length,
        data: heroSections
    });
});

// Get hero section by ID
exports.getHeroSectionById = catchAsyncErrors(async (req, res, next) => {

    const heroSection = await HeroSection.findById(req.params.id)
        .populate({
            path: 'slides.videoId',
            select: 'title description url thumbnailUrl durationFormatted optimizedUrl',
            options: { allowNull: true }
        });

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

    // Handle media type changes
    if (updateData.mediaType && updateData.mediaType !== slide.mediaType) {
        // If changing from image to video, clean up image
        if (slide.mediaType === 'image' && updateData.mediaType === 'video') {
            deleteImageFile(slide.image);
            slide.image = '';
        }
        // If changing from video to image, clean up video data
        else if (slide.mediaType === 'video' && updateData.mediaType === 'image') {
            slide.videoId = null;
            slide.videoUrl = '';
            slide.thumbnailUrl = '';
            slide.duration = '';
        }
        slide.mediaType = updateData.mediaType;
    }

    // Handle image update
    if (req.file && slide.mediaType === 'image') {
        // Delete old image file
        deleteImageFile(slide.image);
        // Update with new image path
        slide.image = getImageUrl(req.file.filename);
    }

    // Handle video updates
    if (slide.mediaType === 'video' && updateData.videoId) {
        if (updateData.videoId !== slide.videoId?.toString()) {
            const videoDetails = await getVideoDetails(updateData.videoId);
            if (!videoDetails) {
                return next(new ErrorHandler('Video not found', 404));
            }
            slide.videoId = updateData.videoId;
            slide.videoUrl = videoDetails.videoUrl;
            slide.thumbnailUrl = videoDetails.thumbnailUrl;
            slide.duration = videoDetails.duration;
        }

        // Update video settings
        if (updateData.videoSettings) {
            slide.videoSettings = {
                ...slide.videoSettings,
                autoplay: updateData.videoSettings.autoplay === 'true',
                loop: updateData.videoSettings.loop === 'true',
                muted: updateData.videoSettings.muted === 'true',
                controls: updateData.videoSettings.controls === 'true',
                playsInline: updateData.videoSettings.playsInline === 'true'
            };
        }
    }

    // Update other slide fields
    const fieldsToUpdate = [
        'title', 'subtitle', 'description', 'buttonText', 'buttonLink',
        'backgroundColor', 'textColor', 'order', 'isActive',
        'startDate', 'endDate'
    ];

    fieldsToUpdate.forEach(field => {
        if (updateData[field] !== undefined) {
            slide[field] = updateData[field];
        }
    });

    await heroSection.save();

    // Populate video details if needed
    if (slide.videoId) {
        await heroSection.populate({
            path: 'slides.videoId',
            select: 'title description url thumbnailUrl durationFormatted optimizedUrl'
        });
    }

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

    // Delete image file if exists
    if (slide.mediaType === 'image' && slide.image) {
        deleteImageFile(slide.image);
    }

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
    ).populate({
        path: 'slides.videoId',
        select: 'title description url thumbnailUrl durationFormatted optimizedUrl',
        options: { allowNull: true }
    });

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

    // Populate video details
    await heroSection.populate({
        path: 'slides.videoId',
        select: 'title description url thumbnailUrl durationFormatted optimizedUrl',
        options: { allowNull: true }
    });

    res.status(200).json({
        success: true,
        message: 'Slides reordered successfully',
        data: heroSection
    });
});

// Toggle slide active status
exports.toggleSlideActive = catchAsyncErrors(async (req, res, next) => {
    const { heroSectionId, slideId } = req.params;

    const heroSection = await HeroSection.findById(heroSectionId)
        .populate({
            path: 'slides.videoId',
            select: 'title description url thumbnailUrl durationFormatted optimizedUrl',
            options: { allowNull: true }
        });

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
exports.getAvailableVideos = catchAsyncErrors(async (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Video.countDocuments(filter);

        // Remove durationFormatted from select - it's a virtual field
        const videos = await Video.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('_id title description url thumbnailUrl duration optimizedUrl createdAt'); // Removed durationFormatted

        res.status(200).json({
            success: true,
            data: {
                videos,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get available videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available videos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

exports.reorderHeroSections = catchAsyncErrors(async (req, res, next) => {
    const { sectionsOrder } = req.body;

    if (!Array.isArray(sectionsOrder)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid order data - sectionsOrder must be an array'
        });
    }

    try {
        // Update each section's order
        const updatePromises = sectionsOrder.map((sectionId, index) => {
            return HeroSection.findByIdAndUpdate(
                sectionId,
                { order: index },
                { new: true, runValidators: true }
            );
        });

        await Promise.all(updatePromises);

        // Get all sections sorted by order
        const updatedSections = await HeroSection.find()
            .sort({ order: 1 })
            .populate({
                path: 'slides.videoId',
                select: 'title description url thumbnailUrl durationFormatted optimizedUrl',
                options: { allowNull: true }
            });

        res.status(200).json({
            success: true,
            message: 'Hero sections reordered successfully',
            data: updatedSections
        });
    } catch (error) {
        console.error('Reorder hero sections error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder hero sections',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});