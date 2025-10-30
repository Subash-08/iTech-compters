const mongoose = require('mongoose');
const { Schema } = mongoose;

// Custom validator for integer enforcement
const integerValidator = {
    validator: Number.isInteger,
    message: '{VALUE} is not an integer number.'
};

// 🖼️ Image Schema
const imageSchema = new Schema({
    url: { type: String, required: true },
    altText: { type: String, trim: true, required: true },
}, { _id: false });

// ⚙️ Specification Schema
const specificationSchema = new Schema({
    sectionTitle: { type: String, trim: true },
    specs: [{ key: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } }],
}, { _id: false });

// 🎨 ENHANCED Variant Schema with Color Support
const variantSchema = new Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, trim: true, sparse: true },
    barcode: { type: String, unique: true, trim: true, sparse: true },
    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0, default: 0 },
    stockQuantity: {
        type: Number,
        min: 0,
        default: 0,
        validate: integerValidator
    },
    // 🆕 ENHANCED: Color support in identifying attributes
    identifyingAttributes: [{
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        displayValue: { type: String, trim: true },
        // 🆕 Simple color properties
        hexCode: { type: String, trim: true }, // For color swatches
        isColor: { type: Boolean, default: false } // Auto-detected
    }],
    // 🆕 ENHANCED: Variant-specific images (different for each color)
    images: {
        thumbnail: imageSchema,
        gallery: [imageSchema], // Different gallery for each color variant
    },
    isActive: { type: Boolean, default: true },
    specifications: [specificationSchema]
}, { _id: true });

// 🌟 Feature Schema
const featureSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
}, { _id: false });

// 🧠 ENHANCED Main Product Schema with Color Support
const productSchema = new Schema({
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true }],
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    condition: { type: String, enum: ['New', 'Used', 'Refurbished'], default: 'New' },
    label: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ['Draft', 'Published', 'OutOfStock', 'Archived', 'Discontinued'], index: true },
    description: { type: String, trim: true },
    definition: { type: String, trim: true },
    // 🆕 Base images (fallback when variant doesn't have specific images)
    images: {
        thumbnail: imageSchema,
        hoverImage: imageSchema,
        gallery: [imageSchema],
    },
    basePrice: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0, default: 0 },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    taxRate: { type: Number, min: 0, default: 0 },
    sku: { type: String, unique: true, trim: true, sparse: true },
    barcode: { type: String, unique: true, trim: true, sparse: true },
    stockQuantity: {
        type: Number,
        min: 0,
        default: 0,
        validate: integerValidator
    },
    // 🆕 ENHANCED: Simplified variant configuration for colors
    variantConfiguration: {
        hasVariants: { type: Boolean, default: false },
        variantType: {
            type: String,
            enum: ['None', 'Specifications', 'Attributes', 'Mixed', 'Color'],
            default: 'None' // 🆕 Added 'Color' type
        },
        // For technical specs (RAM, Storage, etc.)
        variantCreatingSpecs: [{
            sectionTitle: { type: String, trim: true },
            specKey: { type: String, trim: true },
            specLabel: { type: String, trim: true },
            possibleValues: [{ type: String, trim: true }]
        }],
        // 🆕 SIMPLIFIED: For colors - just type color names
        variantAttributes: [{
            key: { type: String, trim: true, default: 'color' },
            label: { type: String, trim: true, default: 'Color' },
            values: [{
                type: String,
                trim: true,
                required: true
            }]
        }]
    },
    variants: [variantSchema],
    specifications: [specificationSchema],
    features: [featureSchema],
    dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: { type: String, enum: ['cm', 'in', 'm'], default: 'cm' },
    },
    weight: {
        value: { type: Number, min: 0 },
        unit: { type: String, enum: ['g', 'kg', 'lb', 'oz'], default: 'kg' },
    },
    warranty: { type: String, trim: true },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, min: 0, default: 0 },
    meta: {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        keywords: [{ type: String, trim: true }],
    },
    canonicalUrl: { type: String, trim: true },
    linkedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    notes: { type: String, trim: true },
}, { timestamps: true, toJSON: { virtuals: true }, strictPopulate: false });

// =============================================
// 🎯 VIRTUAL FIELDS (UPDATED)
// =============================================

productSchema.virtual('totalStock').get(function () {
    return (this.variantConfiguration.hasVariants && this.variants.length > 0)
        ? this.variants.reduce((sum, v) => sum + v.stockQuantity, 0)
        : this.stockQuantity;
});

