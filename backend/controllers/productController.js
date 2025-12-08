const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const ErrorHandler = require('../utils/errorHandler')
const categoryModel = require("../models/categoryModel");
const brandModel = require("../models/brandModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const mongoose = require("mongoose");
const AdvancedFilterBuilder = require('../utils/advancedFilterBuilder');
const {
    processProductImages,
    processManufacturerImages
} = require("../utils/imageHelper");

exports.getProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        const filterBuilder = new AdvancedFilterBuilder(Product, req.query);
        const { main, count, metadata, pagination } = await filterBuilder.buildCompletePipeline();

        // Execute all pipelines in parallel
        const [products, countResult, metadataResult] = await Promise.all([
            Product.aggregate(main),
            Product.aggregate(count),
            Product.aggregate(metadata)
        ]);

        const totalProducts = countResult[0]?.totalCount || 0;
        const totalPages = Math.ceil(totalProducts / pagination.limit);

        // Process metadata
        const filterMetadata = filterBuilder.processMetadataResults(metadataResult);

        res.status(200).json({
            success: true,
            message: 'Products fetched successfully',
            data: {
                products,
                pagination: {
                    currentPage: pagination.page,
                    totalPages,
                    totalProducts,
                    hasNextPage: pagination.page < totalPages,
                    hasPrevPage: pagination.page > 1,
                    limit: pagination.limit
                },
                filters: filterMetadata,
                appliedFilters: {
                    search: req.query.search || req.query.keyword,
                    brand: req.query.brand,
                    category: req.query.category,
                    minPrice: req.query['price[gte]'] || req.query.minPrice,
                    maxPrice: req.query['price[lte]'] || req.query.maxPrice,
                    rating: req.query.rating || req.query['rating[gte]'],
                    condition: req.query.condition,
                    inStock: req.query.inStock,
                    sort: req.query.sort
                }
            }
        });

    } catch (error) {
        console.error('Error in unified product search:', error);
        return next(new ErrorHandler('Internal server error while fetching products', 500));
    }
});

/**
 * 🎯 LEGACY ENDPOINTS - Redirect to unified endpoint
 */

// Redirect getAllProducts to unified endpoint
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    // Transform legacy parameters to new format
    if (req.query.minPrice) req.query['price[gte]'] = req.query.minPrice;
    if (req.query.maxPrice) req.query['price[lte]'] = req.query.maxPrice;
    if (req.query.brands) req.query.brand = req.query.brands;
    if (req.query.categories) req.query.category = req.query.categories;

    return exports.getProducts(req, res, next);
});

// Redirect advancedSearch to unified endpoint
exports.advancedSearch = catchAsyncErrors(async (req, res, next) => {
    req.query.search = req.query.q;
    return exports.getProducts(req, res, next);
});

// Redirect searchProducts to unified endpoint  
exports.searchProducts = catchAsyncErrors(async (req, res, next) => {
    req.query.search = req.query.q || req.query.keyword;
    return exports.getProducts(req, res, next);
});

// Redirect filterProducts to unified endpoint
exports.filterProducts = catchAsyncErrors(async (req, res, next) => {
    // All filter parameters are already in req.query
    return exports.getProducts(req, res, next);
});


exports.getProductsByBrand = catchAsyncErrors(async (req, res, next) => {
    try {
        const { brandName } = req.params;

        // Find brand by slug or name
        const brand = await Brand.findOne({
            $or: [
                { slug: brandName.toLowerCase() },
                { name: new RegExp(`^${brandName}$`, 'i') }
            ]
        });

        if (!brand) {
            return res.status(200).json({
                success: true,
                message: 'Brand not found',
                data: {
                    products: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalProducts: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                        limit: 12
                    },
                    filters: {
                        minPrice: 0,
                        maxPrice: 0,
                        availableBrands: [],
                        availableCategories: [],
                        conditions: [],
                        ratingOptions: [],
                        inStockCount: 0,
                        totalProducts: 0
                    },
                    brand: {
                        name: brandName,
                        slug: brandName
                    }
                }
            });
        }

        // Add brand to query and use unified endpoint
        req.query.brand = brand.name;
        return exports.getProducts(req, res, next);

    } catch (error) {
        console.error('Error in getProductsByBrand:', error);
        return next(new ErrorHandler('Internal server error while fetching brand products', 500));
    }
});

/**
 * 🎯 CATEGORY PRODUCTS - Enhanced with unified filtering
 */
