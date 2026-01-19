// controllers/featuredBrandController.js
const FeaturedBrand = require('../models/featuredBrand');
const { processFeaturedBrandLogo, deleteFeaturedBrandLogo } = require('../config/multerConfig');
const path = require('path');
const fs = require('fs');

// @desc    Create a new featured brand
// @route   POST /api/v1/admin/featured-brands
// @access  Private/Admin
exports.createFeaturedBrand = async (req, res) => {
    try {
        const { name, description, websiteUrl, displayOrder } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Brand logo is required'
            });
        }

        // Check if brand already exists
        const existingBrand = await FeaturedBrand.findOne({
            $or: [
                { name },
                { slug: name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-') }
            ]
        });

        if (existingBrand) {
            // Delete uploaded file if brand exists
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Brand with this name already exists'
            });
        }

        // Process and save the logo
        const tempFilePath = req.file.path;
        const logoData = await processFeaturedBrandLogo(tempFilePath, name);

        // Create the featured brand
        const featuredBrand = await FeaturedBrand.create({
            name,
            slug: name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
            description: description || '',
            websiteUrl: websiteUrl || null,
            displayOrder: displayOrder || 0,
            logo: {
                url: logoData.url,
                altText: req.body.altText || `${name} logo`,
                publicId: logoData.publicId,
                dimensions: logoData.dimensions,
                size: logoData.size,
                format: logoData.format
            },
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Featured brand created successfully',
            data: featuredBrand
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Error creating featured brand'
        });
    }
};

// @desc    Get all featured brands (public)
// @route   GET /api/v1/featured-brands
// @access  Public
exports.getFeaturedBrands = async (req, res) => {
    try {
        const featuredBrands = await FeaturedBrand.getActiveFeaturedBrands();

        res.status(200).json({
            success: true,
            count: featuredBrands.length,
            data: featuredBrands
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching featured brands'
        });
    }
};

// @desc    Get all featured brands for admin
// @route   GET /api/v1/admin/featured-brands
// @access  Private/Admin
exports.getAllFeaturedBrandsForAdmin = async (req, res) => {
    try {
        const featuredBrands = await FeaturedBrand.getAllForAdmin();

        res.status(200).json({
            success: true,
            count: featuredBrands.length,
            data: featuredBrands
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching featured brands'
        });
    }
};

// @desc    Get single featured brand
// @route   GET /api/v1/admin/featured-brands/:id
// @access  Private/Admin
exports.getFeaturedBrandById = async (req, res) => {
    try {
        const featuredBrand = await FeaturedBrand.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!featuredBrand) {
            return res.status(404).json({
                success: false,
                message: 'Featured brand not found'
            });
        }

        res.status(200).json({
            success: true,
            data: featuredBrand
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching featured brand'
        });
    }
};

// @desc    Update featured brand
// @route   PUT /api/v1/admin/featured-brands/:id
// @access  Private/Admin
exports.updateFeaturedBrand = async (req, res) => {
    try {
        const { name, description, websiteUrl, displayOrder, isActive } = req.body;
        const featuredBrand = await FeaturedBrand.findById(req.params.id);

        if (!featuredBrand) {
            // Clean up uploaded file if brand doesn't exist
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                message: 'Featured brand not found'
            });
        }

        // Check if new name conflicts with existing brand
        if (name && name !== featuredBrand.name) {
            const existingBrand = await FeaturedBrand.findOne({
                _id: { $ne: req.params.id },
                $or: [
                    { name },
                    { slug: name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-') }
                ]
            });

            if (existingBrand) {
                // Clean up uploaded file
                if (req.file && req.file.path) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Brand with this name already exists'
                });
            }
        }

        // Handle logo update if new file is uploaded
        let logoUpdate = {};
        if (req.file) {
            // Process new logo
            const tempFilePath = req.file.path;
            const logoData = await processFeaturedBrandLogo(tempFilePath, name || featuredBrand.name);

            // Delete old logo file
            if (featuredBrand.logo && featuredBrand.logo.url) {
                deleteFeaturedBrandLogo(featuredBrand.logo.url);
            }

            logoUpdate = {
                logo: {
                    url: logoData.url,
                    altText: req.body.altText || featuredBrand.logo.altText || `${name || featuredBrand.name} logo`,
                    publicId: logoData.publicId,
                    dimensions: logoData.dimensions,
                    size: logoData.size,
                    format: logoData.format
                }
            };
        }

        // Update brand data
        const updateData = {
            name: name || featuredBrand.name,
            slug: name ? name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-') : featuredBrand.slug,
            description: description || featuredBrand.description,
            websiteUrl: websiteUrl || featuredBrand.websiteUrl,
            displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : featuredBrand.displayOrder,
            isActive: isActive !== undefined ? isActive : featuredBrand.isActive,
            updatedBy: req.user.id,
            ...logoUpdate
        };

        const updatedBrand = await FeaturedBrand.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('updatedBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Featured brand updated successfully',
            data: updatedBrand
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Error updating featured brand'
        });
    }
};

