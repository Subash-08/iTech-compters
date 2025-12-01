// controllers/showcaseSectionController.js
const ShowcaseSection = require('../models/showcaseSection');
const Product = require('../models/productModel');
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Get all active showcase sections for frontend
// @route   GET /api/v1/showcase-sections
// @access  Public
exports.getActiveShowcaseSections = catchAsyncErrors(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        type,
        showOnHomepage
    } = req.query;

    const filter = {
        isActive: true,
        $or: [
            { 'visibility.endDate': { $exists: false } },
            { 'visibility.endDate': null },
            { 'visibility.endDate': { $gt: new Date() } }
        ]
    };

    // Filter by type
    if (type) {
        filter.type = type;
    }

    // Filter by homepage visibility
    if (showOnHomepage === 'true') {
        filter['visibility.showOnHomepage'] = true;
    }

    const skip = (page - 1) * limit;

    const sections = await ShowcaseSection.find(filter)
        .populate({
            path: 'products',
            match: { isActive: true, status: 'Published' },
            select: 'name slug images basePrice mrp discountPercentage stockQuantity averageRating totalReviews brand categories variants',
            populate: [
                { path: 'brand', select: 'name slug' },
                { path: 'categories', select: 'name slug' }
            ]
        })
        .select('-meta -visibility.showInCategory')
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    // Filter out sections with no active products
    const validSections = sections.filter(section =>
        section.products && section.products.length > 0
    );

    const totalSections = await ShowcaseSection.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: validSections.length,
        totalSections,
        totalPages: Math.ceil(totalSections / limit),
        currentPage: Number(page),
        sections: validSections
    });
});

// @desc    Get single showcase section by ID
// @route   GET /api/v1/showcase-sections/:id
// @access  Public
exports.getShowcaseSectionById = catchAsyncErrors(async (req, res, next) => {
    const section = await ShowcaseSection.findById(req.params.id)
        .populate({
            path: 'products',
            match: { isActive: true, status: 'Published' },
            select: 'name slug description images basePrice mrp discountPercentage stockQuantity averageRating totalReviews brand categories variants specifications features',
            populate: [
                { path: 'brand', select: 'name slug' },
                { path: 'categories', select: 'name slug' }
            ]
        });

    if (!section || !section.isActive) {
        return next(new ErrorHandler('Showcase section not found', 404));
    }

    // Update impressions
    section.meta.impressions += 1;
    await section.save();

    res.status(200).json({
        success: true,
        section
    });
});

// @desc    Get all showcase sections (Admin)
// @route   GET /api/v1/admin/showcase-sections
// @access  Private/Admin
exports.getAdminShowcaseSections = catchAsyncErrors(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search,
        status,
        type
    } = req.query;

    const filter = {};

    // Search filter
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { subtitle: { $regex: search, $options: 'i' } }
        ];
    }

    // Status filter
    if (status === 'active') {
        filter.isActive = true;
    } else if (status === 'inactive') {
        filter.isActive = false;
    }

    // Type filter
    if (type) {
        filter.type = type;
    }

    const skip = (page - 1) * limit;

    const sections = await ShowcaseSection.find(filter)
        .populate({
            path: 'products',
            select: 'name images basePrice stockQuantity'
        })
        .populate('meta.createdBy', 'name email')
        .populate('meta.updatedBy', 'name email')
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const totalSections = await ShowcaseSection.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: sections.length,
        totalSections,
        totalPages: Math.ceil(totalSections / limit),
        currentPage: Number(page),
        sections
    });
});

// @desc    Create new showcase section
// @route   POST /api/v1/admin/showcase-sections
// @access  Private/Admin
exports.createShowcaseSection = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        subtitle,
        type,
        products,
        displayOrder,
        isActive,
        showViewAll,
        viewAllLink,
        timerConfig,
        styleConfig,
        visibility
    } = req.body;

    // Validate products exist
    if (products && products.length > 0) {
        const validProducts = await Product.find({
            _id: { $in: products },
            isActive: true
        });

        if (validProducts.length !== products.length) {
            return next(new ErrorHandler('Some products are invalid or inactive', 400));
        }
    }

    const sectionData = {
        title,
        subtitle,
        type: type || 'grid',
        products: products || [],
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        showViewAll: showViewAll !== undefined ? showViewAll : true,
        viewAllLink,
        timerConfig: timerConfig || { hasTimer: false },
        styleConfig: styleConfig || {},
        visibility: visibility || {},
        meta: {
            createdBy: req.user._id,
            updatedBy: req.user._id
        }
    };

    const section = await ShowcaseSection.create(sectionData);

    res.status(201).json({
        success: true,
        message: 'Showcase section created successfully',
        section
    });
});