exports.getProductsByCategory = catchAsyncErrors(async (req, res, next) => {
    try {
        const { categoryName } = req.params;

        // Find category by slug or name
        const category = await Category.findOne({
            $or: [
                { slug: categoryName.toLowerCase() },
                { name: new RegExp(`^${categoryName}$`, 'i') }
            ]
        });

        if (!category) {
            return res.status(200).json({
                success: true,
                message: 'Category not found',
                data: {
                    products: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalProducts: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                        limit: 12
                    },
                    filters: {
                        minPrice: 0,
                        maxPrice: 0,
                        availableBrands: [],
                        availableCategories: [],
                        conditions: [],
                        ratingOptions: [],
                        inStockCount: 0,
                        totalProducts: 0
                    },
                    category: {
                        name: categoryName,
                        slug: categoryName
                    }
                }
            });
        }

        // Add category to query and use unified endpoint
        req.query.category = category.name;
        return exports.getProducts(req, res, next);

    } catch (error) {
        console.error('Error in getProductsByCategory:', error);
        return next(new ErrorHandler('Internal server error while fetching category products', 500));
    }
});

/**
 * 🎯 GET PRODUCT BY SLUG - Keep this separate (single product view)
 */
exports.getProductBySlug = catchAsyncErrors(async (req, res, next) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({
            slug,
            isActive: true,
            status: 'Published'
        })
            .populate('brand', 'name slug logo description')
            .populate('categories', 'name slug description')
            .select('-__v -notes');

        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Add virtuals to response
        const productWithVirtuals = product.toObject();

        res.status(200).json({
            success: true,
            message: 'Product fetched successfully',
            data: {
                product: productWithVirtuals
            }
        });

    } catch (error) {
        console.error('Error in getProductBySlug:', error);
        return next(new ErrorHandler('Internal server error while fetching product', 500));
    }
});

/**
 * 🎯 GET RELATED PRODUCTS (Keep this separate)
 */
exports.getRelatedProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { limit = 8 } = req.query;

        // Find current product
        const currentProduct = await Product.findOne({ slug })
            .select('categories brand tags');

        if (!currentProduct) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Build related products query
        const relatedQuery = {
            _id: { $ne: currentProduct._id },
            isActive: true,
            status: 'Published',
            $or: [
                { categories: { $in: currentProduct.categories } },
                { brand: currentProduct.brand },
                { tags: { $in: currentProduct.tags } }
            ]
        };

        const relatedProducts = await Product.find(relatedQuery)
            .select('name slug brand categories images basePrice mrp averageRating totalReviews condition')
            .populate('brand', 'name slug')
            .populate('categories', 'name slug')
            .limit(parseInt(limit))
            .sort({ averageRating: -1, totalReviews: -1 });

        res.status(200).json({
            success: true,
            message: 'Related products fetched successfully',
            data: {
                relatedProducts,
                total: relatedProducts.length
            }
        });

    } catch (error) {
        console.error('Error in getRelatedProducts:', error);
        return next(new ErrorHandler('Internal server error while fetching related products', 500));
    }
});

/**
 * 🎯 GET FEATURED PRODUCTS (Keep this separate)
 */
exports.getFeaturedProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        const { limit = 12 } = req.query;

        // Use unified endpoint with featured criteria
        req.query.sort = 'popular';
        req.query.limit = limit;

        return exports.getProducts(req, res, next);

    } catch (error) {
        console.error('Error in getFeaturedProducts:', error);
        return next(new ErrorHandler('Internal server error while fetching featured products', 500));
    }
});
// Simpler fix for getLinkedProducts
exports.getLinkedProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { limit = 8 } = req.query;

        // Find current product
        const currentProduct = await Product.findOne({ slug })
            .select('linkedProducts');

        if (!currentProduct) {
            return next(new ErrorHandler('Product not found', 404));
        }

        const linkedProductIds = currentProduct.linkedProducts || [];

        if (linkedProductIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No linked products found',
                data: {
                    linkedProducts: [],
                    total: 0
                }
            });
        }

        // 🆕 FIX: Use aggregation pipeline to properly populate variants
        const linkedProducts = await Product.aggregate([
            {
                $match: {
                    _id: { $in: linkedProductIds.map(id => new mongoose.Types.ObjectId(id)) },
                    isActive: true,
                    status: 'Published'
                }
            },
            {
                $lookup: {
                    from: 'variants',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'variants'
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            {
                $unwind: {
                    path: '$brand',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories'
                }
            },
            {
                $project: {
                    name: 1,
                    slug: 1,
                    brand: {
                        _id: 1,
                        name: 1,
                        slug: 1
                    },
                    categories: {
                        _id: 1,
                        name: 1,
                        slug: 1
                    },
                    images: 1,
                    basePrice: 1,
                    mrp: 1,
                    stockQuantity: 1,
                    averageRating: 1,
                    totalReviews: 1,
                    condition: 1,
                    variantConfiguration: 1,
                    variants: {
                        $filter: {
                            input: '$variants',
                            as: 'variant',
                            cond: { $eq: ['$$variant.isActive', true] }
                        }
                    }
                }
            },
            { $limit: parseInt(limit) }
        ]);
        const enrichedProducts = linkedProducts.map(product => {
            // Calculate total stock including variants
            let totalStock = product.stockQuantity || 0;

            if (product.variants && product.variants.length > 0) {
                totalStock = product.variants.reduce((sum, variant) => {
                    return sum + (variant.stockQuantity || 0);
                }, 0);
            }

            // Calculate prices
            let sellingPrice = product.basePrice || 0;
            if (product.variants && product.variants.length > 0) {
                const variantPrices = product.variants.map(v => v.price || product.basePrice || 0);
                sellingPrice = Math.min(...variantPrices);
            }

            const discountPercentage = product.mrp && product.mrp > sellingPrice
                ? Math.round(((product.mrp - sellingPrice) / product.mrp) * 100)
                : 0;

            return {
                ...product,
                totalStock,
                stockStatus: totalStock > 0 ? 'in-stock' : 'out-of-stock',
                sellingPrice,
                lowestPrice: sellingPrice,
                discountPercentage,
                priceRange: {
                    min: sellingPrice,
                    max: product.basePrice || sellingPrice,
                    hasRange: product.variants && product.variants.length > 1
                },
                isOnSale: discountPercentage > 0,
                displayMrp: product.mrp || product.basePrice,
                primaryImage: product.images?.thumbnail || product.images?.gallery?.[0] || {}
            };
        });

        res.status(200).json({
            success: true,
            message: 'Linked products fetched successfully',
            data: {
                linkedProducts: enrichedProducts,
                total: enrichedProducts.length
            }
        });

    } catch (error) {
        console.error('Error in getLinkedProducts:', error);
        return next(new ErrorHandler('Internal server error while fetching linked products', 500));
    }
});
/**
 * 🎯 GET NEW ARRIVALS (Keep this separate)
 */