// @desc    Update featured brand status
// @route   PATCH /api/v1/admin/featured-brands/:id/status
// @access  Private/Admin
exports.updateFeaturedBrandStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "active" or "inactive"'
            });
        }

        const featuredBrand = await FeaturedBrand.findById(req.params.id);

        if (!featuredBrand) {
            return res.status(404).json({
                success: false,
                message: 'Featured brand not found'
            });
        }

        featuredBrand.status = status;
        featuredBrand.isActive = status === 'active';
        featuredBrand.updatedBy = req.user.id;
        await featuredBrand.save();

        res.status(200).json({
            success: true,
            message: `Featured brand ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: featuredBrand
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating featured brand status'
        });
    }
};

// @desc    Delete featured brand
// @route   DELETE /api/v1/admin/featured-brands/:id
// @access  Private/Admin
exports.deleteFeaturedBrand = async (req, res) => {
    try {
        const featuredBrand = await FeaturedBrand.findById(req.params.id);

        if (!featuredBrand) {
            return res.status(404).json({
                success: false,
                message: 'Featured brand not found'
            });
        }

        // Delete logo file
        if (featuredBrand.logo && featuredBrand.logo.url) {
            deleteFeaturedBrandLogo(featuredBrand.logo.url);
        }

        // Soft delete by setting status to inactive
        featuredBrand.status = 'inactive';
        featuredBrand.isActive = false;
        featuredBrand.updatedBy = req.user.id;
        await featuredBrand.save();

        res.status(200).json({
            success: true,
            message: 'Featured brand deleted successfully',
            data: featuredBrand
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error deleting featured brand'
        });
    }
};

// @desc    Update display order of featured brands
// @route   PUT /api/v1/admin/featured-brands/update-order
// @access  Private/Admin
exports.updateDisplayOrder = async (req, res) => {
    try {
        const { brands } = req.body;

        if (!Array.isArray(brands)) {
            return res.status(400).json({
                success: false,
                message: 'Brands array is required'
            });
        }

        const updatePromises = brands.map(brand =>
            FeaturedBrand.findByIdAndUpdate(
                brand.id,
                { displayOrder: brand.order, updatedBy: req.user.id },
                { new: true }
            )
        );

        await Promise.all(updatePromises);

        const updatedBrands = await FeaturedBrand.find()
            .sort({ displayOrder: 1, name: 1 });

        res.status(200).json({
            success: true,
            message: 'Display order updated successfully',
            data: updatedBrands
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating display order'
        });
    }
};

// @desc    Get featured brands count
// @route   GET /api/v1/featured-brands/count
// @access  Public
exports.getFeaturedBrandsCount = async (req, res) => {
    try {
        const count = await FeaturedBrand.getActiveCount();

        res.status(200).json({
            success: true,
            count,
            hasBrands: count > 0
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting featured brands count'
        });
    }
};