// @desc    Update showcase section
// @route   PUT /api/v1/admin/showcase-sections/:id
// @access  Private/Admin
exports.updateShowcaseSection = catchAsyncErrors(async (req, res, next) => {
    const section = await ShowcaseSection.findById(req.params.id);

    if (!section) {
        return next(new ErrorHandler('Showcase section not found', 404));
    }

    const {
        title,
        subtitle,
        type,
        products,
        displayOrder,
        isActive,
        showViewAll,
        viewAllLink,
        timerConfig,
        styleConfig,
        visibility
    } = req.body;

    // Validate products if provided
    if (products && products.length > 0) {
        const validProducts = await Product.find({
            _id: { $in: products },
            isActive: true
        });

        if (validProducts.length !== products.length) {
            return next(new ErrorHandler('Some products are invalid or inactive', 400));
        }
        section.products = products;
    }

    // Update fields
    if (title !== undefined) section.title = title;
    if (subtitle !== undefined) section.subtitle = subtitle;
    if (type !== undefined) section.type = type;
    if (displayOrder !== undefined) section.displayOrder = displayOrder;
    if (isActive !== undefined) section.isActive = isActive;
    if (showViewAll !== undefined) section.showViewAll = showViewAll;
    if (viewAllLink !== undefined) section.viewAllLink = viewAllLink;
    if (timerConfig !== undefined) section.timerConfig = { ...section.timerConfig, ...timerConfig };
    if (styleConfig !== undefined) section.styleConfig = { ...section.styleConfig, ...styleConfig };
    if (visibility !== undefined) section.visibility = { ...section.visibility, ...visibility };

    section.meta.updatedBy = req.user._id;

    await section.save();

    res.status(200).json({
        success: true,
        message: 'Showcase section updated successfully',
        section
    });
});

// @desc    Delete showcase section
// @route   DELETE /api/v1/admin/showcase-sections/:id
// @access  Private/Admin
exports.deleteShowcaseSection = catchAsyncErrors(async (req, res, next) => {
    const section = await ShowcaseSection.findById(req.params.id);

    if (!section) {
        return next(new ErrorHandler('Showcase section not found', 404));
    }

    await ShowcaseSection.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Showcase section deleted successfully'
    });
});

// @desc    Update section display order (bulk)
// @route   PUT /api/v1/admin/showcase-sections/display-order/bulk
// @access  Private/Admin
exports.bulkUpdateDisplayOrder = catchAsyncErrors(async (req, res, next) => {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
        return next(new ErrorHandler('Sections array is required', 400));
    }

    const bulkOperations = sections.map(section => ({
        updateOne: {
            filter: { _id: section.id },
            update: { displayOrder: section.displayOrder, 'meta.updatedBy': req.user._id }
        }
    }));

    await ShowcaseSection.bulkWrite(bulkOperations);

    res.status(200).json({
        success: true,
        message: 'Display order updated successfully'
    });
});

// @desc    Toggle section status
// @route   PUT /api/v1/admin/showcase-sections/:id/toggle-status
// @access  Private/Admin
exports.toggleSectionStatus = catchAsyncErrors(async (req, res, next) => {
    const section = await ShowcaseSection.findById(req.params.id);

    if (!section) {
        return next(new ErrorHandler('Showcase section not found', 404));
    }

    section.isActive = !section.isActive;
    section.meta.updatedBy = req.user._id;

    await section.save();

    res.status(200).json({
        success: true,
        message: `Section ${section.isActive ? 'activated' : 'deactivated'} successfully`,
        section
    });
});

// @desc    Record section click
// @route   POST /api/v1/showcase-sections/:id/click
// @access  Public
exports.recordSectionClick = catchAsyncErrors(async (req, res, next) => {
    const section = await ShowcaseSection.findById(req.params.id);

    if (!section || !section.isActive) {
        return next(new ErrorHandler('Showcase section not found', 404));
    }

    section.meta.clicks += 1;
    await section.save();

    res.status(200).json({
        success: true,
        message: 'Click recorded successfully'
    });
});