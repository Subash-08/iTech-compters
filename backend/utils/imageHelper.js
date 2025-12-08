// backend/utils/imageHelper.js
const path = require('path');

// Safe JSON parser
const safeParseJSON = (value, fallback) => {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch (e) {
        console.warn('Failed to parse JSON in imageHelper:', e.message, 'value =', value);
        return fallback;
    }
};

// 🖼️ Build product images from current req.body + req.files
const processProductImages = (req, productName = 'Product') => {
    const name = req.body.name || productName || 'Product';

    // ----- THUMBNAIL -----
    let thumbnail = null;
    const thumbnailAlt = req.body.thumbnailAlt || name;

    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail[0]) {
        const file = req.files.thumbnail[0];
        thumbnail = {
            url: `/uploads/products/${file.filename}`,
            altText: thumbnailAlt || file.originalname || `${name} thumbnail`,
        };
    } else if (req.body.thumbnailUrl && req.body.thumbnailUrl.trim() !== '') {
        thumbnail = {
            url: req.body.thumbnailUrl,
            altText: thumbnailAlt || `${name} thumbnail`,
        };
    }

    // ----- HOVER IMAGE -----
    let hoverImage = null;
    const hoverAlt = req.body.hoverImageAlt || name;

    if (req.files && Array.isArray(req.files.hoverImage) && req.files.hoverImage[0]) {
        const file = req.files.hoverImage[0];
        hoverImage = {
            url: `/uploads/products/${file.filename}`,
            altText: hoverAlt || file.originalname || `${name} hover image`,
        };
    } else if (req.body.hoverImageUrl && req.body.hoverImageUrl.trim() !== '') {
        hoverImage = {
            url: req.body.hoverImageUrl,
            altText: hoverAlt || `${name} hover image`,
        };
    }

    // ----- GALLERY (FILES + URLS) -----
    const gallery = [];

    // 1) Uploaded gallery files
    if (req.files && Array.isArray(req.files.gallery)) {
        req.files.gallery.forEach((file, index) => {
            gallery.push({
                url: `/uploads/products/${file.filename}`,
                altText:
                    file.originalname ||
                    `${name} gallery image ${index + 1}`,
            });
        });
    }

    // 2) Gallery URLs from body (non-blob)
    const galleryUrls = safeParseJSON(req.body.galleryUrls, []);
    if (Array.isArray(galleryUrls)) {
        galleryUrls.forEach((img, idx) => {
            if (!img || !img.url) return;
            gallery.push({
                url: img.url,
                altText: img.altText || `${name} gallery image ${idx + 1}`,
            });
        });
    }

    return {
        thumbnail,
        hoverImage,
        gallery,
    };
};

// 🏭 Manufacturer / A+ images
const processManufacturerImages = (req, productName = 'Product') => {
    const name = req.body.name || productName || 'Product';
    const result = [];

    // URLs + meta from frontend
    const urlsMeta = safeParseJSON(req.body.manufacturerImageUrls, []);

    // 1) Uploaded files
    if (req.files && Array.isArray(req.files.manufacturerImages)) {
        req.files.manufacturerImages.forEach((file, index) => {
            const meta = Array.isArray(urlsMeta) ? urlsMeta[index] || {} : {};
            result.push({
                url: `/uploads/products/${file.filename}`,
                altText:
                    meta.altText ||
                    file.originalname ||
                    `${name} manufacturer image ${index + 1}`,
                sectionTitle: meta.sectionTitle || '',
            });
        });
    }

    // 2) Pure URL entries (when editing and no new file uploaded)
    if (Array.isArray(urlsMeta)) {
        urlsMeta.forEach((img) => {
            if (!img || !img.url) return;

            // avoid duplicating URLs already added via files
            if (result.some((r) => r.url === img.url)) return;

            result.push({
                url: img.url,
                altText: img.altText || `${name} manufacturer image`,
                sectionTitle: img.sectionTitle || '',
            });
        });
    }

    return result;
};
const processVariantImages = (req, variants, productName = 'Product') => {
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

    // Apply files to variants
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
                altText: updatedVariant.images?.thumbnail?.altText ||
                    variant.name ||
                    `${productName} variant ${index} thumbnail`
            };
        }

        if (variantFiles[index]?.gallery && variantFiles[index].gallery.length > 0) {
            const newGallery = variantFiles[index].gallery.map(file => ({
                url: `/uploads/products/${file.filename}`,
                altText: file.originalname.split('.')[0] ||
                    `${productName} variant ${index} gallery image`
            }));
            const existingGallery = updatedVariant.images.gallery || [];
            updatedVariant.images.gallery = [
                ...existingGallery,
                ...newGallery
            ];
        }

        // Clean up any blob URLs (frontend preview URLs)
        if (updatedVariant.images?.thumbnail?.url?.startsWith('blob:')) {
            delete updatedVariant.images.thumbnail;
        }

        if (updatedVariant.images?.gallery) {
            const beforeCount = updatedVariant.images.gallery.length;
            updatedVariant.images.gallery = updatedVariant.images.gallery.filter(img =>
                !img.url?.startsWith('blob:')
            );
            const afterCount = updatedVariant.images.gallery.length;
        }

        return updatedVariant;
    });
};

const mergeVariantImages = (existingVariants, newVariants) => {
    if (!Array.isArray(newVariants)) {
        console.error('❌ mergeVariantImages: newVariants is not an array');
        return existingVariants || [];
    }

    return newVariants.map((newVariant, index) => {
        const updatedVariant = { ...newVariant };
        const existingVariant = existingVariants?.[index] || {};

        // Preserve existing variant ID
        if (existingVariant._id) {
            updatedVariant._id = existingVariant._id;
        }

        // Merge images
        if (updatedVariant.images) {
            // If new variant has no thumbnail but existing does, keep existing
            if (!updatedVariant.images.thumbnail && existingVariant.images?.thumbnail) {
                updatedVariant.images.thumbnail = existingVariant.images.thumbnail;
            }

            // Merge galleries
            if (existingVariant.images?.gallery) {
                const existingUrls = existingVariant.images.gallery.map(img => img.url);
                const newGallery = updatedVariant.images.gallery || [];

                // Only add new images that don't already exist
                const uniqueNewGallery = newGallery.filter(img =>
                    !existingUrls.includes(img.url)
                );

                if (uniqueNewGallery.length > 0) {
                    updatedVariant.images.gallery = [
                        ...existingVariant.images.gallery,
                        ...uniqueNewGallery
                    ];
                } else {
                    updatedVariant.images.gallery = existingVariant.images.gallery;
                }
            }
        } else if (existingVariant.images) {
            updatedVariant.images = existingVariant.images;
        }

        return updatedVariant;
    });
};

module.exports = {
    processProductImages,
    processManufacturerImages,
    processVariantImages,      // 🆕 NEW
    mergeVariantImages,        // 🆕 NEW
    safeParseJSON
};