const Brand = require("../models/brandModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const fs = require("fs").promises;
const path = require("path");

// Helper function to process logo upload
const processLogoUpload = async (file) => {
    try {
        if (!file) return null;

        // Create brands directory if it doesn't exist
        const brandsDir = path.join(__dirname, '../public/uploads/brands');
        try {
            await fs.access(brandsDir);
        } catch (error) {
            await fs.mkdir(brandsDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'brand-' + uniqueSuffix + fileExtension;
        const filepath = path.join(brandsDir, filename);

        // Move file to permanent location
        await fs.rename(file.path, filepath);

        // Return logo object for database storage
        return {
            url: `/uploads/brands/${filename}`,
            altText: null,
            publicId: null
        };
    } catch (error) {
        // Clean up temporary file if processing fails
        if (file && file.path) {
            try {
                await fs.unlink(file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up temp file:', unlinkError);
            }
        }
        throw new Error(`Logo upload failed: ${error.message}`);
    }
};

// Helper function to remove logo file
const removeLogoFile = async (logo) => {
    try {
        if (!logo || !logo.url) return;

        const logoPath = logo.url;
        const fullPath = path.join(__dirname, '../public', logoPath);

        try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
        } catch (error) {
        }
    } catch (error) {
        console.error('Error removing logo file:', error);
    }
};

// Helper function to generate slug
const generateSlug = (name) => {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

// Helper function to validate brand data
const validateBrandData = (data, isUpdate = false) => {
    const errors = [];

    if (!isUpdate || data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Brand name is required');
        } else if (data.name.length > 100) {
            errors.push('Brand name must be less than 100 characters');
        }
    }

    if (data.description && data.description.length > 500) {
        errors.push('Description must be less than 500 characters');
    }

    if (data.status && !['active', 'inactive'].includes(data.status)) {
        errors.push('Status must be either active or inactive');
    }

    if (data.metaTitle && data.metaTitle.length > 60) {
        errors.push('Meta title must be less than 60 characters');
    }

    if (data.metaDescription && data.metaDescription.length > 160) {
        errors.push('Meta description must be less than 160 characters');
    }

    return errors;
};

// @desc    Create a new brand
// @route   POST /api/admin/brands
// @access  Public (temporarily without auth)
const createBrand = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            name,
            description,
            status = 'active',
            metaTitle,
            metaDescription,
            metaKeywords,
            logoAltText
        } = req.body;

        // Validate required fields
        if (!name || name.trim().length === 0) {
            return next(new ErrorHandler('Brand name is required', 400));
        }

        // Validate brand data
        const validationErrors = validateBrandData(req.body);
        if (validationErrors.length > 0) {
            return next(new ErrorHandler(validationErrors[0], 400));
        }

        // Check if brand already exists
        const existingBrand = await Brand.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });

        if (existingBrand) {
            return next(new ErrorHandler('Brand with this name already exists', 409));
        }

        // Process logo upload if present
        let logoData = null;
        if (req.file) {
            try {
                logoData = await processLogoUpload(req.file);
                // Set alt text if provided
                if (logoAltText) {
                    logoData.altText = logoAltText;
                } else {
                    logoData.altText = `${name} logo`;
                }
            } catch (uploadError) {
                return next(new ErrorHandler(uploadError.message, 400));
            }
        }

        // Generate slug from name
        const slug = generateSlug(name);

        // Check if slug already exists
        const existingSlug = await Brand.findOne({ slug });
        if (existingSlug) {
            // Clean up uploaded logo if slug conflict
            if (logoData) {
                await removeLogoFile(logoData);
            }
            return next(new ErrorHandler('Brand with similar name already exists', 409));
        }

        // Prepare meta keywords array
        const keywordsArray = metaKeywords ?
            metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0) :
            [];

        // Create brand (without user references)
        const brand = await Brand.create({
            name: name.trim(),
            slug,
            description: description?.trim() || '',
            logo: logoData,
            status,
            metaTitle: metaTitle?.trim() || '',
            metaDescription: metaDescription?.trim() || '',
            metaKeywords: keywordsArray
            // Removed: createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Brand created successfully',
            brand
        });

    } catch (error) {
        console.error('Create brand error:', error);
        next(error);
    }
});

// @desc    Get all brands (public - active only, admin - all)
// @route   GET /api/brands & /api/admin/brands
// @access  Public
const getAllBrands = catchAsyncErrors(async (req, res, next) => {
    const { page, limit, search, status } = req.query;
    const isAdminRoute = req.originalUrl.includes('/admin/');

    // Build filter object
    const filter = {};

    // For public route, only show active brands
    if (!isAdminRoute) {
        filter.status = 'active';
    } else if (status && ['active', 'inactive'].includes(status)) {
        filter.status = status;
    }

    // Search functionality
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get brands with pagination
    const brands = await Brand.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v');

    // Get total count for pagination
    const totalBrands = await Brand.countDocuments(filter);
    const totalPages = Math.ceil(totalBrands / limitNum);

    res.status(200).json({
        success: true,
        brands,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalBrands,
            pages: totalPages
        }
    });
});

