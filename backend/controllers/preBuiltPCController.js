// controllers/preBuiltPCController.js
const PreBuiltPC = require("../models/preBuiltPCModel");
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");
const fs = require('fs');
const path = require('path');

// Helper function to delete local files
const deleteLocalFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Get Admin Pre-built PCs
exports.getAdminPreBuiltPCs = catchAsyncErrors(async (req, res, next) => {
    try {
        const resPerPage = parseInt(req.query.limit) || 12;

        let baseQuery = PreBuiltPC.find().populate('createdBy', 'name email');

        if (req.query.category) {
            baseQuery = baseQuery.where('category').equals(req.query.category);
        }

        if (req.query.status) {
            if (req.query.status === 'active') {
                baseQuery = baseQuery.where('isActive').equals(true);
            } else if (req.query.status === 'inactive') {
                baseQuery = baseQuery.where('isActive').equals(false);
            }
        }

        if (req.query.search) {
            baseQuery = baseQuery.or([
                { name: { $regex: req.query.search, $options: 'i' } },
                { category: { $regex: req.query.search, $options: 'i' } },
                { tags: { $in: [new RegExp(req.query.search, 'i')] } }
            ]);
        }

        if (req.query.minPrice || req.query.maxPrice) {
            const priceFilter = {};
            if (req.query.minPrice) {
                priceFilter.$gte = parseInt(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                priceFilter.$lte = parseInt(req.query.maxPrice);
            }
            baseQuery = baseQuery.where('totalPrice', priceFilter);
        }

        const preBuiltPCCount = await PreBuiltPC.countDocuments(baseQuery.getFilter());

        let sortBy = '-createdAt';
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price-asc':
                    sortBy = 'totalPrice';
                    break;
                case 'price-desc':
                    sortBy = '-totalPrice';
                    break;
                case 'name-asc':
                    sortBy = 'name';
                    break;
                case 'name-desc':
                    sortBy = '-name';
                    break;
                case 'rating':
                    sortBy = '-performanceRating';
                    break;
                default:
                    sortBy = '-createdAt';
            }
        }
        baseQuery = baseQuery.sort(sortBy);

        const currentPage = parseInt(req.query.page) || 1;
        const skip = resPerPage * (currentPage - 1);
        baseQuery = baseQuery.limit(resPerPage).skip(skip);

        const preBuiltPCs = await baseQuery.exec();

        res.status(200).json({
            success: true,
            count: preBuiltPCs.length,
            total: preBuiltPCCount,
            resPerPage,
            currentPage,
            data: preBuiltPCs
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Add to preBuiltPCController.js
exports.getPreBuiltPCAnalytics = catchAsyncErrors(async (req, res, next) => {
    const [
        totalPreBuiltPCs,
        activePreBuiltPCs,
        featuredPreBuiltPCs,
        pcsByCategory,
        performanceStats,
        priceRanges
    ] = await Promise.all([
        // Total pre-built PCs
        PreBuiltPC.countDocuments(),
        // Active pre-built PCs
        PreBuiltPC.countDocuments({ isActive: true }),
        // Featured pre-built PCs
        PreBuiltPC.countDocuments({ isFeatured: true }),
        // Pre-built PCs by category
        PreBuiltPC.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$totalPrice' }
                }
            },
            { $sort: { count: -1 } }
        ]),
        // Performance stats
        PreBuiltPC.aggregate([
            {
                $group: {
                    _id: null,
                    avgPerformanceRating: { $avg: '$performanceRating' },
                    maxPerformanceRating: { $max: '$performanceRating' },
                    minPerformanceRating: { $min: '$performanceRating' },
                    avgPrice: { $avg: '$totalPrice' },
                    totalValue: { $sum: '$totalPrice' }
                }
            }
        ]),
        // Price ranges
        PreBuiltPC.aggregate([
            {
                $bucket: {
                    groupBy: '$totalPrice',
                    boundaries: [0, 30000, 60000, 90000, 120000, 150000],
                    default: '150000+',
                    output: {
                        count: { $sum: 1 },
                        avgPerformance: { $avg: '$performanceRating' }
                    }
                }
            }
        ])
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalPreBuiltPCs,
            activePreBuiltPCs,
            inactivePreBuiltPCs: totalPreBuiltPCs - activePreBuiltPCs,
            featuredPreBuiltPCs,
            pcsByCategory: pcsByCategory.map(item => ({
                category: item._id,
                count: item.count,
                avgPrice: Math.round(item.avgPrice || 0)
            })),
            performanceStats: performanceStats[0] || {
                avgPerformanceRating: 0,
                maxPerformanceRating: 0,
                minPerformanceRating: 0,
                avgPrice: 0,
                totalValue: 0
            },
            priceRanges: priceRanges.map(range => ({
                range: range._id,
                count: range.count,
                avgPerformance: Math.round((range.avgPerformance || 0) * 100) / 100
            }))
        }
    });
});

