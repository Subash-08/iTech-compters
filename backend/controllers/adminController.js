// adminController.js - UPDATED with file upload support for product updates
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

const processVariantsUpdate = async (existingVariants, newVariants) => {
    if (!Array.isArray(newVariants)) {
        console.error('❌ newVariants is not an array:', typeof newVariants);
        return existingVariants || [];
    }

    const processed = [];

    for (let i = 0; i < newVariants.length; i++) {
        const newVariant = { ...newVariants[i] };
        const existingVariant = existingVariants?.[i] || {};

        // Preserve existing variant ID if updating
        if (existingVariant._id) {
            newVariant._id = existingVariant._id;
        }
        if (newVariant.images) {
            if (newVariant.images.thumbnail === null ||
                (newVariant.images.thumbnail && !newVariant.images.thumbnail.url)) {
                newVariant.images.thumbnail = null;
            } else if (newVariant.images.thumbnail?.url) {
            } else if (existingVariant.images?.thumbnail) {
                newVariant.images.thumbnail = existingVariant.images.thumbnail;
            }
            if (newVariant.images.gallery) {
                if (existingVariant.images?.gallery) {
                    const newGalleryUrls = newVariant.images.gallery.map(img => img.url);

                    // Filter existing gallery to only keep images that are in the new gallery
                    const filteredExistingGallery = existingVariant.images.gallery.filter(img =>
                        newGalleryUrls.includes(img.url)
                    );
                    const combinedGallery = [...filteredExistingGallery];
                    newVariant.images.gallery.forEach(newImg => {
                        if (!combinedGallery.some(existingImg => existingImg.url === newImg.url)) {
                            combinedGallery.push(newImg);
                        }
                    });

                    newVariant.images.gallery = combinedGallery;
                } else {
                }
            } else if (existingVariant.images?.gallery) {
                newVariant.images.gallery = existingVariant.images.gallery;
            }
        } else if (existingVariant.images) {
            newVariant.images = existingVariant.images;
        } else {
            newVariant.images = { gallery: [] };
        }
        delete newVariant._thumbnailFile;
        delete newVariant._galleryFiles;
        delete newVariant._variantIndex;
        delete newVariant._fileUpload;

        // 🆕 Ensure required fields
        if (newVariant.isActive === undefined) newVariant.isActive = true;
        if (!newVariant.images.gallery) newVariant.images.gallery = [];
        processed.push(newVariant);
    }
    return processed;
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

const validateLinkedProducts = async (linkedProducts, currentProductId) => {
    try {
        // Ensure it's an array
        if (!Array.isArray(linkedProducts)) {
            return { error: "Linked products must be an array" };
        }

        // Handle empty array
        if (linkedProducts.length === 0) {
            return { validated: [] };
        }

        // Remove duplicates and current product ID
        const uniqueIds = [...new Set(linkedProducts)]
            .filter(id => id && id.toString() !== currentProductId.toString());

        // Validate each product exists
        const existingProducts = await Product.find({
            _id: { $in: uniqueIds }
        }).select('_id');

        const existingIds = existingProducts.map(p => p._id.toString());
        const validIds = uniqueIds.filter(id => existingIds.includes(id.toString()));
        return { validated: validIds };
    } catch (error) {
        console.error('❌ Error validating linked products:', error);
        return { error: "Failed to validate linked products" };
    }
};

// 🆕 UPDATED: Process uploaded files for updates (with variant support)
const processUploadedFiles = (req) => {
    const fileMap = {};

    if (req.files) {
        Object.entries(req.files).forEach(([fieldname, files]) => {
            // Only process product-level files (not variant files)
            if (!fieldname.startsWith('variant')) {
                fileMap[fieldname] = files.map(file => ({
                    url: `/uploads/products/${file.filename}`,
                    filename: file.filename,
                    originalName: file.originalname
                }));
            }
        });
    }

    return fileMap;
};

// 🆕 NEW: Merge uploaded files with existing image data for updates
const mergeImagesWithUploads = (existingImages, uploadedFiles, currentProductImages) => {
    // Start with existing form data images
    let merged = { ...existingImages };

    // Handle thumbnail - use uploaded file if provided, otherwise keep existing URL
    if (uploadedFiles.thumbnail && uploadedFiles.thumbnail[0]) {
        merged.thumbnail = {
            url: uploadedFiles.thumbnail[0].url,
            altText: merged.thumbnail?.altText || 'Product thumbnail'
        };
    } else if (!merged.thumbnail?.url && currentProductImages?.thumbnail?.url) {
        // Keep existing thumbnail if no new upload and form data doesn't have URL
        merged.thumbnail = currentProductImages.thumbnail;
    }

    // Handle hover image
    if (uploadedFiles.hoverImage && uploadedFiles.hoverImage[0]) {
        merged.hoverImage = {
            url: uploadedFiles.hoverImage[0].url,
            altText: merged.hoverImage?.altText || 'Product hover image'
        };
    } else if (!merged.hoverImage?.url && currentProductImages?.hoverImage?.url) {
        // Keep existing hover image if no new upload
        merged.hoverImage = currentProductImages.hoverImage;
    }

    // Handle gallery - combine uploaded files with existing gallery
    const uploadedGallery = uploadedFiles.gallery ? uploadedFiles.gallery.map(file => ({
        url: file.url,
        altText: file.originalName.split('.')[0] || 'Product gallery image'
    })) : [];

    // If we have uploaded gallery images, use them (replacing blob URLs)
    if (uploadedGallery.length > 0) {
        merged.gallery = uploadedGallery;
    } else if (!merged.gallery && currentProductImages?.gallery) {
        // Keep existing gallery if no new uploads
        merged.gallery = currentProductImages.gallery;
    }

    return merged;
};

// 🆕 NEW: Merge manufacturer images with uploads
const mergeManufacturerImagesWithUploads = (existingManufacturerImages, uploadedFiles, currentManufacturerImages) => {
    let result = existingManufacturerImages || [];

    if (uploadedFiles.manufacturerImages) {
        const uploadedManufacturer = uploadedFiles.manufacturerImages.map(file => ({
            url: file.url,
            altText: file.originalName.split('.')[0] || 'Manufacturer image',
            sectionTitle: ''
        }));

        result = uploadedManufacturer;
    } else if (!result.length && currentManufacturerImages) {
        // Keep existing manufacturer images if no new uploads
        result = currentManufacturerImages;
    }

    return result;
};


exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // 🆕 IMPROVED Helper function to parse JSON fields
        const parseJsonField = (field, fieldName = 'field') => {

            if (field === undefined || field === null || field === '') {
                return undefined;
            }

            // If it's already an object/array, return as-is
            if (typeof field === 'object') {
                return field;
            }

            // If it's a string, try to parse it
            if (typeof field === 'string') {
                const trimmed = field.trim();
                if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
                    return undefined;
                }

                // Check if it looks like JSON
                if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                    (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        return parsed;
                    } catch (e) {
                        console.error(`❌ Failed to parse ${fieldName} as JSON:`, e.message);
                        // Return the string as-is if it's not valid JSON
                        return field;
                    }
                } else {
                    return field;
                }
            }
            return field;
        };

        // 🆕 FIX: Handle BOTH FormData with files AND regular JSON
        let updateData = {};
        let productData = {};

        if (req.files && Object.keys(req.files).length > 0) {

            // 🆕 NEW: Process individual fields from FormData
            productData = { ...req.body };

            // 🆕 CRITICAL FIX: Parse variants FIRST and PROPERLY
            if (productData.variants !== undefined) {
                productData.variants = parseJsonField(productData.variants, 'variants');

                if (Array.isArray(productData.variants)) {
                    if (req.files) {
                        productData.variants = processVariantImages(req, productData.variants);
                    }
                } else {
                    console.error('❌ Variants is not an array after parsing:', typeof productData.variants);
                }
            }

            // 🆕 Parse other JSON fields
            const jsonFields = [
                'categories',
                'variantConfiguration',
                'tags',
                'linkedProducts',
                'specifications',
                'features',
                'dimensions',
                'weight',
                'meta',
                'images',
                'manufacturerImages'
            ];

            jsonFields.forEach(field => {
                if (productData[field] !== undefined) {
                    productData[field] = parseJsonField(productData[field], field);
                }
            });

            // 🆕 Convert numeric fields
            const numericFields = ['basePrice', 'mrp', 'taxRate', 'discountPercentage', 'stockQuantity'];
            numericFields.forEach(field => {
                if (productData[field] !== undefined && productData[field] !== '') {
                    const num = parseFloat(productData[field]);
                    productData[field] = isNaN(num) ? 0 : num;
                }
            });

            // 🆕 Convert boolean fields
            if (productData.isActive !== undefined) {
                productData.isActive = productData.isActive === 'true' || productData.isActive === true;
            }

            // Process uploaded files
            const uploadedFiles = processUploadedFiles(req);
            const finalImages = mergeImagesWithUploads(
                productData.images || {},
                uploadedFiles,
                product.images
            );
            const finalManufacturerImages = mergeManufacturerImagesWithUploads(
                productData.manufacturerImages,
                uploadedFiles,
                product.manufacturerImages
            );



            const allowedFields = [
                'name', 'description', 'brand', 'categories', 'status', 'condition',
                'isActive', 'definition', 'tags', 'label', 'specifications', 'features',
                'basePrice', 'mrp', 'discountPercentage', 'stockQuantity',
                'barcode', 'sku', 'weight', 'dimensions', 'warranty', 'taxRate', 'notes',
                'linkedProducts', 'hsn', 'manufacturerImages', 'canonicalUrl', 'offerPrice',
                'variantConfiguration', 'variants', 'images', 'meta'
            ];

            // Only update allowed fields that are provided
            updateData = {};
            allowedFields.forEach(field => {
                if (productData[field] !== undefined) {
                    updateData[field] = productData[field];
                }
            });

            // Add processed images
            updateData.images = finalImages;
            updateData.manufacturerImages = finalManufacturerImages;

        } else {
            productData = req.body;
            const jsonFields = [
                'categories',
                'variantConfiguration',
                'variants',
                'tags',
                'linkedProducts',
                'specifications',
                'features',
                'dimensions',
                'weight',
                'meta',
                'images',
                'manufacturerImages'
            ];

            jsonFields.forEach(field => {
                if (productData[field] !== undefined) {
                    productData[field] = parseJsonField(productData[field], field);
                }
            });

            const allowedFields = [
                'name', 'description', 'brand', 'categories', 'status', 'condition',
                'isActive', 'definition', 'tags', 'label', 'specifications', 'features',
                'basePrice', 'mrp', 'discountPercentage', 'stockQuantity',
                'barcode', 'sku', 'weight', 'dimensions', 'warranty', 'taxRate', 'notes',
                'linkedProducts', 'hsn', 'manufacturerImages', 'canonicalUrl', 'offerPrice',
                'variantConfiguration', 'variants', 'images', 'meta'
            ];

            // Only update allowed fields that are provided
            allowedFields.forEach(field => {
                if (productData[field] !== undefined) {
                    updateData[field] = productData[field];
                }
            });

            // Handle complex objects if not already set
            if (productData.variantConfiguration !== undefined && !updateData.variantConfiguration) {
                updateData.variantConfiguration = {
                    hasVariants: productData.variantConfiguration.hasVariants !== undefined
                        ? productData.variantConfiguration.hasVariants
                        : product.variantConfiguration.hasVariants,
                    variantType: productData.variantConfiguration.variantType || product.variantConfiguration.variantType,
                    variantCreatingSpecs: productData.variantConfiguration.variantCreatingSpecs || product.variantConfiguration.variantCreatingSpecs,
                    variantAttributes: productData.variantConfiguration.variantAttributes || product.variantConfiguration.variantAttributes,
                    attributes: productData.variantConfiguration.attributes || product.variantConfiguration.attributes
                };
            }

            // Handle nested objects if not already set
            if (productData.images && !updateData.images) {
                updateData.images = { ...product.images, ...productData.images };
            }

            if (productData.dimensions && !updateData.dimensions) {
                updateData.dimensions = { ...product.dimensions, ...productData.dimensions };
            }

            if (productData.weight && !updateData.weight) {
                updateData.weight = { ...product.weight, ...productData.weight };
            }

            if (productData.meta && !updateData.meta) {
                updateData.meta = { ...product.meta, ...productData.meta };
            }

            // 🆕 Handle variants for JSON requests
            if (productData.variants !== undefined && Array.isArray(productData.variants)) {
                updateData.variants = await processVariantsUpdate(product.variants, productData.variants);
            }
        }

        // 🆕 Ensure MRP is set
        if (updateData.mrp === undefined && updateData.basePrice !== undefined) {
            updateData.mrp = updateData.basePrice;
        }

        // 🆕 FIXED: LINKED PRODUCTS VALIDATION
        if (updateData.linkedProducts !== undefined) {
            // Ensure linkedProducts is an array
            if (!Array.isArray(updateData.linkedProducts)) {
                console.error('❌ linkedProducts is not an array:', typeof updateData.linkedProducts, updateData.linkedProducts);
                return next(new ErrorHandler("Linked products must be an array", 400));
            }

            const validatedLinkedProducts = await validateLinkedProducts(
                updateData.linkedProducts,
                req.params.id
            );

            if (validatedLinkedProducts.error) {
                return next(new ErrorHandler(validatedLinkedProducts.error, 400));
            }

            updateData.linkedProducts = validatedLinkedProducts.validated;
        }

        // 🆕 Handle variants separately (for both file and non-file uploads)
        if (productData.variants !== undefined && Array.isArray(productData.variants)) {
            updateData.variants = await processVariantsUpdate(product.variants, productData.variants);
        }

        // Handle barcode
        if (updateData.barcode === '' || updateData.barcode === undefined) {
            delete updateData.barcode;
        }

        // Add updatedAt timestamp - 🆕 CRITICAL: Only if updateData is an object
        if (typeof updateData === 'object' && updateData !== null) {
            updateData.updatedAt = Date.now();
        } else {
            console.error('❌ updateData is not an object:', typeof updateData, updateData);
            return next(new ErrorHandler("Invalid update data", 400));
        }
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

    } catch (error) {
        console.error('❌ Error in updateProduct:', error);
        next(error);
    }
});

