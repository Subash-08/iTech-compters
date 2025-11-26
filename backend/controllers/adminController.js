// adminController.js - UPDATED with MRP, HSN, and manufacturer images support
const ProductModule = require("../models/productModel");
const ErrorHandler = require('../utils/errorHandler')
const categoryModel = require("../models/categoryModel");
const brandModel = require("../models/brandModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");

// Fix the Product import - handle ES6 module in CommonJS
const Product = ProductModule.default || ProductModule;

// 🆕 ADD THESE HELPER FUNCTIONS AT THE TOP
const generateVariantSKU = (productName, index) => {
    const base = productName.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 6);
    return `${base}-VAR${index + 1}`;
};

const generateVariantBarcode = () => {
    return `VAR${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// 🆕 UPDATED: Process identifying attributes with MRP support
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

// 🆕 UPDATED: Process variants update with MRP support
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
                // 🆕 UPDATED: Process identifying attributes with MRP support
                identifyingAttributes: processIdentifyingAttributes(newVariant.identifyingAttributes || existingVariant.identifyingAttributes),
                // 🆕 UPDATED: Handle MRP - if not provided, use price as fallback
                mrp: newVariant.mrp !== undefined ? newVariant.mrp : (newVariant.offerPrice || existingVariant.mrp || existingVariant.price),
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
                // 🆕 UPDATED: Process identifying attributes with MRP support
                identifyingAttributes: processIdentifyingAttributes(newVariant.identifyingAttributes || []),
                // 🆕 UPDATED: Handle MRP - if not provided, use price as fallback
                mrp: newVariant.mrp !== undefined ? newVariant.mrp : (newVariant.offerPrice || newVariant.price || 0),
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
                price: newVariant.price || 0
            };
            processedVariants.push(newVariantData);
        }
    }

    return processedVariants;
};

// **EXISTING: Helper to detect if variants match based on identifying attributes**
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

// **EXISTING: Color hex code mapping**
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

// 🆕 NEW: Linked Products Validation Helper
const validateLinkedProducts = async (linkedProducts, currentProductId) => {
    if (!Array.isArray(linkedProducts)) {
        return { error: "Linked products must be an array" };
    }

    // Remove duplicates
    const uniqueLinkedProducts = [...new Set(linkedProducts)];

    // Validate each linked product exists and is not the current product
    const validatedLinkedProducts = [];

    for (const linkedProductId of uniqueLinkedProducts) {
        if (!mongoose.Types.ObjectId.isValid(linkedProductId)) {
            return { error: `Invalid linked product ID: ${linkedProductId}` };
        }

        // Prevent self-linking
        if (linkedProductId === currentProductId) {
            return { error: 'Cannot link product to itself' };
        }

        // Check if product exists and is active
        const linkedProduct = await Product.findOne({
            _id: linkedProductId,
            isActive: true
        });

        if (!linkedProduct) {
            return { error: `Linked product with ID ${linkedProductId} not found or inactive` };
        }

        validatedLinkedProducts.push(linkedProductId);
    }

    // Limit the number of linked products to prevent abuse
    if (validatedLinkedProducts.length > 50) {
        return { error: 'Cannot link more than 50 products' };
    }

    return { validated: validatedLinkedProducts };
};

// 🆕 UPDATED UPDATE PRODUCT with MRP, HSN, and manufacturer images support
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // 🆕 UPDATED: Define allowed fields with new MRP, HSN, and manufacturerImages fields
    const allowedFields = [
        'name', 'description', 'brand', 'categories', 'status', 'condition',
        'isActive', 'definition', 'tags', 'label', 'specifications', 'features',
        'basePrice', 'offerPrice', 'mrp', 'discountPercentage', 'stockQuantity', // 🆕 Added mrp
        'barcode', 'sku', 'weight', 'dimensions', 'warranty', 'taxRate', 'notes',
        'linkedProducts', 'hsn', 'manufacturerImages' // 🆕 Added hsn and manufacturerImages
    ];

    const updateData = {};

    // Only update allowed fields that are provided
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    // 🆕 UPDATED: Handle MRP backward compatibility
    if (req.body.offerPrice !== undefined && req.body.mrp === undefined) {
        // If offerPrice is provided but mrp is not, use offerPrice as MRP for backward compatibility
        updateData.mrp = req.body.offerPrice;
    }

    // 🆕 LINKED PRODUCTS VALIDATION
    if (req.body.linkedProducts !== undefined) {
        const validatedLinkedProducts = await validateLinkedProducts(
            req.body.linkedProducts,
            req.params.id
        );

        if (validatedLinkedProducts.error) {
            return next(new ErrorHandler(validatedLinkedProducts.error, 400));
        }

        updateData.linkedProducts = validatedLinkedProducts.validated;
    }

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
        // 🆕 UPDATED: Use the updated processVariantsUpdate with MRP support
        updateData.variants = await processVariantsUpdate(product.variants, req.body.variants);
    }

    // Handle nested objects
    if (req.body.images) {
        updateData.images = { ...product.images, ...req.body.images };
    }

    if (req.body.dimensions) {
        updateData.dimensions = { ...product.dimensions, ...req.body.dimensions };
    }

    if (req.body.weight) {
        updateData.weight = { ...product.weight, ...req.body.weight };
    }

    if (req.body.meta) {
        updateData.meta = { ...product.meta, ...req.body.meta };
    }

    // 🆕 Handle manufacturer images
    if (req.body.manufacturerImages !== undefined) {
        updateData.manufacturerImages = req.body.manufacturerImages;
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

// 🆕 UPDATED PARTIAL UPDATE with MRP, HSN, and manufacturer images support
exports.partialUpdateProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // 🆕 UPDATED: List of allowed fields with new MRP, HSN, and manufacturerImages fields
    const allowedFields = [
        'name', 'description', 'definition', 'brand', 'categories', 'tags',
        'condition', 'label', 'isActive', 'status', 'basePrice', 'offerPrice', 'mrp',
        'discountPercentage', 'taxRate', 'sku', 'barcode', 'stockQuantity',
        'warranty', 'canonicalUrl', 'notes', 'linkedProducts', 'hsn', 'manufacturerImages'
    ];

    // Build update object only with provided and allowed fields
    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    // 🆕 UPDATED: Handle MRP backward compatibility
    if (req.body.offerPrice !== undefined && req.body.mrp === undefined) {
        updates.mrp = req.body.offerPrice;
    }

    // 🆕 LINKED PRODUCTS VALIDATION FOR PARTIAL UPDATE
    if (req.body.linkedProducts !== undefined) {
        const validatedLinkedProducts = await validateLinkedProducts(
            req.body.linkedProducts,
            req.params.id
        );

        if (validatedLinkedProducts.error) {
            return next(new ErrorHandler(validatedLinkedProducts.error, 400));
        }

        updates.linkedProducts = validatedLinkedProducts.validated;
    }

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

    // 🆕 Handle manufacturer images
    if (req.body.manufacturerImages !== undefined) {
        updates.manufacturerImages = req.body.manufacturerImages;
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

// 🆕 UPDATED: Specific endpoint for variant management with MRP support
exports.updateProductVariants = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    if (!req.body.variants || !Array.isArray(req.body.variants)) {
        return next(new ErrorHandler("Variants data is required", 400));
    }

    // 🆕 UPDATED: Process variants with the updated helper function (includes MRP support)
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

// **EXISTING: Update product status only** (No changes needed)
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

// **EXISTING: Update product inventory only** (No changes needed)
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