// @desc    Get single brand by slug or ID
// @route   GET /api/brand/slug/:slug & /api/admin/brands/:slug
// @access  Public
const getBrand = catchAsyncErrors(async (req, res, next) => {
    const { slug } = req.params;
    const isAdminRoute = req.originalUrl.includes('/admin/');

    // Build query - try to find by slug first, then by ID
    let brand = await Brand.findOne({ slug });

    // If not found by slug and it looks like an ObjectId, try by ID
    if (!brand && slug.match(/^[0-9a-fA-F]{24}$/)) {
        brand = await Brand.findById(slug);
    }

    if (!brand) {
        return next(new ErrorHandler('Brand not found', 404));
    }

    // For public routes, only return active brands
    if (!isAdminRoute && brand.status !== 'active') {
        return next(new ErrorHandler('Brand not found', 404));
    }

    res.status(200).json({
        success: true,
        brand
    });
});

// @desc    Update brand
// @route   PUT /api/admin/brands/:slug
// @access  Public (temporarily without auth)
const updateBrand = catchAsyncErrors(async (req, res, next) => {
    const { slug } = req.params;
    const {
        name,
        description,
        status,
        deactivationReason,
        metaTitle,
        metaDescription,
        metaKeywords,
        logoAltText,
        removeLogo
    } = req.body;

    // Find brand by slug or ID
    let brand = await Brand.findOne({ slug });
    if (!brand && slug.match(/^[0-9a-fA-F]{24}$/)) {
        brand = await Brand.findById(slug);
    }

    if (!brand) {
        return next(new ErrorHandler('Brand not found', 404));
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (deactivationReason !== undefined) updateData.deactivationReason = deactivationReason;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) {
        updateData.metaKeywords = metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
    // Removed: updateData.updatedBy = req.user._id;

    // Handle logo removal if requested
    if (removeLogo === 'true' && brand.logo && brand.logo.url) {
        await removeLogoFile(brand.logo);
        updateData.logo = {
            url: null,
            altText: null,
            publicId: null
        };
    }

    // Handle logo upload if file exists
    if (req.file) {
        try {
            // Remove old logo if exists
            if (brand.logo && brand.logo.url) {
                await removeLogoFile(brand.logo);
            }

            const newLogoData = await processLogoUpload(req.file);
            // Set alt text if provided
            if (logoAltText) {
                newLogoData.altText = logoAltText;
            } else if (name) {
                newLogoData.altText = `${name} logo`;
            }

            updateData.logo = newLogoData;
        } catch (uploadError) {
            return next(new ErrorHandler(uploadError.message, 400));
        }
    } else if (logoAltText !== undefined && brand.logo) {
        // Update only alt text if no new file
        updateData.logo = {
            ...brand.logo.toObject(),
            altText: logoAltText
        };
    }

    // Check if name is being updated and if it already exists
    if (name && name.trim() !== brand.name) {
        const existingBrand = await Brand.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: brand._id }
        });

        if (existingBrand) {
            return next(new ErrorHandler('Brand with this name already exists', 409));
        }

        // Generate new slug if name changed
        updateData.slug = generateSlug(name);

        // Check if new slug already exists
        const existingSlug = await Brand.findOne({
            slug: updateData.slug,
            _id: { $ne: brand._id }
        });

        if (existingSlug) {
            return next(new ErrorHandler('Brand with similar name already exists', 409));
        }
    }

    // Handle deactivation reason and dates
    if (status === 'inactive' && brand.status === 'active') {
        updateData.deactivatedAt = new Date();
        // Removed: updateData.deactivatedBy = req.user._id;
    } else if (status === 'active' && brand.status === 'inactive') {
        updateData.deactivationReason = null;
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = null;
    }

    // Update brand
    const updatedBrand = await Brand.findByIdAndUpdate(
        brand._id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: 'Brand updated successfully',
        brand: updatedBrand
    });
});

