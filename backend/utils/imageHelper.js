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

module.exports = {
    processProductImages,
    processManufacturerImages,
};
