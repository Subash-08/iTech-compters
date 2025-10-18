// adminController.js - FIX THE IMPORT
const ProductModule = require("../models/productModel");
const ErrorHandler = require('../utils/errorHandler')
const categoryModel = require("../models/categoryModel");
const brandModel = require("../models/brandModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");

// Fix the Product import - handle ES6 module in CommonJS
const Product = ProductModule.default || ProductModule;

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Define allowed fields that can be updated
    const allowedFields = [
        'name', 'description', 'brand', 'categories', 'status', 'condition',
        'isActive', 'definition', 'tags', 'label', 'specifications', 'features',
        'basePrice', 'offerPrice', 'discountPercentage', 'stockQuantity',
        'barcode', 'sku', 'weight', 'dimensions', 'warranty', 'taxRate', 'notes'
    ];

    const updateData = {};

    // Only update allowed fields that are provided
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    // Handle complex objects separately
    if (req.body.variantConfiguration !== undefined) {
        updateData.variantConfiguration = {
            hasVariants: req.body.variantConfiguration.hasVariants !== undefined
                ? req.body.variantConfiguration.hasVariants
                : product.variantConfiguration.hasVariants,
            variantType: req.body.variantConfiguration.variantType || product.variantConfiguration.variantType,
            variantCreatingSpecs: req.body.variantConfiguration.variantCreatingSpecs || product.variantConfiguration.variantCreatingSpecs,
            variantAttributes: req.body.variantConfiguration.variantAttributes || product.variantConfiguration.variantAttributes
        };
    }

    if (req.body.variants !== undefined && Array.isArray(req.body.variants)) {
        updateData.variants = await processVariantsUpdate(product.variants, req.body.variants);
    }

    // Add updatedAt timestamp
    updateData.updatedAt = Date.now();


    // Perform the update
    product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    ).populate("categories", "name slug")
        .populate("brand", "name slug");

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
    });
});

// **NEW: Helper function to process variants with proper merging**
const processVariantsUpdate = async (existingVariants, newVariants) => {
    const processedVariants = [];

    for (const newVariant of newVariants) {
        // Check if this variant already exists (by _id or by identifying attributes)
        let existingVariant = null;

        if (newVariant._id) {
            // Find by ID if provided
            existingVariant = existingVariants.find(v => v._id?.toString() === newVariant._id);
        } else {
            // Find by identifying attributes for new variants
            existingVariant = existingVariants.find(existingVariant =>
                areVariantsMatching(existingVariant, newVariant)
            );
        }

        if (existingVariant) {
            // **UPDATE EXISTING VARIANT**
            const updatedVariant = {
                ...existingVariant.toObject(),
                ...newVariant,
                // Preserve the original _id
                _id: existingVariant._id,
                // Process identifying attributes with color detection
                identifyingAttributes: processIdentifyingAttributes(newVariant.identifyingAttributes || existingVariant.identifyingAttributes),
                // Handle images properly
                images: {
                    thumbnail: newVariant.images?.thumbnail || existingVariant.images.thumbnail,
                    gallery: newVariant.images?.gallery || existingVariant.images.gallery
                },
                // Preserve creation date, update modification date
                updatedAt: Date.now()
            };
            processedVariants.push(updatedVariant);
        } else {
            // **CREATE NEW VARIANT**
            const newVariantData = {
                ...newVariant,
                // Process identifying attributes with color detection
                identifyingAttributes: processIdentifyingAttributes(newVariant.identifyingAttributes || []),
                // Ensure images structure
                images: {
                    thumbnail: newVariant.images?.thumbnail || { url: '', altText: '' },
                    gallery: newVariant.images?.gallery || []
                },
                // Set timestamps
                createdAt: Date.now(),
                updatedAt: Date.now(),
                // Default values
                isActive: newVariant.isActive !== undefined ? newVariant.isActive : true,
                stockQuantity: newVariant.stockQuantity || 0,
                price: newVariant.price || 0,
                offerPrice: newVariant.offerPrice || 0
            };
            processedVariants.push(newVariantData);
        }
    }

    return processedVariants;
};