// 🆕 ADD: processVariantImages function 
const processVariantImages = (req, variants) => {

    if (!Array.isArray(variants)) {
        console.error('❌ processVariantImages: variants is not an array');
        return variants;
    }

    // Process simple field names: variantThumbnail_0, variantGallery_0_0, etc.
    const variantFiles = {};

    if (req.files) {
        Object.keys(req.files).forEach(fieldName => {
            // Handle variantThumbnail_0
            if (fieldName.startsWith('variantThumbnail_')) {
                const variantIndex = parseInt(fieldName.replace('variantThumbnail_', ''));
                if (!isNaN(variantIndex) && variantIndex < variants.length) {
                    const file = req.files[fieldName][0];
                    if (!variantFiles[variantIndex]) variantFiles[variantIndex] = { thumbnail: null, gallery: [] };
                    variantFiles[variantIndex].thumbnail = file;
                }
            }

            // Handle variantGallery_0_0
            if (fieldName.startsWith('variantGallery_')) {
                const parts = fieldName.split('_');
                if (parts.length >= 3) {
                    const variantIndex = parseInt(parts[1]);
                    const fileIndex = parseInt(parts[2]);
                    if (!isNaN(variantIndex) && variantIndex < variants.length) {
                        const file = req.files[fieldName][0];
                        if (!variantFiles[variantIndex]) variantFiles[variantIndex] = { thumbnail: null, gallery: [] };
                        variantFiles[variantIndex].gallery.push(file);
                    }
                }
            }
        });
    }
    return variants.map((variant, index) => {
        const updatedVariant = { ...variant };

        if (!updatedVariant.images) {
            updatedVariant.images = { gallery: [] };
        }

        // Apply thumbnail if exists
        if (variantFiles[index]?.thumbnail) {
            const file = variantFiles[index].thumbnail;
            updatedVariant.images.thumbnail = {
                url: `/uploads/products/${file.filename}`,
                altText: updatedVariant.images?.thumbnail?.altText || variant.name || 'Variant thumbnail'
            };
        }

        // Apply gallery images if exist
        if (variantFiles[index]?.gallery && variantFiles[index].gallery.length > 0) {
            const newGallery = variantFiles[index].gallery.map(file => ({
                url: `/uploads/products/${file.filename}`,
                altText: file.originalname.split('.')[0] || `Variant ${index} gallery image`
            }));
            const existingGallery = updatedVariant.images.gallery || [];
            updatedVariant.images.gallery = [
                ...existingGallery,
                ...newGallery
            ];
        }

        return updatedVariant;
    });
};