// Update Pre-built PC - COMPLETE FIXED VERSION
exports.updatePreBuiltPC = catchAsyncErrors(async (req, res, next) => {
    try {
        Object.keys(req.body).forEach(key => {
            if (key === 'components' || key === 'tags') {
                // Debug logging for complex fields
            } else {
                // Debug logging for simple fields
            }
        });

        let preBuiltPC = await PreBuiltPC.findById(req.params.id);
        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        // Create update data from req.body
        const updateData = { ...req.body };

        // ✅ HANDLE PRICING FIELDS - BOTH OLD AND NEW
        // Calculate prices from either new or old structure
        const basePrice = req.body.basePrice ? parseFloat(req.body.basePrice) :
            (req.body.totalPrice ? parseFloat(req.body.totalPrice) : preBuiltPC.basePrice);

        const offerPrice = req.body.offerPrice ? parseFloat(req.body.offerPrice) :
            (req.body.discountPrice ? parseFloat(req.body.discountPrice) : preBuiltPC.offerPrice);

        // Calculate discount percentage
        const discountPercentage = offerPrice < basePrice
            ? Math.round(((basePrice - offerPrice) / basePrice) * 100)
            : 0;

        // ✅ SET ALL PRICING FIELDS
        updateData.basePrice = basePrice;
        updateData.offerPrice = offerPrice;
        updateData.discountPercentage = discountPercentage;

        // ✅ SET OLD PRICING FIELDS FOR BACKWARD COMPATIBILITY
        updateData.totalPrice = basePrice; // totalPrice = basePrice
        updateData.discountPrice = offerPrice; // discountPrice = offerPrice

        // ✅ HANDLE NEW PRODUCT COMPATIBILITY FIELDS
        if (req.body.condition) {
            updateData.condition = req.body.condition;
        } else if (!preBuiltPC.condition) {
            updateData.condition = 'New'; // Default value
        }

        if (req.body.averageRating !== undefined) {
            updateData.averageRating = parseFloat(req.body.averageRating) || 0;
        } else if (!preBuiltPC.averageRating) {
            updateData.averageRating = 0; // Default value
        }

        if (req.body.totalReviews !== undefined) {
            updateData.totalReviews = parseInt(req.body.totalReviews) || 0;
        } else if (!preBuiltPC.totalReviews) {
            updateData.totalReviews = 0; // Default value
        }

        // Parse components if they exist
        if (req.body.components) {
            try {
                updateData.components = typeof req.body.components === 'string'
                    ? JSON.parse(req.body.components)
                    : req.body.components;
                if (!Array.isArray(updateData.components)) {
                    return next(new ErrorHandler('Components must be an array', 400));
                }
            } catch (error) {
                console.error('Components parse error:', error);
                return next(new ErrorHandler('Invalid components format', 400));
            }
        }

        // Parse tags if they exist
        if (req.body.tags) {
            try {
                updateData.tags = typeof req.body.tags === 'string'
                    ? JSON.parse(req.body.tags)
                    : req.body.tags;
                if (!Array.isArray(updateData.tags)) {
                    updateData.tags = typeof req.body.tags === 'string'
                        ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                        : [];
                }
            } catch (error) {
                console.error('Tags parse error:', error);
                updateData.tags = typeof req.body.tags === 'string'
                    ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                    : [];
            }
        }

        // Process main images
        if (req.files && req.files.images) {
            const imagesArray = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            const newImages = [];

            for (let i = 0; i < imagesArray.length; i++) {
                const file = imagesArray[i];
                newImages.push({
                    public_id: file.filename,
                    url: `/uploads/prebuilt-pcs/${file.filename}`
                });
            }

            // Handle existing images logic
            if (req.body.existingImages) {
                try {
                    const existingImages = typeof req.body.existingImages === 'string'
                        ? JSON.parse(req.body.existingImages)
                        : req.body.existingImages;

                    if (Array.isArray(existingImages)) {
                        updateData.images = [...existingImages, ...newImages];
                    } else {
                        updateData.images = newImages;
                    }
                } catch (error) {
                    console.error('Existing images parse error:', error);
                    updateData.images = newImages;
                }
            } else if (preBuiltPC.images && preBuiltPC.images.length > 0) {
                updateData.images = [...preBuiltPC.images, ...newImages];
            } else {
                updateData.images = newImages;
            }
        } else if (req.body.existingImages) {
            // Only update existing images if no new images are uploaded
            try {
                const existingImages = typeof req.body.existingImages === 'string'
                    ? JSON.parse(req.body.existingImages)
                    : req.body.existingImages;

                if (Array.isArray(existingImages)) {
                    updateData.images = existingImages;
                }
            } catch (error) {
                console.error('Existing images parse error:', error);
                // Keep current images if parsing fails
            }
        }

        // Process component images
        if (req.files && req.files.componentImages) {
            const componentImageIndexes = req.body.componentImageIndexes
                ? (Array.isArray(req.body.componentImageIndexes)
                    ? req.body.componentImageIndexes
                    : [req.body.componentImageIndexes])
                : [];

            const componentImageFiles = Array.isArray(req.files.componentImages)
                ? req.files.componentImages
                : [req.files.componentImages];

            if (updateData.components && Array.isArray(updateData.components)) {
                for (let i = 0; i < componentImageIndexes.length; i++) {
                    const index = parseInt(componentImageIndexes[i]);
                    const file = componentImageFiles[i];

                    if (!isNaN(index) && updateData.components[index] && file) {
                        updateData.components[index].image = {
                            public_id: file.filename,
                            url: `/uploads/prebuilt-pcs/${file.filename}`
                        };
                    }
                }
            }
        }

        // Handle numeric fields
        if (req.body.stockQuantity !== undefined) {
            updateData.stockQuantity = parseInt(req.body.stockQuantity);
        }

        if (req.body.performanceRating !== undefined) {
            updateData.performanceRating = parseInt(req.body.performanceRating) || 5;
        }

        // Handle boolean fields
        if (req.body.featured !== undefined) {
            updateData.featured = req.body.featured === 'true' || req.body.featured === true;
        }

        if (req.body.isActive !== undefined) {
            updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
        }

        if (req.body.isTested !== undefined) {
            updateData.isTested = req.body.isTested === 'true' || req.body.isTested === true;
        }

        // Handle slug generation if name changed
        if (req.body.name && req.body.name !== preBuiltPC.name) {
            const generateSlug = (name) => {
                return name
                    .toLowerCase()
                    .replace(/[^a-zA-Z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            };
            updateData.slug = generateSlug(req.body.name);
        }

        // Handle warranty
        if (req.body.warranty) {
            updateData.warranty = req.body.warranty;
        }

        // Handle description fields
        if (req.body.shortDescription !== undefined) {
            updateData.shortDescription = req.body.shortDescription;
        }

        // Clean up undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        // Perform the update
        preBuiltPC = await PreBuiltPC.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
                useFindAndModify: false
            }
        );

        // Populate the response with all necessary fields
        const updatedPC = await PreBuiltPC.findById(req.params.id)
            .populate('createdBy', 'name email')
            .select('-__v');

        res.status(200).json({
            success: true,
            message: 'Pre-built PC updated successfully',
            data: updatedPC
        });

    } catch (error) {
        console.error('💥 Update PC error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new ErrorHandler(messages.join(', '), 400));
        }

        if (error.code === 11000) {
            return next(new ErrorHandler('Pre-built PC with this name already exists', 400));
        }

        if (error.name === 'CastError') {
            return next(new ErrorHandler('Invalid Pre-built PC ID', 400));
        }

        return next(new ErrorHandler(error.message, 500));
    }
});