// **NEW: Helper to detect if variants match based on identifying attributes**
const areVariantsMatching = (existingVariant, newVariant) => {
    const existingAttrs = existingVariant.identifyingAttributes || [];
    const newAttrs = newVariant.identifyingAttributes || [];

    if (existingAttrs.length !== newAttrs.length) return false;

    // Check if all identifying attributes match
    return existingAttrs.every(existingAttr =>
        newAttrs.some(newAttr =>
            existingAttr.key === newAttr.key &&
            existingAttr.value === newAttr.value
        )
    );
};

// **NEW: Process identifying attributes with color detection and hex codes**
const processIdentifyingAttributes = (attributes) => {
    return attributes.map(attr => {
        const processedAttr = {
            key: attr.key,
            label: attr.label || attr.key,
            value: attr.value,
            displayValue: attr.displayValue || attr.value.charAt(0).toUpperCase() + attr.value.slice(1),
            isColor: attr.isColor !== undefined ? attr.isColor : attr.key.toLowerCase().includes('color')
        };

        // Auto-detect and set hex code for color attributes
        if (processedAttr.isColor && !attr.hexCode) {
            processedAttr.hexCode = getColorHexCode(attr.value);
        } else if (processedAttr.isColor && attr.hexCode) {
            processedAttr.hexCode = attr.hexCode;
        }

        return processedAttr;
    });
};

// **NEW: Color hex code mapping (same as your frontend)**
const getColorHexCode = (colorName) => {
    const colorMap = {
        'red': '#dc2626',
        'blue': '#2563eb',
        'green': '#16a34a',
        'yellow': '#ca8a04',
        'black': '#000000',
        'white': '#ffffff',
        'gray': '#6b7280',
        'purple': '#9333ea',
        'pink': '#db2777',
        'orange': '#ea580c',
        'space black': '#1D1D1F',
        'silver': '#E2E2E2',
        'space gray': '#535353',
        'gold': '#ffd700',
        'rose gold': '#b76e79'
    };

    return colorMap[colorName.toLowerCase()] || '#6b7280';
};

// **NEW: Specific endpoint for variant management**
exports.updateProductVariants = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    if (!req.body.variants || !Array.isArray(req.body.variants)) {
        return next(new ErrorHandler("Variants data is required", 400));
    }

    // Process variants with the helper function
    const updatedVariants = await processVariantsUpdate(product.variants, req.body.variants);

    // Update product with new variants
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                variants: updatedVariants,
                updatedAt: Date.now()
            }
        },
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    );

    res.status(200).json({
        success: true,
        message: "Product variants updated successfully",
        product: updatedProduct,
    });
});


exports.partialUpdateProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // List of allowed fields for partial update
    const allowedFields = [
        'name', 'description', 'definition', 'brand', 'categories', 'tags',
        'condition', 'label', 'isActive', 'status', 'basePrice', 'offerPrice',
        'discountPercentage', 'taxRate', 'sku', 'barcode', 'stockQuantity',
        'warranty', 'canonicalUrl', 'notes'
    ];

    // Build update object only with provided and allowed fields
    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    // Handle nested objects
    if (req.body.images) {
        updates.images = { ...product.images, ...req.body.images };
    }

    if (req.body.dimensions) {
        updates.dimensions = { ...product.dimensions, ...req.body.dimensions };
    }

    if (req.body.weight) {
        updates.weight = { ...product.weight, ...req.body.weight };
    }

    if (req.body.meta) {
        updates.meta = { ...product.meta, ...req.body.meta };
    }

    updates.updatedAt = Date.now();

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    ).populate("categories", "name slug")
        .populate("brand", "name slug");

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
    });
});

// Update product status only
exports.updateProductStatus = catchAsyncErrors(async (req, res, next) => {


    const { status } = req.body;

    // Validate status
    if (!status) {
        return next(new ErrorHandler('Status is required', 400));
    }

    try {
        // Use findById + save approach (more reliable)
        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Update the status
        product.status = status;
        const updatedProduct = await product.save();
        res.status(200).json({
            success: true,
            message: `Product status updated to ${status}`,
            data: { product: updatedProduct }
        });

    } catch (error) {
        console.error('💥 Error updating product status:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Update product inventory only
exports.updateProductInventory = catchAsyncErrors(async (req, res, next) => {
    const { stockQuantity, sku, barcode } = req.body;

    const updateData = { updatedAt: Date.now() };
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (sku !== undefined) updateData.sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode;

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    );

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Product inventory updated successfully",
        product,
    });
});