const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const ErrorHandler = require('../utils/errorHandler');
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const fs = require("fs").promises;
const path = require("path");

// Helper function to process image upload
const processImageUpload = async (file) => {
    try {
        if (!file) return null;

        // Create categories directory if it doesn't exist
        const categoriesDir = path.join(__dirname, '../public/uploads/categories');
        try {
            await fs.access(categoriesDir);
        } catch (error) {
            await fs.mkdir(categoriesDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'category-' + uniqueSuffix + fileExtension;
        const filepath = path.join(categoriesDir, filename);

        // Move file to permanent location
        await fs.rename(file.path, filepath);

        // Return image object for database storage
        return {
            url: `/uploads/categories/${filename}`,
            altText: null, // Will be set from form data
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
        throw new Error(`Image upload failed: ${error.message}`);
    }
};

// Helper function to remove image file
const removeImageFile = async (image) => {
    try {
        if (!image || !image.url) return;

        const imagePath = image.url;
        const fullPath = path.join(__dirname, '../public', imagePath);

        try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
        } catch (error) {
        }
    } catch (error) {
        console.error('Error removing category image:', error);
    }
};

// @desc    Create a new category with image upload
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            name,
            slug,
            description,
            parentCategory,
            metaTitle,
            metaDescription,
            metaKeywords,
            imageAltText
        } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({
            $or: [
                { name },
                { slug: slug || name.toLowerCase().replace(/ /g, '-') }
            ]
        });

        if (existingCategory) {
            return next(new ErrorHandler("Category with this name or slug already exists", 400));
        }

        // Validate parent category if provided
        if (parentCategory && parentCategory !== '') {
            const parent = await Category.findById(parentCategory);
            if (!parent) {
                return next(new ErrorHandler("Parent category not found", 404));
            }
            if (parent.status === 'inactive') {
                return next(new ErrorHandler("Cannot assign to an inactive parent category", 400));
            }
        }

        // Process image upload if present
        let imageData = null;
        if (req.file) {
            try {
                imageData = await processImageUpload(req.file);
                // Set alt text if provided
                if (imageAltText) {
                    imageData.altText = imageAltText;
                } else {
                    imageData.altText = `${name} category image`;
                }
            } catch (uploadError) {
                return next(new ErrorHandler(uploadError.message, 400));
            }
        }

        const categoryData = {
            name,
            slug: slug || name.toLowerCase().replace(/ /g, '-'),
            description: description || '',
            parentCategory: parentCategory || null,
            image: imageData,
            metaTitle: metaTitle || '',
            metaDescription: metaDescription || '',
            metaKeywords: metaKeywords || [],
            status: 'active'
        };

        // Add createdBy if user is authenticated
        if (req.user && req.user.id) {
            categoryData.createdBy = req.user.id;
        }

        const category = await Category.create(categoryData);

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        console.error("Error in createCategory:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// @desc    Update category with combined image handling
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = catchAsyncErrors(async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return next(new ErrorHandler("Category not found", 404));
        }

        const {
            name,
            description,
            parentCategory,
            metaTitle,
            metaDescription,
            metaKeywords,
            imageAltText,
            removeImage // Flag to remove existing image
        } = req.body;

        // Prepare update data
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (parentCategory !== undefined) updateData.parentCategory = parentCategory;
        if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
        if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
        if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;

        // Handle image removal if requested
        if (removeImage === 'true' && category.image && category.image.url) {
            await removeImageFile(category.image);
            updateData.image = {
                url: null,
                altText: null,
                publicId: null
            };
        }

        // Handle image upload if file exists
        if (req.file) {
            try {
                // Remove old image if exists
                if (category.image && category.image.url) {
                    await removeImageFile(category.image);
                }

                const newImageData = await processImageUpload(req.file);
                // Set alt text if provided
                if (imageAltText) {
                    newImageData.altText = imageAltText;
                } else if (name) {
                    newImageData.altText = `${name} category image`;
                }

                updateData.image = newImageData;
            } catch (uploadError) {
                return next(new ErrorHandler(uploadError.message, 400));
            }
        } else if (imageAltText !== undefined && category.image) {
            // Update only alt text if no new file
            updateData.image = {
                ...category.image.toObject(),
                altText: imageAltText
            };
        }

        // Handle slug generation if name is updated
        if (name && !req.body.slug) {
            updateData.slug = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
        } else if (req.body.slug) {
            updateData.slug = req.body.slug;
        }

        // Validate parent category if provided
        if (parentCategory !== undefined) {
            if (parentCategory === null || parentCategory === '') {
                updateData.parentCategory = null;
            } else {
                const parent = await Category.findById(parentCategory);
                if (!parent) {
                    return next(new ErrorHandler("Parent category not found", 404));
                }
                // Prevent circular reference
                if (parentCategory === req.params.id) {
                    return next(new ErrorHandler("Category cannot be its own parent", 400));
                }
                updateData.parentCategory = parentCategory;
            }
        }

        // Check for duplicate name/slug
        if (updateData.name || updateData.slug) {
            const duplicateCondition = {
                _id: { $ne: req.params.id },
                $or: []
            };

            if (updateData.name) {
                duplicateCondition.$or.push({ name: updateData.name });
            }
            if (updateData.slug) {
                duplicateCondition.$or.push({ slug: updateData.slug });
            }

            const duplicateCategory = await Category.findOne(duplicateCondition);
            if (duplicateCategory) {
                return next(new ErrorHandler("Category with this name or slug already exists", 400));
            }
        }

        // Add updatedAt timestamp and updatedBy
        updateData.updatedAt = Date.now();
        if (req.user && req.user.id) {
            updateData.updatedBy = req.user.id;
        }

        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate("parentCategory", "name slug status");

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: updatedCategory,
        });
    } catch (error) {
        console.error("❌ Error in updateCategory:", error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return next(new ErrorHandler(`Validation failed: ${errors.join(', ')}`, 400));
        }
        if (error.code === 11000) {
            return next(new ErrorHandler("Category with this name or slug already exists", 400));
        }

        return next(new ErrorHandler(error.message, 500));
    }
});