productSchema.virtual('lowestPrice').get(function () {
    if (this.variantConfiguration.hasVariants && this.variants.length > 0) {
        const prices = this.variants.map(v => (v.offerPrice > 0 ? v.offerPrice : v.price) || Infinity);
        return Math.min(...prices);
    }
    return (this.offerPrice > 0 && this.offerPrice < this.basePrice) ? this.offerPrice : this.basePrice;
});

productSchema.virtual('variantOptions').get(function () {
    if (!this.variantConfiguration.hasVariants) return {};

    const options = {};
    this.variantConfiguration.variantCreatingSpecs.forEach(spec => {
        options[spec.specKey] = {
            label: spec.specLabel,
            values: [...new Set(this.variants
                .map(v => v.identifyingAttributes.find(a => a.key === spec.specKey)?.value)
                .filter(Boolean)
            )]
        };
    });
    return options;
});

// =============================================
// 🎯 MIDDLEWARE (UPDATED)
// =============================================

// Pre-validate: Generate unique slug
productSchema.pre('validate', async function (next) {
    if (!this.isModified('name') && (this.slug || !this.isNew)) return next();

    if (!this.name || this.name.trim() === '') {
        return next(new mongoose.Error.ValidatorError({ message: 'Product name is required to generate slug.' }));
    }

    let baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (!baseSlug) {
        const uniqueSuffix = this._id ? this._id.toString().slice(-6) : Math.random().toString(36).substring(2, 8);
        baseSlug = `product-sku-${uniqueSuffix}`;
    }

    let slug = baseSlug;
    let count = 0;

    const query = { slug };
    if (this._id) {
        query._id = { $ne: this._id };
    }

    while (await this.constructor.findOne(query)) {
        count++;
        slug = `${baseSlug}-${count}`;
    }
    this.slug = slug;
    next();
});

// Pre-save: Calculate offerPrice, update status
productSchema.pre('save', function (next) {
    // Pricing logic
    if (this.isModified('basePrice') || this.isModified('discountPercentage')) {
        this.offerPrice = this.basePrice * (1 - (this.discountPercentage / 100));
        if (this.offerPrice < 0) this.offerPrice = 0;
    }

    // Stock/status logic - use variantConfiguration.hasVariants
    if (this.isModified('stockQuantity') || this.isModified('variants') || this.isNew) {
        const totalStock = this.totalStock;

        if (this.status === 'Published' && totalStock <= 0) {
            this.status = 'OutOfStock';
        } else if (this.status === 'OutOfStock' && totalStock > 0) {
            if (['Archived', 'Discontinued'].includes(this.status) === false) {
                this.status = 'Published';
            }
        }
    }
    next();
});

// Virtual for reviews from separate collection
productSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'product'
});