exports.getNewArrivals = catchAsyncErrors(async (req, res, next) => {
    try {
        const { limit = 12 } = req.query;

        // Use unified endpoint with new arrivals criteria
        req.query.sort = 'newest';
        req.query.limit = limit;

        return exports.getProducts(req, res, next);

    } catch (error) {
        console.error('Error in getNewArrivals:', error);
        return next(new ErrorHandler('Internal server error while fetching new arrivals', 500));
    }
});



exports.getProductVariants = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(id, "variants");
    if (!product) return next(new ErrorHandler("Product not found", 404));

    res.status(200).json({ success: true, variants: product.variants || [] });
});
;

// 🆕 ADD: Process variant images for create (same as update)
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

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    const parseJSON = (field, fallback) => {
        if (!req.body[field]) return fallback;
        try {
            return typeof req.body[field] === "string"
                ? JSON.parse(req.body[field])
                : req.body[field];
        } catch (err) {
            console.warn(`Failed to parse ${field}:`, err.message);
            return fallback;
        }
    };
    if (!processProductImages || !processManufacturerImages || !processVariantImages) {
        console.error('❌ Missing required image processing functions');
        return next(new ErrorHandler("Server configuration error", 500));
    }

    const parseNumber = (value, fieldName, { required = false, min = 0 } = {}) => {
        if (value === undefined || value === null || value === "") {
            if (required) throw new Error(`${fieldName} is required`);
            return undefined;
        }
        const num = Number(value);
        if (Number.isNaN(num)) throw new Error(`${fieldName} must be a valid number`);
        if (min !== undefined && num < min)
            throw new Error(`${fieldName} cannot be less than ${min}`);
        return num;
    };

    // -----------------------------
    // 2) Parse collections
    // -----------------------------
    const categoriesRaw = parseJSON("categories", []);
    const tags = parseJSON("tags", []);
    const variantConfigRaw = parseJSON("variantConfiguration", { hasVariants: false });
    const variantsInput = parseJSON("variants", []);
    const specs = parseJSON("specifications", []);
    const features = parseJSON("features", []);
    const dims = parseJSON("dimensions", {});
    const weight = parseJSON("weight", {});
    const meta = parseJSON("meta", {});
    const linked = parseJSON("linkedProducts", []);

    // -----------------------------
    // 3) Basic field extraction / validation
    // -----------------------------
    const name = req.body.name?.trim();
    const brand = req.body.brand?.trim();
    const description = req.body.description?.trim();
    const definition = (req.body.definition || "").trim();
    const condition = req.body.condition || "New";
    const label = (req.body.label || "").trim();
    const status = req.body.status || "Published";
    const hsn = (req.body.hsn || "").trim();
    const warranty = (req.body.warranty || "").trim();
    const notes = (req.body.notes || "").trim();
    const canonicalUrl = (req.body.canonicalUrl || "").trim();
    const sku = req.body.sku?.trim();
    const barcode = req.body.barcode?.trim();
    const isActive =
        req.body.isActive === undefined ? true : String(req.body.isActive) === "true" || req.body.isActive === true;

    if (!name || !brand || !description) {
        return next(new ErrorHandler("Name, Brand, and Description are required", 400));
    }

    if (!Array.isArray(categoriesRaw) || categoriesRaw.length === 0) {
        return next(new ErrorHandler("At least one category is required", 400));
    }


    // -----------------------------
    // 4) Process images (Multer + URLs)
    // -----------------------------
    const productImagesRaw = processProductImages(req, req.body);
    const manufacturerImagesRaw = processManufacturerImages(
        req,
        parseJSON("manufacturerImageUrls", [])
    );

    if (!productImagesRaw?.thumbnail?.url) {
        return next(new ErrorHandler("Product thumbnail image is required", 400));
    }

    // Build final DB-compatible structure (NOW name exists)
    const productImages = {
        thumbnail: {
            url: productImagesRaw.thumbnail.url,
            altText:
                req.body.thumbnailAlt ||
                productImagesRaw.thumbnail.altText ||
                `${name} thumbnail`,
        },
        hoverImage: productImagesRaw.hoverImage
            ? {
                url: productImagesRaw.hoverImage.url,
                altText:
                    req.body.hoverImageAlt ||
                    productImagesRaw.hoverImage.altText ||
                    `${name} hover image`,
            }
            : null,
        gallery: Array.isArray(productImagesRaw.gallery)
            ? productImagesRaw.gallery.map((img, index) => ({
                url: img.url,
                altText: img.altText || `${name} image ${index + 1}`,
            }))
            : [],
    };

    const manufacturerImages = Array.isArray(manufacturerImagesRaw)
        ? manufacturerImagesRaw.map((img, index) => ({
            url: img.url,
            altText: img.altText || `${name} manufacturer image ${index + 1}`,
            sectionTitle: img.sectionTitle || "",
        }))
        : [];


    // -----------------------------
    // 5) Resolve brand
    // -----------------------------
    let brandId;
    if (mongoose.Types.ObjectId.isValid(brand)) {
        brandId = brand;
    } else {
        const brandDoc = await brandModel.findOne({
            name: { $regex: new RegExp(`^${brand}$`, "i") }
        });
        if (!brandDoc) {
            return next(
                new ErrorHandler(
                    `Brand '${brand}' not found. Please create it first.`,
                    400
                )
            );
        }
        brandId = brandDoc._id;
    }

    // -----------------------------
    // 6) Resolve categories
    // -----------------------------
    const categoryIds = [];
    for (const category of categoriesRaw) {
        if (mongoose.Types.ObjectId.isValid(category)) {
            categoryIds.push(category);
        } else {
            const categoryDoc = await categoryModel.findOne({
                name: { $regex: new RegExp(`^${category}$`, "i") }
            });
            if (!categoryDoc) {
                return next(
                    new ErrorHandler(
                        `Category '${category}' not found. Please create it first.`,
                        400
                    )
                );
            }
            categoryIds.push(categoryDoc._id);
        }
    }

    // -----------------------------
    // 7) Variant processing
    // -----------------------------
    const hasVariants = variantConfigRaw.hasVariants === true;
    let processedVariants = [];

    if (hasVariants) {
        if (!Array.isArray(variantsInput) || variantsInput.length === 0) {
            return next(
                new ErrorHandler(
                    "Variants array is required when hasVariants is true",
                    400
                )
            );
        }

        // 🆕 PROCESS VARIANT IMAGES FROM FILES
        let variantsWithImages = variantsInput;
        try {
            variantsWithImages = processVariantImages(req, variantsInput);
        } catch (error) {
            console.warn('Failed to process variant images:', error.message);
        }

        const seenNames = new Set();

        for (let i = 0; i < variantsWithImages.length; i++) {
            const v = variantsWithImages[i];

            const variantName = v.name?.trim();
            if (!variantName) {
                return next(
                    new ErrorHandler(`Variant #${i + 1} must have a valid name`, 400)
                );
            }
            if (seenNames.has(variantName)) {
                return next(
                    new ErrorHandler(`Duplicate variant name: '${variantName}'`, 400)
                );
            }
            seenNames.add(variantName);

            let price, mrp, stockQuantity;
            try {
                price = parseNumber(v.price, `Variant '${variantName}' price`, {
                    required: true,
                    min: 0
                });

                if (v.mrp !== undefined && v.mrp !== null && v.mrp !== "") {
                    mrp = parseNumber(v.mrp, `Variant '${variantName}' MRP`, {
                        required: false,
                        min: 0
                    });
                    if (mrp < price) {
                        mrp = price;
                    }
                } else {
                    mrp = price;
                }

                stockQuantity =
                    v.stockQuantity !== undefined && v.stockQuantity !== null && v.stockQuantity !== ""
                        ? parseNumber(
                            v.stockQuantity,
                            `Variant '${variantName}' stockQuantity`,
                            { required: false, min: 0 }
                        )
                        : 0;
            } catch (err) {
                return next(new ErrorHandler(err.message, 400));
            }

            const variantImages = {
                thumbnail: null,
                gallery: []
            };

            // Check for variant-specific images
            if (v.images && typeof v.images === "object") {
                // Thumbnail
                if (v.images.thumbnail) {
                    if (typeof v.images.thumbnail === 'object' && v.images.thumbnail.url) {
                        variantImages.thumbnail = {
                            url: v.images.thumbnail.url,
                            altText: v.images.thumbnail.altText || `Variant ${variantName} thumbnail`
                        };
                    } else if (typeof v.images.thumbnail === 'string' && v.images.thumbnail.trim() !== '') {
                        variantImages.thumbnail = {
                            url: v.images.thumbnail,
                            altText: `Variant ${variantName} thumbnail`
                        };
                    }
                }

                // Gallery
                if (Array.isArray(v.images.gallery) && v.images.gallery.length > 0) {
                    variantImages.gallery = v.images.gallery
                        .filter(img => img && (typeof img === 'object' ? img.url : img))
                        .map((img) => ({
                            url: typeof img === 'object' ? img.url : img,
                            altText: (typeof img === 'object' ? img.altText : `Variant ${variantName} image`) ||
                                `Variant ${variantName} image`
                        }));
                }
            }

            // 🆕 ONLY fallback to product images if variant has NO images at all
            const hasVariantImages = variantImages.thumbnail || variantImages.gallery.length > 0;

            if (!hasVariantImages && productImages.thumbnail?.url) {
                // Use product thumbnail as fallback
                variantImages.thumbnail = {
                    url: productImages.thumbnail.url,
                    altText: `Variant ${variantName} - ${productImages.thumbnail.altText}`
                };

                // Use product gallery as fallback
                if (productImages.gallery.length > 0) {
                    variantImages.gallery = productImages.gallery.map((img, index) => ({
                        url: img.url,
                        altText: `Variant ${variantName} - ${img.altText}`
                    }));
                }
            }

            processedVariants.push({
                name: variantName,
                price,
                mrp,
                stockQuantity,
                sku: v.sku || undefined,
                barcode: v.barcode || undefined,
                isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
                identifyingAttributes: Array.isArray(v.identifyingAttributes)
                    ? v.identifyingAttributes
                    : [],
                specifications: Array.isArray(v.specifications)
                    ? v.specifications
                    : [],
                images: variantImages  // 🆕 Now contains variant-specific images
            });
        }
    }
    // -----------------------------
    // 8) Product-level pricing / stock
    // -----------------------------
    let basePrice;
    let productMrp;
    let productStock;
    let taxRateValue = 0;

    if (!hasVariants) {
        basePrice = parseNumber(req.body.basePrice, "Base Price", {
            required: true,
            min: 0,
        });

        productMrp = parseNumber(req.body.mrp, "MRP", {
            required: false,
            min: basePrice
        });

        productStock = parseNumber(req.body.stockQuantity, "Stock Quantity", {
            required: false,
            min: 0,
        });
    } else {
        const activeVariants = processedVariants.filter(v => v.isActive);
        const priceSource = activeVariants.length > 0 ? activeVariants : processedVariants;

        basePrice = Math.min(...priceSource.map(v => v.price));
        productMrp = Math.max(...priceSource.map(v => v.mrp || v.price));
        productStock = priceSource.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }

    // convert values safely
    basePrice = Number(basePrice);
    productMrp = Number(productMrp);
    productStock = Number(productStock);

    // tax (optional)
    if (req.body.taxRate !== undefined && req.body.taxRate !== null && req.body.taxRate !== "") {
        taxRateValue = parseNumber(req.body.taxRate, "Tax Rate", { min: 0 });
    }

    // validate again - prevent mongoose crash
    if (isNaN(basePrice)) return next(new ErrorHandler("Invalid basePrice", 400));
    if (isNaN(productMrp)) return next(new ErrorHandler("Invalid mrp", 400));
    if (isNaN(productStock)) return next(new ErrorHandler("Invalid stockQuantity", 400));
    if (productMrp < basePrice) productMrp = basePrice;

    // -----------------------------
    // 9) Variant configuration normalization
    // -----------------------------
    const variantConfiguration = {
        hasVariants,
        variantType: hasVariants
            ? variantConfigRaw.variantType || "Mixed"
            : "None",
        attributes: Array.isArray(variantConfigRaw.attributes)
            ? variantConfigRaw.attributes
            : []
    };

    // -----------------------------
    // 10) Final product payload
    // -----------------------------
    const productData = {
        name,
        brand: brandId,
        categories: categoryIds,
        description,
        definition,
        tags,
        condition,
        label,
        status,
        isActive,
        hsn,
        notes,
        canonicalUrl,

        basePrice,
        mrp: productMrp,
        taxRate: taxRateValue,
        sku: sku || undefined,
        barcode: barcode || undefined,
        stockQuantity: productStock,

        images: productImages,
        manufacturerImages,

        variantConfiguration,
        variants: processedVariants,

        specifications: specs,
        features,
        dimensions: dims,
        weight,
        warranty,
        meta,
        linkedProducts: linked,

        createdBy: req.user?._id
    };

    // -----------------------------
    // 11) Save to DB
    // -----------------------------
    try {
        const product = await Product.create(productData);
        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error("❌ Product creation failed:", error);

        if (error.code === 11000) {
            const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : "field";
            const value = error.keyValue ? error.keyValue[field] : "unknown";
            return next(
                new ErrorHandler(`Duplicate ${field}: ${value}`, 400)
            );
        }

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return next(
                new ErrorHandler(`Validation error: ${messages.join(", ")}`, 400)
            );
        }

        return next(
            new ErrorHandler(error.message || "Product creation failed", 500)
        );
    }
});