// Keep all other existing functions unchanged (getAllCategories, getCategoryBySlug, updateCategoryStatus, etc.)
// ... [rest of your existing functions remain the same]

// @desc    Get all categories (Public & Admin)
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = catchAsyncErrors(async (req, res, next) => {
    try {
        let baseQuery = {};

        const categorySchema = Category.schema.obj;
        const hasStatusField = categorySchema.hasOwnProperty('status');

        if (hasStatusField) {
            // Check if this is an admin endpoint call
            const isAdminEndpoint = req.originalUrl.includes('/admin/');

            // TEMPORARY FIX: If it's an admin endpoint, show all categories
            // Remove this once you have proper authentication
            if (isAdminEndpoint) {
                // Admin endpoint - respect status filter if provided
                if (req.query.status) {
                    baseQuery.status = req.query.status;
                }
                // else baseQuery remains empty to show all
            } else {
                // Public endpoint - only show active categories
                baseQuery.status = 'active';
            }
        }

        const categories = await Category.find(baseQuery)
            .populate("parentCategory", "name slug")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    } catch (error) {
        console.error("Error in getAllCategories:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// ... [include all your other existing functions exactly as they were]

// @desc    Get single category by slug (Public)
// @route   GET /api/category/:slug
// @access  Public
exports.getCategoryBySlug = catchAsyncErrors(async (req, res, next) => {
    try {
        const category = await Category.findOne({
            slug: req.params.slug
        }).populate("parentCategory", "name slug");

        if (!category) {
            return next(new ErrorHandler("Category not found", 404));
        }

        // If public access and category is inactive, don't show it
        if ((!req.user || !req.user.role || req.user.role !== 'admin') && category.status === 'inactive') {
            return next(new ErrorHandler("Category not found", 404));
        }

        res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error("Error in getCategoryBySlug:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});


// @desc    Update category status (activate/deactivate)
// @route   PATCH /api/admin/categories/:id/status
// @access  Private/Admin
exports.updateCategoryStatus = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return next(new ErrorHandler("Invalid status. Use 'active' or 'inactive'", 400));
        }

        let category = await Category.findById(id);

        if (!category) {
            return next(new ErrorHandler("Category not found", 404));
        }

        if (category.status === status) {
            return next(new ErrorHandler(`Category is already ${status}`, 400));
        }

        if (status === 'inactive') {
            // Check if category has active subcategories
            const hasActiveSubcategories = await Category.exists({
                parentCategory: id,
                status: 'active'
            });

            if (hasActiveSubcategories) {
                return next(new ErrorHandler("Cannot deactivate category with active subcategories", 400));
            }

            category.status = 'inactive';

            // FIX: Use only valid enum values for deactivationReason
            const validReasons = ["out-of-stock", "seasonal", "restructuring", "other"];
            const validReason = validReasons.includes(reason) ? reason : 'other';
            category.deactivationReason = validReason;

            category.deactivatedAt = Date.now();

            // Check if user exists before accessing id
            if (req.user && req.user.id) {
                category.deactivatedBy = req.user.id;
            } else {
                category.deactivatedBy = null;

            }
        } else {
            // Reactivating category
            if (category.parentCategory) {
                const parent = await Category.findById(category.parentCategory);
                if (parent && parent.status === 'inactive') {
                    return next(new ErrorHandler("Cannot activate category with inactive parent", 400));
                }
            }

            category.status = 'active';
            category.deactivationReason = null;
            category.deactivatedAt = null;
            category.deactivatedBy = null;
        }

        category.updatedAt = Date.now();

        await category.save();

        res.status(200).json({
            success: true,
            message: `Category ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            category
        });
    } catch (error) {
        console.error("❌ Error in updateCategoryStatus:", error);

        // More specific error handling
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            console.error('🔍 Validation errors:', errors);
            return next(new ErrorHandler(`Validation failed: ${errors.join(', ')}`, 400));
        }

        return next(new ErrorHandler(error.message, 500));
    }
});

// @desc    Partial update category
// @route   PATCH /api/admin/categories/:id/partial
// @access  Private/Admin
exports.partialUpdateCategory = catchAsyncErrors(async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return next(new ErrorHandler("Category not found", 404));
        }

        // Define allowed fields for partial update
        const allowedFields = [
            'description', 'metaTitle', 'metaDescription', 'metaKeywords'
        ];

        const updateData = {};

        // Only update allowed fields that are provided
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Handle slug if provided
        if (req.body.slug) {
            // Check for duplicate slug
            const duplicateCategory = await Category.findOne({
                slug: req.body.slug,
                _id: { $ne: req.params.id }
            });

            if (duplicateCategory) {
                return next(new ErrorHandler("Category with this slug already exists", 400));
            }
            updateData.slug = req.body.slug;
        }

        // Add updatedAt timestamp and updatedBy
        updateData.updatedAt = Date.now();
        if (req.user && req.user.id) {
            updateData.updatedBy = req.user.id;
        } else {
            updateData.updatedBy = null;
        }

        // Perform the update
        category = await Category.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            {
                new: true,
                runValidators: true,
                useFindAndModify: false,
            }
        );

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    } catch (error) {
        console.error("Error in partialUpdateCategory:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// @desc    Get single category by ID (Admin)
// @route   GET /api/admin/categories/:id
// @access  Private/Admin
exports.getCategory = catchAsyncErrors(async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate("parentCategory", "name slug status")
            .populate("deactivatedBy", "name email");

        if (!category) {
            return next(new ErrorHandler("Category not found", 404));
        }

        res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error("Error in getCategory:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// @desc    Get category tree/hierarchy
// @route   GET /api/admin/categories/tree
// @access  Private/Admin
exports.getCategoryTree = catchAsyncErrors(async (req, res, next) => {
    try {
        const categories = await Category.find({ status: 'active' })
            .populate("parentCategory", "name slug")
            .sort({ name: 1 });

        // Build tree structure recursively
        const buildTree = (parentId = null) => {
            return categories
                .filter(cat => {
                    if (parentId === null) return !cat.parentCategory;
                    return cat.parentCategory && cat.parentCategory._id.toString() === parentId.toString();
                })
                .map(cat => ({
                    _id: cat._id,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    status: cat.status,
                    subcategories: buildTree(cat._id)
                }));
        };

        const categoryTree = buildTree();

        res.status(200).json({
            success: true,
            count: categoryTree.length,
            categories: categoryTree,
        });
    } catch (error) {
        console.error("Error in getCategoryTree:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// @desc    Get categories for dropdown (active only)
// @route   GET /api/admin/categories/dropdown
// @access  Private/Admin
exports.getCategoriesDropdown = catchAsyncErrors(async (req, res, next) => {
    try {
        const categories = await Category.find({ status: 'active' })
            .select('name slug parentCategory')
            .populate("parentCategory", "name slug")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    } catch (error) {
        console.error("Error in getCategoriesDropdown:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.createMultipleCategories = catchAsyncErrors(async (req, res, next) => {
    try {
        const { categories } = req.body;

        // Validate input
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return next(new ErrorHandler("Please provide an array of categories", 400));
        }

        // Limit batch size for safety
        if (categories.length > 50) {
            return next(new ErrorHandler("Maximum 50 categories per batch allowed", 400));
        }

        const results = {
            success: [],
            failed: [],
            total: categories.length
        };

        // Process each category
        for (const categoryData of categories) {
            try {
                const {
                    name,
                    slug,
                    description = '',
                    parentCategory = null,
                    metaTitle = '',
                    metaDescription = '',
                    metaKeywords = [],
                    status = 'active'
                } = categoryData;

                // Validate required fields
                if (!name) {
                    results.failed.push({
                        name: name || 'Unnamed',
                        error: 'Category name is required'
                    });
                    continue;
                }

                // Check if category already exists
                const existingCategory = await Category.findOne({
                    $or: [
                        { name },
                        { slug: slug || name.toLowerCase().replace(/ /g, '-') }
                    ]
                });

                if (existingCategory) {
                    results.failed.push({
                        name,
                        error: 'Category with this name or slug already exists'
                    });
                    continue;
                }

                // Validate parent category if provided
                if (parentCategory && parentCategory !== 'null' && parentCategory !== '') {
                    const parent = await Category.findById(parentCategory);
                    if (!parent) {
                        results.failed.push({
                            name,
                            error: 'Parent category not found'
                        });
                        continue;
                    }
                    if (parent.status === 'inactive') {
                        results.failed.push({
                            name,
                            error: 'Cannot assign to an inactive parent category'
                        });
                        continue;
                    }
                }

                // Prepare category object
                const categoryToCreate = {
                    name,
                    slug: slug || name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-'),
                    description,
                    parentCategory: parentCategory || null,
                    metaTitle: metaTitle || `${name} | iTech Computers`,
                    metaDescription: metaDescription || `Shop ${name} at iTech Computers. Best quality with warranty.`,
                    metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : [],
                    status,
                    createdBy: req.user?.id || null
                };

                // Create category
                const category = await Category.create(categoryToCreate);

                results.success.push({
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                    message: 'Created successfully'
                });

            } catch (error) {
                results.failed.push({
                    name: categoryData.name || 'Unknown',
                    error: error.message
                });
            }
        }

        // Return summary
        res.status(201).json({
            success: true,
            message: `Bulk category creation completed`,
            summary: {
                total: results.total,
                successCount: results.success.length,
                failedCount: results.failed.length,
                success: results.success,
                failed: results.failed
            }
        });

    } catch (error) {
        console.error("Error in createMultipleCategories:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});