// FIXED updateReviewStats method in productModel.js
productSchema.methods.updateReviewStats = async function () {
    const Review = mongoose.model('Review');

    try {
        const reviewStats = await Review.aggregate([
            {
                $match: {
                    product: this._id,
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: '$product',
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        if (reviewStats.length > 0) {
            this.totalReviews = reviewStats[0].totalReviews;
            this.averageRating = parseFloat(reviewStats[0].averageRating.toFixed(1));
        } else {
            // If no reviews, reset to 0
            this.totalReviews = 0;
            this.averageRating = 0;
        }

        await this.save();
        console.log(`✅ Updated review stats for ${this.name}: ${this.averageRating} avg, ${this.totalReviews} total`);
        return this;
    } catch (error) {
        console.error('❌ Error updating review stats:', error);
        throw error;
    }
};

// 🆕 NEW: Static method to update review stats for a product
productSchema.statics.updateProductReviewStats = async function (productId) {
    const product = await this.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }
    return await product.updateReviewStats();
};
// =============================================
// 🎯 HELPER METHODS (MISSING METHODS ADDED)
// =============================================

// Generate variant name from attributes
productSchema.methods.generateVariantName = function (combination) {
    const attributeStrings = combination.map(attr =>
        `${attr.label}: ${attr.value}`
    );
    return `${this.name} - ${attributeStrings.join(' | ')}`;
};

// Generate SKU from combination
productSchema.methods.generateVariantSKU = function (combination) {
    const baseSKU = this.sku || this.name.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 6);
    const variantCodes = combination.map(attr =>
        attr.value.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 3)
    );
    return `${baseSKU}-${variantCodes.join('-')}`;
};

// Format identifying attributes
productSchema.methods.formatIdentifyingAttributes = function (combination) {
    return combination.map(attr => ({
        key: attr.key,
        label: attr.label,
        value: attr.value,
        displayValue: attr.value // Can be customized
    }));
};

// Generate variant-specific specifications
productSchema.methods.generateVariantSpecifications = function (combination) {
    const variantSpecs = [];

    combination.forEach(attr => {
        variantSpecs.push({
            sectionTitle: attr.label,
            specs: [
                { key: attr.key, value: attr.value }
            ]
        });
    });

    return variantSpecs;
};

// =============================================
// 🎯 INSTANCE METHODS (UPDATED)
// =============================================

// Generate variants from configuration
productSchema.methods.generateVariants = function (baseVariantData = {}) {
    if (!this.variantConfiguration.hasVariants) {
        throw new Error('Product is not configured for variants');
    }

    const variantSpecs = this.variantConfiguration.variantCreatingSpecs;
    const allCombinations = this.generateAttributeCombinations(variantSpecs);

    this.variants = allCombinations.map(combination => {
        const variantName = this.generateVariantName(combination);
        const attributes = this.formatIdentifyingAttributes(combination);

        return {
            name: variantName,
            identifyingAttributes: attributes,
            price: this.basePrice,
            stockQuantity: 0,
            sku: this.generateVariantSKU(combination),
            specifications: this.generateVariantSpecifications(combination),
            ...baseVariantData
        };
    });

    this.variantConfiguration.hasVariants = true;
    this.markModified('variants');
};

// Generate all possible combinations of variant attributes
productSchema.methods.generateAttributeCombinations = function (variantSpecs) {
    const combinations = [];

    function generateRecursive(current, index) {
        if (index === variantSpecs.length) {
            combinations.push([...current]);
            return;
        }

        const spec = variantSpecs[index];
        for (const value of spec.possibleValues) {
            current.push({
                key: spec.specKey,
                label: spec.specLabel,
                value: value
            });
            generateRecursive(current, index + 1);
            current.pop();
        }
    }

    generateRecursive([], 0);
    return combinations;
};

// Add variant (UPDATED for consistent naming)
productSchema.methods.addVariant = function (variant) {
    if (!variant.name || typeof variant.price !== 'number' || variant.price < 0 || !variant.identifyingAttributes || !variant.identifyingAttributes.length) {
        throw new Error('Variant must have a name, valid price (>= 0), and at least one identifying attribute.');
    }
    if (variant.sku && this.variants.some(v => v.sku === variant.sku)) {
        throw new Error(`Variant SKU "${variant.sku}" already exists.`);
    }

    this.variants.push(variant);
    this.variantConfiguration.hasVariants = true;
    this.markModified('variants');
};

// Find variant by specific attributes (UPDATED for consistent naming)
productSchema.methods.findVariantByAttributes = function (attributes) {
    return this.variants.find(variant =>
        variant.identifyingAttributes.every(attr =>
            attributes[attr.key] === attr.value
        )
    );
};

// Find variant (legacy method - UPDATED for consistent naming)
productSchema.methods.findVariant = function (attributes) {
    if (!attributes || typeof attributes !== 'object' || Object.keys(attributes).length === 0) {
        throw new Error('Attributes must be a non-empty object with key-value pairs.');
    }
    return this.variants.find(v =>
        v.identifyingAttributes.every(attr => attributes[attr.key] === attr.value)
    );
};

// 🆕 NEW: Bulk update variant prices
productSchema.methods.updateVariantsPricing = function (priceUpdate) {
    if (!this.variantConfiguration.hasVariants) {
        throw new Error('Product does not have variants');
    }

    this.variants.forEach(variant => {
        if (priceUpdate.type === 'fixed') {
            variant.price = priceUpdate.value;
        } else if (priceUpdate.type === 'percentage') {
            variant.price = this.basePrice * (1 + priceUpdate.value / 100);
        } else if (priceUpdate.type === 'increase_fixed') {
            variant.price += priceUpdate.value;
        } else if (priceUpdate.type === 'decrease_fixed') {
            variant.price -= priceUpdate.value;
        }
        // Ensure price doesn't go below 0
        if (variant.price < 0) variant.price = 0;
    });

    this.markModified('variants');
};

// 🆕 NEW: Get variant by SKU
productSchema.methods.findVariantBySKU = function (sku) {
    return this.variants.find(v => v.sku === sku);
};

// 🆕 NEW: Check if variant combination exists
productSchema.methods.variantExists = function (attributes) {
    return this.variants.some(variant =>
        variant.identifyingAttributes.every(attr =>
            attributes[attr.key] === attr.value
        )
    );
};

// 🆕 NEW: Get available colors with stock info
productSchema.virtual('availableColors').get(function () {
    if (!this.variantConfiguration.hasVariants || !this.variants.length) return [];

    const colorMap = new Map();

    this.variants.forEach(variant => {
        const colorAttr = variant.identifyingAttributes.find(attr =>
            attr.key === 'color' || attr.isColor
        );

        if (colorAttr && variant.isActive) {
            const colorValue = colorAttr.value;
            const existing = colorMap.get(colorValue) || {
                value: colorValue,
                displayValue: colorAttr.displayValue || colorValue,
                hexCode: colorAttr.hexCode,
                stock: 0,
                variants: []
            };

            existing.stock += variant.stockQuantity;
            existing.variants.push(variant._id);
            colorMap.set(colorValue, existing);
        }
    });

    return Array.from(colorMap.values());
});

// =============================================
// 🎯 INSTANCE METHODS (Color Support)
// =============================================

/**
 * Find variant by color
 */
productSchema.methods.findVariantByColor = function (colorValue) {
    return this.variants.find(variant =>
        variant.identifyingAttributes.some(attr =>
            (attr.key === 'color' || attr.isColor) && attr.value === colorValue
        )
    );
};

/**
 * Get all variants for a specific color
 */
productSchema.methods.getVariantsByColor = function (colorValue) {
    return this.variants.filter(variant =>
        variant.identifyingAttributes.some(attr =>
            (attr.key === 'color' || attr.isColor) && attr.value === colorValue
        )
    );
};

/**
 * Get gallery images for specific color
 */
productSchema.methods.getColorGallery = function (colorValue) {
    const variant = this.findVariantByColor(colorValue);

    // Return variant-specific gallery if available
    if (variant && variant.images.gallery.length > 0) {
        return variant.images.gallery;
    }

    // Fallback to product base gallery
    return this.images.gallery;
};

/**
 * Check if color is available (has stock)
 */
productSchema.methods.isColorAvailable = function (colorValue) {
    const variants = this.getVariantsByColor(colorValue);
    return variants.some(variant => variant.stockQuantity > 0 && variant.isActive);
};

/**
 * Get total stock for a color
 */
productSchema.methods.getColorStock = function (colorValue) {
    const variants = this.getVariantsByColor(colorValue);
    return variants.reduce((total, variant) => total + variant.stockQuantity, 0);
};

/**
 * Simple method to add color variant
 */
productSchema.methods.addColorVariant = function (colorName, variantData) {
    const colorVariant = {
        name: `${this.name} - ${colorName}`,
        price: variantData.price || this.basePrice,
        stockQuantity: variantData.stockQuantity || 0,
        identifyingAttributes: [{
            key: 'color',
            label: 'Color',
            value: colorName,
            displayValue: colorName.charAt(0).toUpperCase() + colorName.slice(1),
            isColor: true,
            hexCode: variantData.hexCode || this.getColorHexCode(colorName)
        }],
        images: {
            thumbnail: variantData.thumbnail || this.images.thumbnail,
            gallery: variantData.gallery || []
        },
        ...variantData
    };

    this.variants.push(colorVariant);
    this.variantConfiguration.hasVariants = true;
    this.variantConfiguration.variantType = 'Color';

    // Auto-add color to variantAttributes if not exists
    const colorAttribute = this.variantConfiguration.variantAttributes.find(
        attr => attr.key === 'color'
    );

    if (!colorAttribute) {
        this.variantConfiguration.variantAttributes.push({
            key: 'color',
            label: 'Color',
            values: [colorName]
        });
    } else if (!colorAttribute.values.includes(colorName)) {
        colorAttribute.values.push(colorName);
    }

    this.markModified('variants');
    this.markModified('variantConfiguration');
};

/**
 * Helper to get hex code from color name
 */
productSchema.methods.getColorHexCode = function (colorName) {
    const colorMap = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'green': '#008000',
        'black': '#000000',
        'white': '#FFFFFF',
        'gray': '#808080',
        'silver': '#C0C0C0',
        'gold': '#FFD700',
        'purple': '#800080',
        'pink': '#FFC0CB',
        'orange': '#FFA500',
        'yellow': '#FFFF00',
        'brown': '#A52A2A',
        'navy': '#000080',
        'teal': '#008080',
        'maroon': '#800000'
    };

    return colorMap[colorName.toLowerCase()] || '#CCCCCC';
};
module.exports = mongoose.model('Product', productSchema);