const generateVariantSKU = (productName, index) => {
    const base = productName.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 6);
    return `${base}-VAR${index + 1}`;
};

const generateVariantBarcode = () => {
    return `VAR${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

const generateSKUFromName = (name) => {
    return name.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 8) + Date.now().toString().slice(-4);
};

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

const getColorHexCode = (colorName) => {
    const colorMap = {
        'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'yellow': '#ca8a04',
        'black': '#000000', 'white': '#ffffff', 'gray': '#6b7280', 'purple': '#9333ea',
        'pink': '#db2777', 'orange': '#ea580c', 'space black': '#1D1D1F', 'silver': '#E2E2E2',
        'space gray': '#535353', 'gold': '#ffd700', 'rose gold': '#b76e79'
    };
    return colorMap[colorName.toLowerCase()] || '#6b7280';
};

exports.addMultipleProducts = async (req, res, next) => {
    try {
        const products = req.body.products;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: "No products provided." });
        }

        const slugsSet = new Set(); // to track batch duplicates
        const alreadyPresent = [];  // to store products that exist
        const toInsert = [];        // products that can be inserted

        // --- 1. Get Existing Products for Conflict Check ---
        // We only need the name and slug from the DB
        const existingProducts = await Product.find({}, "name slug").lean();
        const existingNamesSet = new Set(existingProducts.map(p => p.name.trim()));
        const existingSlugSet = new Set(existingProducts.map(p => p.slug));

        for (let p of products) {
            const trimmedName = p.name?.trim();
            if (!trimmedName || !p.brand || !p.categories || p.categories.length === 0) {
                // Skip or log products missing essential fields (Name, Brand, Category)
                console.warn(`Skipping product due to missing fields: ${p.name}`);
                continue;
            }

            // --- 2. Check for Name Conflict in DB ---
            if (existingNamesSet.has(trimmedName)) {
                alreadyPresent.push(trimmedName);
                continue; // Skip adding to DB
            }

            // --- 3. Slug Generation and Uniqueness Check ---
            let baseSlug = trimmedName.toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "") || "product";

            let slug = baseSlug;
            let count = 0;

            // Ensure uniqueness: check both DB and current batch
            while (existingSlugSet.has(slug) || slugsSet.has(slug)) {
                count++;
                slug = `${baseSlug}-${count}`;
            }

            slugsSet.add(slug);

            // --- 4. DATA TRANSFORMATION & SCHEMA ALIGNMENT ---

            // A. Attach the generated slug
            p.slug = slug;

            // B. Consolidate Images into the nested structure 💡
            const { thumbnail, hoverImage, gallery, ...rest } = p;
            p = rest; // p now contains all non-image fields
            p.images = {
                thumbnail,
                hoverImage: hoverImage || {},
                gallery: gallery || []
            };

            // C. Clean Price and Ratings Logic (Keep only what Mongoose hooks need)

            // Mongoose hooks will handle offerPrice calculation from basePrice and discountPercentage.
            // If p.reviews exists, calculate ratings (simplified from original)
            if (p.reviews?.length > 0) {
                const totalRating = p.reviews.reduce((sum, r) => sum + r.rating, 0);
                p.ratings = {
                    count: p.reviews.length,
                    average: parseFloat((totalRating / p.reviews.length).toFixed(2))
                };
                delete p.reviews; // remove reviews array to prevent saving it if not part of schema
            } else {
                p.ratings = { count: 0, average: 0 };
            }

            // D. Set default isActive if not present
            p.isActive = p.isActive !== undefined ? p.isActive : true;

            toInsert.push(p);
        }

        // --- 5. Bulk Insertion ---
        const createdProducts = toInsert.length > 0 ? await Product.insertMany(toInsert, { ordered: false }) : [];
        // Using { ordered: false } allows successful inserts to complete even if one product fails validation

        // --- 6. Response ---
        res.status(201).json({
            success: true,
            message: `${createdProducts.length} products added successfully! ${toInsert.length - createdProducts.length} failed to insert.`,
            productsAdded: createdProducts.map(p => ({ name: p.name, slug: p.slug, id: p._id })),
            alreadyPresent: alreadyPresent.length > 0 ? `These products were already present (skipped): ${alreadyPresent.join(", ")}` : undefined
        });

    } catch (error) {
        // Handle bulk validation errors or database errors
        if (error.name === 'MongoBulkWriteError' || error.name === 'ValidationError') {
            // You can refine this to extract specific errors for better reporting
            return res.status(400).json({ success: false, message: "One or more products failed Mongoose validation during insertion.", details: error.message });
        }
        next(error);
    }
};
// ADMIN: Get all products (admin view)

// =====================================================
// GET ALL PRODUCTS (Admin - includes inactive products)
// =====================================================
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const {
        page = 1,
        limit = 12,
        sort = 'newest',
        search,
        category,
        brand,
        status,
        inStock
    } = req.query;

    // Build filter
    const filter = {};

    // Search - create separate search filter
    if (search) {
        const searchTerm = search.replace(/\+/g, ' ').trim();

        filter.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { sku: { $regex: searchTerm, $options: 'i' } },
            { 'variants.name': { $regex: searchTerm, $options: 'i' } },
            { 'variants.sku': { $regex: searchTerm, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        filter.categories = { $in: [category] };
    }

    // Brand filter
    if (brand) {
        filter.brand = brand;
    }

    // Status filter
    if (status) {
        filter.status = status;
    }

    // Stock filter - handle separately without overwriting $or
    let stockFilter = {};
    if (inStock === 'true') {
        stockFilter = {
            $or: [
                { stockQuantity: { $gt: 0 } },
                { 'variants.stockQuantity': { $gt: 0 } }
            ]
        };
    } else if (inStock === 'false') {
        stockFilter = {
            $and: [
                { stockQuantity: { $lte: 0 } },
                {
                    $or: [
                        { variants: { $size: 0 } },
                        { 'variants.stockQuantity': { $lte: 0 } }
                    ]
                }
            ]
        };
    }

    // Combine filters
    const finalFilter = { ...filter };
    if (Object.keys(stockFilter).length > 0) {
        if (finalFilter.$or && stockFilter.$or) {
            // If both have $or, combine them with $and
            finalFilter.$and = [
                { $or: finalFilter.$or },
                { $or: stockFilter.$or }
            ];
            delete finalFilter.$or;
        } else if (finalFilter.$or && stockFilter.$and) {
            finalFilter.$and = [
                { $or: finalFilter.$or },
                ...stockFilter.$and
            ];
            delete finalFilter.$or;
        } else {
            Object.assign(finalFilter, stockFilter);
        }
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort options
    const sortOptions = {
        'newest': { createdAt: -1 },
        'oldest': { createdAt: 1 },
        'name-asc': { name: 1 },
        'name-desc': { name: -1 },
        'price-asc': { basePrice: 1 },
        'price-desc': { basePrice: -1 },
        'stock-asc': { stockQuantity: 1 },
        'stock-desc': { stockQuantity: -1 }
    };

    const sortConfig = sortOptions[sort] || { createdAt: -1 };

    // Execute query
    const products = await Product.find(finalFilter)
        .select('name slug brand categories tags condition label isActive status description definition images basePrice mrp offerPrice discountPercentage taxRate sku barcode stockQuantity variantConfiguration variants specifications features dimensions weight warranty reviews averageRating totalReviews meta canonicalUrl linkedProducts notes hsn manufacturerImages createdAt updatedAt')
        .populate("categories", "name slug")
        .populate("brand", "name slug")
        .sort(sortConfig)
        .skip(skip)
        .limit(Number(limit));

    const totalProducts = await Product.countDocuments(finalFilter);

    res.status(200).json({
        success: true,
        results: products.length,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: Number(page),
        products
    });
});

exports.getProductsForSelection = catchAsyncErrors(async (req, res, next) => {
    const { search, category, brand, inStock } = req.query;

    const filter = {
        isActive: true,
        status: 'Published'
    };

    // Search filter
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        filter.categories = { $in: [category] };
    }

    // Brand filter
    if (brand) {
        filter.brand = brand;
    }

    // Stock filter
    if (inStock === 'true') {
        filter.$or = [
            { stockQuantity: { $gt: 0 } },
            { 'variants.stockQuantity': { $gt: 0 } }
        ];
    }

    const products = await Product.find(filter)
        .select('name sku images basePrice offerPrice stockQuantity brand categories isActive status')
        .populate('brand', 'name')
        .populate('categories', 'name')
        .sort({ name: 1 })
        .limit(50); // Limit for performance

    res.status(200).json({
        success: true,
        count: products.length,
        products
    });
});
// ADMIN: Get single product by ID

exports.getAdminProductById = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// Add to productController.js
exports.getProductAnalytics = catchAsyncErrors(async (req, res, next) => {
    // Total products
    const totalProducts = await Product.countDocuments();

    // Low stock products (stock < 10)
    const lowStockItems = await Product.countDocuments({
        $or: [
            { stockQuantity: { $lt: 10 } },
            { 'variants.stockQuantity': { $lt: 10 } }
        ]
    });

    // Out of stock products
    const outOfStockItems = await Product.countDocuments({
        $or: [
            { stockQuantity: { $lte: 0 } },
            {
                $and: [
                    { variants: { $exists: true, $ne: [] } },
                    { 'variants.stockQuantity': { $lte: 0 } }
                ]
            }
        ]
    });

    // Active products
    const activeProducts = await Product.countDocuments({
        status: 'active',
        isActive: true
    });

    // Top selling products (you might need to enhance this with actual sales data)
    const topSellingProducts = await Product.find({
        status: 'active'
    })
        .select('name images slug basePrice stockQuantity totalReviews averageRating')
        .sort({ totalReviews: -1 })
        .limit(5)
        .populate('categories', 'name')
        .populate('brand', 'name');

    res.status(200).json({
        success: true,
        data: {
            totalProducts,
            lowStockItems,
            outOfStockItems,
            activeProducts,
            inactiveProducts: totalProducts - activeProducts,
            topSellingProducts: topSellingProducts.map(product => ({
                id: product._id,
                name: product.name,
                image: product.images?.[0]?.url || null,
                price: product.basePrice,
                stock: product.stockQuantity,
                reviews: product.totalReviews || 0,
                rating: product.averageRating || 0,
                category: product.categories?.[0]?.name || 'Uncategorized',
                brand: product.brand?.name || 'No Brand'
            }))
        }
    });
});


// ADMIN: Delete product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});


// ADMIN: Add variant to a product

exports.addVariant = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const { name, price, stock, attributes } = req.body;
    if (!name || price == null || stock == null) {
        return next(new ErrorHandler("Variant name, price, and stock are required.", 400));
    }

    const variant = {
        _id: new mongoose.Types.ObjectId(),
        name,
        price,
        stock,
        attributes: attributes || {},
    };

    product.variants.push(variant);
    await product.save();

    res.status(201).json({
        success: true,
        message: "Variant added successfully",
        variant,
    });
});


// ADMIN: Update variant

exports.updateVariant = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return next(new ErrorHandler("Variant not found", 404));
    }

    const { name, price, stock, attributes } = req.body;
    if (name !== undefined) variant.name = name;
    if (price !== undefined) variant.price = price;
    if (stock !== undefined) variant.stock = stock;
    if (attributes !== undefined) variant.attributes = attributes;

    await product.save();

    res.status(200).json({
        success: true,
        message: "Variant updated successfully",
        variant,
    });
});


// ADMIN: Delete variant

exports.deleteVariant = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return next(new ErrorHandler("Variant not found", 404));
    }

    variant.deleteOne();
    await product.save();

    res.status(200).json({
        success: true,
        message: "Variant deleted successfully",
    });
});

// Even better - normalize the status in the query
exports.getProductsByIds = catchAsyncErrors(async (req, res, next) => {
    const { ids } = req.query;
    if (!ids) {
        return next(new ErrorHandler('Product IDs are required', 400));
    }

    const productIds = Array.isArray(ids) ? ids : ids.split(',');
    const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
        return res.status(200).json({
            success: true,
            count: 0,
            products: []
        });
    }

    try {
        // 🆕 BEST FIX: Use regex for case-insensitive status matching
        const products = await Product.find({
            _id: { $in: validIds },
            isActive: true,
            status: { $regex: /^published$/i } // Case insensitive match
        })
            .populate('brand', 'name slug')
            .populate('categories', 'name slug')
            .select('name slug brand categories images basePrice offerPrice discountPercentage stockQuantity variants variantConfiguration averageRating totalReviews tags isActive status condition')
            .limit(50);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error('💥 Database error:', error);
        return next(new ErrorHandler('Database error while fetching products', 500));
    }
});