// @desc    Update brand status
// @route   PATCH /api/admin/brands/:id/status
// @access  Public (temporarily without auth)
const updateBrandStatus = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status, deactivationReason } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
        return next(new ErrorHandler('Valid status (active/inactive) is required', 400));
    }

    const updateData = { status };

    if (status === 'inactive') {
        updateData.deactivationReason = deactivationReason || 'other';
        updateData.deactivatedAt = new Date();
        // Removed: updateData.deactivatedBy = req.user._id;
    } else {
        updateData.deactivationReason = null;
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = null;
    }

    const brand = await Brand.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    );

    if (!brand) {
        return next(new ErrorHandler('Brand not found', 404));
    }

    res.status(200).json({
        success: true,
        message: `Brand ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        brand
    });
});

// @desc    Delete brand
// @route   DELETE /api/admin/brands/:slug
// @access  Public (temporarily without auth)
const deleteBrand = catchAsyncErrors(async (req, res, next) => {
    const { slug } = req.params;

    // Find brand by slug or ID
    let brand = await Brand.findOne({ slug });
    if (!brand && slug.match(/^[0-9a-fA-F]{24}$/)) {
        brand = await Brand.findById(slug);
    }

    if (!brand) {
        return next(new ErrorHandler('Brand not found', 404));
    }

    // Remove logo file if exists
    if (brand.logo && brand.logo.url) {
        await removeLogoFile(brand.logo);
    }

    // Permanent delete
    await Brand.findByIdAndDelete(brand._id);

    res.status(200).json({
        success: true,
        message: 'Brand deleted successfully'
    });
});

const createMultipleBrands = catchAsyncErrors(async (req, res, next) => {
    try {
        const { brands } = req.body;

        // Validate input
        if (!brands || !Array.isArray(brands) || brands.length === 0) {
            return next(new ErrorHandler("Please provide an array of brands", 400));
        }

        // Limit batch size for safety
        if (brands.length > 30) {
            return next(new ErrorHandler("Maximum 30 brands per batch allowed", 400));
        }

        const results = {
            success: [],
            failed: [],
            total: brands.length
        };

        // Process each brand
        for (const brandData of brands) {
            try {
                const {
                    name,
                    description = '',
                    metaTitle = '',
                    metaDescription = '',
                    metaKeywords = [],
                    status = 'active'
                } = brandData;

                // Validate required fields
                if (!name) {
                    results.failed.push({
                        name: 'Unnamed',
                        error: 'Brand name is required'
                    });
                    continue;
                }

                // Generate slug from name
                const slug = brandData.slug || name.toLowerCase()
                    .replace(/[^a-zA-Z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                // Check if brand already exists
                const existingBrand = await Brand.findOne({
                    $or: [
                        { name },
                        { slug }
                    ]
                });

                if (existingBrand) {
                    results.failed.push({
                        name,
                        error: 'Brand with this name or slug already exists'
                    });
                    continue;
                }

                // Prepare brand object
                const brandToCreate = {
                    name,
                    slug,
                    description,
                    metaTitle: metaTitle || `${name} Products | iTech Computers`,
                    metaDescription: metaDescription || `Shop ${name} products at iTech Computers. Best prices with warranty and support.`,
                    metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : [],
                    status,
                    createdBy: req.user?.id || null
                };

                // Add logo if provided in data (for bulk create without file upload)
                if (brandData.logo && typeof brandData.logo === 'object') {
                    brandToCreate.logo = brandData.logo;
                }

                // Create brand
                const brand = await Brand.create(brandToCreate);

                results.success.push({
                    _id: brand._id,
                    name: brand.name,
                    slug: brand.slug,
                    message: 'Created successfully'
                });

            } catch (error) {
                results.failed.push({
                    name: brandData.name || 'Unknown',
                    error: error.message
                });
            }
        }

        // Return summary
        res.status(201).json({
            success: true,
            message: `Bulk brand creation completed`,
            summary: {
                total: results.total,
                successCount: results.success.length,
                failedCount: results.failed.length,
                success: results.success,
                failed: results.failed
            }
        });

    } catch (error) {
        console.error("Error in createMultipleBrands:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});
const getHomeShowcaseBrands = catchAsyncErrors(async (req, res, next) => {

    // We only care about 'active' brands for the homepage
    const brands = await Brand.find({ status: 'active' })
        .sort({ isFeatured: -1, order: 1, name: 1 }) // Featured first -> then by Order -> then Name
        .select('name slug logo order isFeatured status'); // Select only needed fields

    res.status(200).json({
        success: true,
        count: brands.length,
        brands
    });
});

// 2. UPDATE Function for Home Page Settings
// Updates ONLY the order and featured status.
const updateHomeShowcaseSettings = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { order, isFeatured } = req.body;

    const brand = await Brand.findById(id);

    if (!brand) {
        return next(new ErrorHandler('Brand not found', 404));
    }

    // Update only if provided
    if (order !== undefined) brand.order = parseInt(order);
    if (isFeatured !== undefined) brand.isFeatured = isFeatured;

    await brand.save();

    res.status(200).json({
        success: true,
        message: 'Home page settings updated',
        brand
    });
});

module.exports = {
    createBrand,
    getAllBrands,
    getBrand,
    updateBrand,
    updateBrandStatus,
    deleteBrand,
    createMultipleBrands,
    getHomeShowcaseBrands,
    updateHomeShowcaseSettings
};