// 🆕 UPDATED PARTIAL UPDATE with file upload support
exports.partialUpdateProduct = catchAsyncErrors(async (req, res, next) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // 🆕 FIX: Parse the updateData from FormData if files are uploaded
        let updateData = {};

        if (req.files && Object.keys(req.files).length > 0) {
            // If files are uploaded, parse updateData from FormData
            try {
                updateData = typeof req.body.updateData === 'string'
                    ? JSON.parse(req.body.updateData)
                    : req.body.updateData;
            } catch (parseError) {
                console.error('Error parsing updateData:', parseError);
                return next(new ErrorHandler("Invalid update data format", 400));
            }

            // Process uploaded files
            const uploadedFiles = processUploadedFiles(req);

            // Merge uploaded files with update data
            if (uploadedFiles.thumbnail && uploadedFiles.thumbnail[0]) {
                updateData.images = updateData.images || {};
                updateData.images.thumbnail = {
                    url: uploadedFiles.thumbnail[0].url,
                    altText: updateData.images.thumbnail?.altText || 'Product thumbnail'
                };
            }

            if (uploadedFiles.hoverImage && uploadedFiles.hoverImage[0]) {
                updateData.images = updateData.images || {};
                updateData.images.hoverImage = {
                    url: uploadedFiles.hoverImage[0].url,
                    altText: updateData.images.hoverImage?.altText || 'Product hover image'
                };
            }

            if (uploadedFiles.gallery) {
                updateData.images = updateData.images || {};
                updateData.images.gallery = uploadedFiles.gallery.map(file => ({
                    url: file.url,
                    altText: file.originalName.split('.')[0] || 'Product gallery image'
                }));
            }

            if (uploadedFiles.manufacturerImages) {
                updateData.manufacturerImages = uploadedFiles.manufacturerImages.map(file => ({
                    url: file.url,
                    altText: file.originalName.split('.')[0] || 'Manufacturer image',
                    sectionTitle: ''
                }));
            }

        } else {
            // No files uploaded, use regular request body
            updateData = req.body;

            // 🆕 UPDATED: List of allowed fields with new MRP, HSN, and manufacturerImages fields
            const allowedFields = [
                'name', 'description', 'definition', 'brand', 'categories', 'tags',
                'condition', 'label', 'isActive', 'status', 'basePrice', 'mrp',
                'discountPercentage', 'taxRate', 'sku', 'barcode', 'stockQuantity',
                'warranty', 'canonicalUrl', 'notes', 'linkedProducts', 'hsn', 'manufacturerImages'
            ];

            // Build update object only with provided and allowed fields
            const updates = {};
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updates[field] = updateData[field];
                }
            });
            updateData = updates;

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
        }
        if (updateData.mrp === undefined && updateData.basePrice !== undefined) {
            updateData.mrp = updateData.basePrice;
        }

        // 🆕 LINKED PRODUCTS VALIDATION FOR PARTIAL UPDATE
        if (updateData.linkedProducts !== undefined) {
            const validatedLinkedProducts = await validateLinkedProducts(
                updateData.linkedProducts,
                req.params.id
            );

            if (validatedLinkedProducts.error) {
                return next(new ErrorHandler(validatedLinkedProducts.error, 400));
            }

            updateData.linkedProducts = validatedLinkedProducts.validated;
        }

        // Add updatedBy and updatedAt
        updateData.updatedAt = Date.now();
        const updatedProduct = await Product.findByIdAndUpdate(
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
            product: updatedProduct,
        });

    } catch (error) {
        console.error('❌ Error in partialUpdateProduct:', error);
        next(error);
    }
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

// Make sure your updateProductStatus controller handles PATCH properly
exports.updateProductStatus = catchAsyncErrors(async (req, res, next) => {
    const { status } = req.body;
    if (!status) {
        return next(new ErrorHandler('Status is required', 400));
    }

    // Validate status value
    const validStatuses = ['Draft', 'Published', 'OutOfStock', 'Archived', 'Discontinued'];
    if (!validStatuses.includes(status)) {
        return next(new ErrorHandler(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }
        product.status = status;
        product.updatedAt = Date.now();
        const updatedProduct = await product.save();

        res.status(200).json({
            success: true,
            message: `Product status updated to ${status}`,
            data: {
                product: {
                    _id: updatedProduct._id,
                    name: updatedProduct.name,
                    status: updatedProduct.status,
                    isActive: updatedProduct.isActive
                }
            }
        });

    } catch (error) {
        console.error('💥 Error updating product status:', error);

        // Check for specific MongoDB errors
        if (error.name === 'CastError') {
            return next(new ErrorHandler('Invalid product ID format', 400));
        }

        return next(new ErrorHandler(error.message || 'Failed to update product status', 500));
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