// controllers/preBuiltPCController.js - Updated create function
exports.createPreBuiltPC = catchAsyncErrors(async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return next(new ErrorHandler('Form data not received. Please check file upload configuration.', 400));
        }

        // ✅ UPDATE: Check for both basePrice and totalPrice for backward compatibility
        const requiredFields = ['name', 'category', 'description', 'stockQuantity'];

        // Check if we have either basePrice or totalPrice
        if (!req.body.basePrice && !req.body.totalPrice) {
            return next(new ErrorHandler('Missing required field: basePrice or totalPrice', 400));
        }

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return next(new ErrorHandler(`Missing required fields: ${missingFields.join(', ')}`, 400));
        }

        let components = [];
        if (req.body.components) {
            try {
                components = typeof req.body.components === 'string'
                    ? JSON.parse(req.body.components)
                    : req.body.components;
                if (!Array.isArray(components)) {
                    return next(new ErrorHandler('Components must be an array', 400));
                }
            } catch (parseError) {
                console.error('❌ Components parse error:', parseError);
                return next(new ErrorHandler('Invalid components format', 400));
            }
        } else {
            return next(new ErrorHandler('Components are required', 400));
        }

        // ✅ UPDATE: Handle both pricing structures
        // Use basePrice if provided, otherwise fall back to totalPrice
        const basePrice = req.body.basePrice ? parseFloat(req.body.basePrice) : parseFloat(req.body.totalPrice);
        const offerPrice = req.body.offerPrice ? parseFloat(req.body.offerPrice) :
            (req.body.discountPrice ? parseFloat(req.body.discountPrice) : basePrice);

        const discountPercentage = offerPrice < basePrice
            ? Math.round(((basePrice - offerPrice) / basePrice) * 100)
            : 0;

        // Rest of your processing logic remains the same...
        let tags = [];
        if (req.body.tags) {
            try {
                tags = typeof req.body.tags === 'string'
                    ? JSON.parse(req.body.tags)
                    : req.body.tags;

                if (!Array.isArray(tags)) {
                    tags = typeof req.body.tags === 'string'
                        ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                        : [];
                }
            } catch (parseError) {
                tags = typeof req.body.tags === 'string'
                    ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                    : [];
            }
        }

        // Process main images
        const images = [];
        if (req.files && req.files.images) {
            const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            for (const file of imageFiles) {
                images.push({
                    public_id: file.filename,
                    url: `/uploads/prebuilt-pcs/${file.filename}`
                });
            }
        }

        if (req.files && req.files.componentImages) {
            const componentImageIndexes = req.body.componentImageIndexes
                ? (Array.isArray(req.body.componentImageIndexes)
                    ? req.body.componentImageIndexes
                    : [req.body.componentImageIndexes])
                : [];

            const componentImageFiles = Array.isArray(req.files.componentImages)
                ? req.files.componentImages
                : [req.files.componentImages];

            for (let i = 0; i < componentImageIndexes.length; i++) {
                const index = parseInt(componentImageIndexes[i]);
                const file = componentImageFiles[i];

                if (!isNaN(index) && components[index] && file) {
                    components[index].image = {
                        public_id: file.filename,
                        url: `/uploads/prebuilt-pcs/${file.filename}`
                    };
                }
            }
        }

        const generateSlug = (name) => {
            return name
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        };

        // ✅ UPDATE: Include all new fields in the data object
        const preBuiltPCData = {
            name: req.body.name,
            slug: generateSlug(req.body.name),
            category: req.body.category,
            description: req.body.description,
            shortDescription: req.body.shortDescription || '',
            tags: tags,
            components: components,
            images: images.length > 0 ? images : [{
                public_id: 'default-pc',
                url: '/uploads/default-pc.jpg'
            }],
            // ✅ NEW PRICING FIELDS
            basePrice: basePrice,
            offerPrice: offerPrice,
            discountPercentage: discountPercentage,
            condition: req.body.condition || 'New',
            averageRating: req.body.averageRating ? parseFloat(req.body.averageRating) : 0,
            totalReviews: req.body.totalReviews ? parseInt(req.body.totalReviews) : 0,
            // ✅ OLD FIELDS FOR BACKWARD COMPATIBILITY
            totalPrice: basePrice, // Set totalPrice = basePrice
            discountPrice: offerPrice, // Set discountPrice = offerPrice
            stockQuantity: parseInt(req.body.stockQuantity),
            warranty: req.body.warranty || '1 Year',
            performanceRating: parseInt(req.body.performanceRating) || 5,
            featured: req.body.featured === 'true' || req.body.featured === true,
            isActive: true,
            isTested: false,
            createdBy: req.user._id
        };
        const preBuiltPC = await PreBuiltPC.create(preBuiltPCData);

        res.status(201).json({
            success: true,
            message: 'Pre-built PC created successfully',
            data: preBuiltPC
        });

    } catch (error) {
        console.error('💥 CREATE ERROR:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new ErrorHandler(messages.join(', '), 400));
        }

        if (error.code === 11000) {
            return next(new ErrorHandler('Pre-built PC with this name already exists', 400));
        }

        return next(new ErrorHandler(error.message, 500));
    }
});
// Get All Pre-built PCs (Public)
// controllers/preBuiltPCController.js - UPDATED
exports.getAllPreBuiltPCs = catchAsyncErrors(async (req, res, next) => {
    try {
        const resPerPage = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const skip = resPerPage * (page - 1);

        // Build base query
        let query = { isActive: true };

        // Handle search
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { 'components.name': searchRegex },
                { 'components.brand': searchRegex },
                { tags: searchRegex }
            ];
        }

        // Handle category filter
        if (req.query.category) {
            query.category = { $regex: req.query.category, $options: 'i' };
        }

        // Handle price range
        if (req.query.minPrice || req.query.maxPrice) {
            query.$and = [];
            const priceField = 'discountPrice';

            if (req.query.minPrice) {
                query.$and.push({ [priceField]: { $gte: parseInt(req.query.minPrice) } });
            }
            if (req.query.maxPrice) {
                query.$and.push({ [priceField]: { $lte: parseInt(req.query.maxPrice) } });
            }
        }

        // Handle tags
        if (req.query.tags) {
            const tagArray = req.query.tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray.map(tag => new RegExp(tag, 'i')) };
        }

        // Handle featured filter
        if (req.query.featured) {
            query.featured = req.query.featured === 'true';
        }

        // Handle inStock filter
        if (req.query.inStock) {
            query.stockQuantity = { $gt: 0 };
        }

        // Handle minRating filter
        if (req.query.minRating) {
            query.performanceRating = { $gte: parseInt(req.query.minRating) };
        }

        // Build sort object
        let sort = { createdAt: -1 }; // Default sort

        if (req.query.sortBy) {
            switch (req.query.sortBy) {
                case 'newest':
                    sort = { createdAt: -1 };
                    break;
                case 'price-low':
                    sort = { discountPrice: 1 };
                    break;
                case 'price-high':
                    sort = { discountPrice: -1 };
                    break;
                case 'performance':
                    sort = { performanceRating: -1 };
                    break;
                case 'gaming':
                    sort = { 'performanceSummary.gamingPerformance': -1 };
                    break;
                case 'productivity':
                    sort = { 'performanceSummary.productivityPerformance': -1 };
                    break;
                case 'featured':
                default:
                    sort = { featured: -1, createdAt: -1 };
                    break;
            }
        }

        // Execute query with pagination
        const preBuiltPCs = await PreBuiltPC.find(query)
            .populate('createdBy', 'name email')
            .sort(sort)
            .limit(resPerPage)
            .skip(skip);

        const totalPreBuiltPCCount = await PreBuiltPC.countDocuments({ isActive: true });
        const filteredPreBuiltPCCount = await PreBuiltPC.countDocuments(query);

        res.status(200).json({
            success: true,
            count: preBuiltPCs.length,
            total: totalPreBuiltPCCount,
            filteredTotal: filteredPreBuiltPCCount,
            resPerPage,
            currentPage: page,
            totalPages: Math.ceil(filteredPreBuiltPCCount / resPerPage),
            data: preBuiltPCs
        });

    } catch (error) {
        console.error('Error in getAllPreBuiltPCs:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Single Pre-built PC
exports.getPreBuiltPC = catchAsyncErrors(async (req, res, next) => {
    try {
        const preBuiltPC = await PreBuiltPC.findById(req.params.id).populate('createdBy', 'name email');

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        res.status(200).json({
            success: true,
            data: preBuiltPC
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Pre-built PC by Slug
exports.getPreBuiltPCBySlug = catchAsyncErrors(async (req, res, next) => {
    try {
        const preBuiltPC = await PreBuiltPC.findOne({
            slug: req.params.slug,
            isActive: true
        }).populate('createdBy', 'name email');

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        res.status(200).json({
            success: true,
            data: preBuiltPC
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Soft Delete Pre-built PC (Make Inactive)
exports.deletePreBuiltPC = catchAsyncErrors(async (req, res, next) => {
    try {
        const preBuiltPC = await PreBuiltPC.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            {
                new: true,
                runValidators: true,
                useFindAndModify: false
            }
        );

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Pre-built PC deactivated successfully'
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Reactivate Pre-built PC (Set isActive: true)
exports.reactivatePreBuiltPC = catchAsyncErrors(async (req, res, next) => {
    try {
        const preBuiltPC = await PreBuiltPC.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true, runValidators: true, useFindAndModify: false }
        );

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Pre-built PC activated successfully'
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Deactivate Pre-built PC (Set isActive: false)
exports.deactivatePreBuiltPC = catchAsyncErrors(async (req, res, next) => {
    try {
        const preBuiltPC = await PreBuiltPC.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true, runValidators: true, useFindAndModify: false }
        );

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Pre-built PC deactivated successfully'
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Pre-built PC Categories
exports.getPreBuiltPCCategories = catchAsyncErrors(async (req, res, next) => {
    try {
        const categories = await PreBuiltPC.distinct('category', { isActive: true });

        res.status(200).json({
            success: true,
            data: categories
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Featured Pre-built PCs
exports.getFeaturedPreBuiltPCs = catchAsyncErrors(async (req, res, next) => {
    try {
        const featuredPCs = await PreBuiltPC.find({
            featured: true,
            isActive: true
        })
            .sort('-createdAt')
            .limit(8);

        res.status(200).json({
            success: true,
            count: featuredPCs.length,
            data: featuredPCs
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Add Benchmark Tests to Pre-built PC
exports.addBenchmarkTests = catchAsyncErrors(async (req, res, next) => {
    try {
        const { benchmarkTests, performanceSummary, testNotes, testedBy, testDate } = req.body;

        const preBuiltPC = await PreBuiltPC.findById(req.params.id);

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        let testsArray = benchmarkTests;
        if (typeof benchmarkTests === 'string') {
            testsArray = JSON.parse(benchmarkTests);
        }

        let summaryData = performanceSummary;
        if (typeof performanceSummary === 'string') {
            summaryData = JSON.parse(performanceSummary);
        }

        preBuiltPC.benchmarkTests = testsArray || [];
        preBuiltPC.performanceSummary = summaryData || preBuiltPC.performanceSummary;
        preBuiltPC.testNotes = testNotes || preBuiltPC.testNotes;
        preBuiltPC.testedBy = testedBy || preBuiltPC.testedBy;
        preBuiltPC.testDate = testDate || new Date();
        preBuiltPC.isTested = true;

        await preBuiltPC.save();

        res.status(200).json({
            success: true,
            message: 'Benchmark tests added successfully',
            data: preBuiltPC
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Update Benchmark Test
exports.updateBenchmarkTest = catchAsyncErrors(async (req, res, next) => {
    try {
        const { testId } = req.params;
        const updateData = req.body;

        const preBuiltPC = await PreBuiltPC.findById(req.params.id);

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        const testIndex = preBuiltPC.benchmarkTests.findIndex(test => test._id.toString() === testId);

        if (testIndex === -1) {
            return next(new ErrorHandler('Benchmark test not found', 404));
        }

        preBuiltPC.benchmarkTests[testIndex] = {
            ...preBuiltPC.benchmarkTests[testIndex].toObject(),
            ...updateData
        };

        await preBuiltPC.save();

        res.status(200).json({
            success: true,
            message: 'Benchmark test updated successfully',
            data: preBuiltPC.benchmarkTests[testIndex]
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Remove Benchmark Test
exports.removeBenchmarkTest = catchAsyncErrors(async (req, res, next) => {
    try {
        const { testId } = req.params;

        const preBuiltPC = await PreBuiltPC.findById(req.params.id);

        if (!preBuiltPC) {
            return next(new ErrorHandler('Pre-built PC not found', 404));
        }

        preBuiltPC.benchmarkTests = preBuiltPC.benchmarkTests.filter(
            test => test._id.toString() !== testId
        );

        if (preBuiltPC.benchmarkTests.length === 0) {
            preBuiltPC.isTested = false;
        }

        await preBuiltPC.save();

        res.status(200).json({
            success: true,
            message: 'Benchmark test removed successfully',
            data: preBuiltPC
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Pre-built PCs by Performance
exports.getPCsByPerformance = catchAsyncErrors(async (req, res, next) => {
    try {
        const { minRating, category, sortBy = 'performanceRating' } = req.query;

        let filter = { isActive: true, isTested: true };

        if (minRating) {
            filter.performanceRating = { $gte: parseInt(minRating) };
        }

        if (category) {
            filter.category = category;
        }

        let sortCriteria = {};
        switch (sortBy) {
            case 'performance':
                sortCriteria = { performanceRating: -1 };
                break;
            case 'gaming':
                sortCriteria = { 'performanceSummary.gamingPerformance': -1 };
                break;
            case 'productivity':
                sortCriteria = { 'performanceSummary.productivityPerformance': -1 };
                break;
            case 'price':
                sortCriteria = { discountPrice: 1 };
                break;
            default:
                sortCriteria = { performanceRating: -1 };
        }

        const preBuiltPCs = await PreBuiltPC.find(filter)
            .sort(sortCriteria)
            .limit(parseInt(req.query.limit) || 20);

        res.status(200).json({
            success: true,
            count: preBuiltPCs.length,
            data: preBuiltPCs
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Benchmark Test Categories
exports.getBenchmarkCategories = catchAsyncErrors(async (req, res, next) => {
    try {
        const categories = await PreBuiltPC.aggregate([
            { $match: { isActive: true, isTested: true } },
            { $unwind: '$benchmarkTests' },
            { $group: { _id: '$benchmarkTests.testCategory' } },
            { $project: { _id: 0, category: '$_id' } }
        ]);

        const categoryList = categories.map(cat => cat.category);

        res.status(200).json({
            success: true,
            data: categoryList
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Performance Stats
exports.getPerformanceStats = catchAsyncErrors(async (req, res, next) => {
    try {
        const stats = await PreBuiltPC.aggregate([
            { $match: { isActive: true, isTested: true } },
            {
                $group: {
                    _id: null,
                    totalTested: { $sum: 1 },
                    avgPerformance: { $avg: '$performanceRating' },
                    maxPerformance: { $max: '$performanceRating' },
                    minPerformance: { $min: '$performanceRating' },
                    avgGaming: { $avg: '$performanceSummary.gamingPerformance' },
                    avgProductivity: { $avg: '$performanceSummary.productivityPerformance' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || {}
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});