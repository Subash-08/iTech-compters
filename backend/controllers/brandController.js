const Brand = require("../models/brandModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncError");

// 🆕 Create a new Brand (Admin only)
exports.createBrand = catchAsyncErrors(async (req, res, next) => {
    const { name, logo, description, metaTitle, metaDescription, metaKeywords } = req.body;

    if (!name) {
        return next(new ErrorHandler("Brand name is required", 400));
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const existingBrand = await Brand.findOne({ slug });
    if (existingBrand) {
        return next(new ErrorHandler("Brand already exists", 400));
    }

    const brand = await Brand.create({
        name,
        slug,
        logo,
        description,
        metaTitle,
        metaDescription,
        metaKeywords,
    });

    res.status(201).json({
        success: true,
        message: "Brand created successfully",
        brand,
    });
});

// 🧾 Get all brands (Admin)
exports.getAllBrands = catchAsyncErrors(async (req, res, next) => {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: brands.length,
        brands,
    });
});
// Create multiple brands - POST /api/v1/admin/brands/bulk
exports.createMultipleBrands = catchAsyncErrors(async (req, res, next) => {
    const { brands } = req.body;

    if (!brands || !Array.isArray(brands) || brands.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Please provide an array of brands"
        });
    }

    // Validate each brand object
    const validBrands = [];
    const errors = [];

    for (let i = 0; i < brands.length; i++) {
        const brandData = brands[i];

        if (!brandData.name || !brandData.name.trim()) {
            errors.push(`Brand at index ${i} is missing required field: name`);
            continue;
        }

        // Check if brand already exists
        const existingBrand = await Brand.findOne({
            name: { $regex: new RegExp(`^${brandData.name.trim()}$`, 'i') }
        });

        if (existingBrand) {
            errors.push(`Brand '${brandData.name}' already exists`);
            continue;
        }

        // Create brand object without createdBy for now
        const brandObj = {
            name: brandData.name.trim(),
            slug: brandData.slug || brandData.name.toLowerCase().replace(/\s+/g, '-'),
            logo: brandData.logo || "",
            description: brandData.description || "",
            metaTitle: brandData.metaTitle || "",
            metaDescription: brandData.metaDescription || "",
            metaKeywords: brandData.metaKeywords || []
        };

        // Only add createdBy if user is authenticated
        if (req.user && req.user._id) {
            brandObj.createdBy = req.user._id;
        }

        validBrands.push(brandObj);
    }

    if (validBrands.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid brands to create",
            errors: errors
        });
    }

    // Insert all valid brands
    const createdBrands = await Brand.insertMany(validBrands);

    res.status(201).json({
        success: true,
        message: `${createdBrands.length} brand(s) created successfully`,
        data: {
            brands: createdBrands
        },
        stats: {
            totalRequested: brands.length,
            successfullyCreated: createdBrands.length,
            failed: errors.length
        },
        errors: errors.length > 0 ? errors : undefined
    });
});