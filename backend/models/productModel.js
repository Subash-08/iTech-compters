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

// 🏭 Manufacturer Images Schema (Simplified)
const manufacturerImageSchema = new Schema({
    url: { type: String, required: true },
    altText: { type: String, trim: true, required: true },
    sectionTitle: { type: String, trim: true }
}, { _id: false });

// ⚙️ Specification Schema
const specificationSchema = new Schema({
    sectionTitle: { type: String, trim: true },
    specs: [{ key: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } }],
}, { _id: false });

// 🎨 Variant Schema with CLEAR Pricing
const variantSchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
    sku: { type: String, unique: true, trim: true, sparse: true },
    barcode: { type: String, unique: true, trim: true, sparse: true },

    // 💰 CLEAR PRICING STRUCTURE
    price: { type: Number, required: true, min: 0 }, // Selling price (what customer pays)
    mrp: { type: Number, min: 0 }, // Maximum Retail Price (strikethrough)
    offerPrice: { type: Number, min: 0 }, // 🆕 Keep for backward compatibility

    hsn: { type: String, trim: true },
    stockQuantity: {
        type: Number,
        min: 0,
        default: 0,
        validate: integerValidator
    },
    identifyingAttributes: [{
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        displayValue: { type: String, trim: true },
        hexCode: { type: String, trim: true },
        isColor: { type: Boolean, default: false }
    }],
    images: {
        thumbnail: imageSchema,
        gallery: [imageSchema],
    },
    isActive: { type: Boolean, default: true },
    specifications: [specificationSchema]
}, { _id: true, timestamps: true });
// 🌟 Feature Schema


const featureSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
}, { _id: false });

// 🧠 Main Product Schema - SIMPLIFIED
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

    // 🖼️ IMAGES
    images: {
        thumbnail: imageSchema,
        hoverImage: { type: imageSchema, required: false },
        gallery: [imageSchema],
    },

    // 🏭 MANUFACTURER IMAGES
    manufacturerImages: [manufacturerImageSchema],

    basePrice: {
        type: Number,
        required: function () {
            return !this.variantConfiguration?.hasVariants;
        },
        min: 0
    },
    mrp: { type: Number, min: 0 }, // Maximum Retail Price

    // 🏷️ PRODUCT IDENTIFICATION
    hsn: { type: String, trim: true },
    taxRate: { type: Number, min: 0, default: 0 },
    sku: { type: String, trim: true, sparse: true, index: { unique: true, sparse: true } },
    barcode: { type: String, unique: true, trim: true, sparse: true },
    stockQuantity: {
        type: Number,
        min: 0,
        default: 0,
        validate: integerValidator
    },

    // 🔧 VARIANT CONFIGURATION (Simplified)
    variantConfiguration: {
        hasVariants: { type: Boolean, default: false },
        variantType: {
            type: String,
            enum: ['None', 'Color', 'Specifications', 'Attributes', 'Mixed'], // 🆕 UPDATED
            default: 'None'
        },
        variantCreatingSpecs: [{ // 🆕 KEEP this for backward compatibility
            sectionTitle: { type: String, trim: true },
            specKey: { type: String, trim: true },
            specLabel: { type: String, trim: true },
            possibleValues: [{ type: String, trim: true }]
        }],
        variantAttributes: [{ // 🆕 KEEP this for backward compatibility
            key: { type: String, trim: true },
            label: { type: String, trim: true },
            values: [{ type: String, trim: true }]
        }],
        attributes: [{
            key: { type: String, trim: true },
            label: { type: String, trim: true },
            values: [{ type: String, trim: true }]
        }]
    },
    variants: [variantSchema],

    // 📋 PRODUCT DETAILS
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

    // ⭐ RATINGS & REVIEWS
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, min: 0, default: 0 },

    // 🔍 SEO
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
// 🎯 UPDATED VIRTUAL FIELDS (CONSISTENT PRICING)
// =============================================

productSchema.virtual('totalStock').get(function () {
    if (this.variantConfiguration.hasVariants && this.variants.length > 0) {
        return this.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }
    return this.stockQuantity || 0;
});

// 🆕 CONSISTENT: Always use variant prices if variants exist
productSchema.virtual('sellingPrice').get(function () {
    if (this.variantConfiguration.hasVariants && this.variants.length > 0) {
        const activeVariants = this.variants.filter(v => v.isActive);
        if (activeVariants.length === 0) return this.basePrice || 0;

        const prices = activeVariants.map(v => v.price || Infinity);
        return Math.min(...prices);
    }
    return this.basePrice || 0;
});

// 🆕 CONSISTENT: Always use variant MRP if variants exist
productSchema.virtual('displayMrp').get(function () {
    if (this.variantConfiguration.hasVariants && this.variants.length > 0) {
        const activeVariants = this.variants.filter(v => v.isActive);
        if (activeVariants.length === 0) return this.mrp || this.basePrice || 0;

        const mrps = activeVariants.map(v => v.mrp || v.price || 0);
        return Math.max(...mrps);
    }
    return this.mrp || this.basePrice || 0;
});

// 🆕 Calculate discount based on MRP vs Selling Price
productSchema.virtual('discountPercentage').get(function () {
    const mrp = this.displayMrp;
    const sellingPrice = this.sellingPrice;

    if (mrp > sellingPrice && mrp > 0) {
        return Math.round(((mrp - sellingPrice) / mrp) * 100);
    }
    return 0;
});

// 🆕 Backward compatibility - alias for existing code
productSchema.virtual('lowestPrice').get(function () {
    return this.sellingPrice;
});

// 🆕 Get price range for variants
productSchema.virtual('priceRange').get(function () {
    if (!this.variantConfiguration.hasVariants || this.variants.length === 0) {
        return {
            min: this.basePrice,
            max: this.basePrice,
            hasRange: false
        };
    }

    const activeVariants = this.getActiveVariants();
    if (activeVariants.length === 0) {
        return {
            min: this.basePrice,
            max: this.basePrice,
            hasRange: false
        };
    }

    const prices = activeVariants.map(v => v.price).filter(price => price > 0);
    if (prices.length === 0) {
        return {
            min: this.basePrice,
            max: this.basePrice,
            hasRange: false
        };
    }

    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        hasRange: prices.length > 1
    };
});
// ✅ KEEP THESE - Essential for product listings
productSchema.virtual('totalStock').get(function () {
    if (this.variantConfiguration.hasVariants && this.variants.length > 0) {
        return this.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }
    return this.stockQuantity || 0;
});

// ✅ KEEP - For displaying price in listings
productSchema.virtual('sellingPrice').get(function () {
    if (this.variantConfiguration.hasVariants && this.variants.length > 0) {
        const activeVariants = this.variants.filter(v => v.isActive);
        if (activeVariants.length === 0) return this.basePrice || 0;

        const prices = activeVariants.map(v => v.price || Infinity);
        return Math.min(...prices);
    }
    return this.basePrice || 0;
});

// ✅ KEEP - For showing MRP in listings
productSchema.virtual('displayMrp').get(function () {
    if (this.variantConfiguration.hasVariants && this.variants.length > 0) {
        const activeVariants = this.variants.filter(v => v.isActive);
        if (activeVariants.length === 0) return this.mrp || this.basePrice || 0;

        const mrps = activeVariants.map(v => v.mrp || v.price || 0);
        return Math.max(...mrps);
    }
    return this.mrp || this.basePrice || 0;
});

// ✅ KEEP - For showing discount badge
productSchema.virtual('discountPercentage').get(function () {
    const mrp = this.displayMrp;
    const sellingPrice = this.sellingPrice;

    if (mrp > sellingPrice && mrp > 0) {
        return Math.round(((mrp - sellingPrice) / mrp) * 100);
    }
    return 0;
});

// Quick stock status for UI badges
productSchema.virtual('stockStatus').get(function () {
    const totalStock = this.totalStock;
    if (totalStock === 0) return 'out-of-stock';
    if (totalStock <= 10) return 'low-stock';
    return 'in-stock';
});

// Primary image with fallbacks (for listings)
productSchema.virtual('primaryImage').get(function () {
    return this.images?.thumbnail ||
        this.images?.hoverImage ||
        (this.images?.gallery?.length > 0 ? this.images.gallery[0] : null);
});

// Quick sale check (for sale badges)
productSchema.virtual('isOnSale').get(function () {
    return this.discountPercentage > 0;
});
// 🆕 Get available colors
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
                variants: [],
                slug: variant.slug
            };

            existing.stock += variant.stockQuantity;
            existing.variants.push(variant._id);
            colorMap.set(colorValue, existing);
        }
    });

    return Array.from(colorMap.values());
});

// =============================================
// 🎯 FIXED MIDDLEWARE (NO MORE SLUG REGENERATION ON EVERY SAVE)
// =============================================

// Pre-validate: Generate unique slug for product
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

productSchema.pre('save', async function (next) {
    const hasVariants = this.variantConfiguration?.hasVariants && Array.isArray(this.variants) && this.variants.length > 0;

    // 1️⃣ Variant slug + SKU logic (SIMPLIFIED)
    if (hasVariants) {
        const existingSlugs = new Set();

        for (let i = 0; i < this.variants.length; i++) {
            const v = this.variants[i];

            // Collect used slugs to avoid collisions within this product
            if (v.slug) existingSlugs.add(v.slug);

            // Newly added variants (slug missing) - SIMPLIFIED
            if (!v.slug) {
                // Simple slug generation without static method
                const cleanVariantName = v.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();

                let variantSlug = `${this.slug}-${cleanVariantName}`;

                // Make unique if needed
                if (existingSlugs.has(variantSlug)) {
                    variantSlug = `${variantSlug}-${Date.now().toString().slice(-4)}`;
                }

                v.slug = variantSlug;
                existingSlugs.add(v.slug);
            }

            // Auto SKU if missing - SIMPLIFIED
            if (!v.sku) {
                const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                v.sku = `VAR-${Date.now().toString().slice(-6)}-${randomNum}`;
            }

            // Ensure variant MRP >= price
            if (v.mrp != null && v.mrp < v.price) {
                v.mrp = v.price;
            }
        }
    }

    // 2️⃣ Ensure product MRP >= basePrice
    if (this.mrp < this.basePrice) {
        this.mrp = this.basePrice;
    }

    // 3️⃣ True single source of truth — derive stock/pricing from variants
    if (hasVariants) {
        // Total stock
        this.stockQuantity = this.variants.reduce(
            (sum, v) => sum + (v.stockQuantity || 0),
            0
        );

        const active = this.variants.filter(v => v.isActive);
        const src = active.length ? active : this.variants;

        this.basePrice = Math.min(...src.map(v => v.price));
        this.mrp = Math.max(...src.map(v => v.mrp || v.price));
    }

    // 4️⃣ 🆕 FIXED: Status auto-update with manual status protection
    const manuallySetStatuses = ['Draft', 'Archived', 'Discontinued'];
    const isManualStatus = manuallySetStatuses.includes(this.status);

    if (!isManualStatus) {
        if (this.stockQuantity <= 0) {
            this.status = "OutOfStock";
        } else {
            this.status = "Published";
        }
    }

    next();
});

// =============================================
// 🎯 ESSENTIAL METHODS (ALL IN SCHEMA)
// =============================================

// 🆕 Generate unique slug for variant
productSchema.methods.generateVariantSlug = async function (variant) {
    if (!variant.name || variant.name.trim() === '') {
        throw new Error('Variant name is required to generate slug.');
    }

    const productSlug = this.slug;
    let baseVariantSlug = variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (!baseVariantSlug || baseVariantSlug === productSlug) {
        const attrString = variant.identifyingAttributes
            ?.map(attr => attr.value)
            .filter(Boolean)
            .join('-')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') || 'variant';

        baseVariantSlug = attrString;
    }

    let variantSlug = `${productSlug}-${baseVariantSlug}`;
    let count = 0;

    // Check for duplicate variant slugs within the same product
    const existingSlugs = new Set();
    this.variants.forEach(v => {
        if (v._id !== variant._id && v.slug) {
            existingSlugs.add(v.slug);
        }
    });

    let tempSlug = variantSlug;
    while (existingSlugs.has(tempSlug)) {
        count++;
        tempSlug = `${variantSlug}-${count}`;
    }

    variant.slug = tempSlug;
};

// 🆕 Find variant by attributes (UNIFIED METHOD)
productSchema.methods.findVariant = function (attributes = {}) {
    if (!attributes || Object.keys(attributes).length === 0) {
        return this.variants.find(v => v.isActive) || null;
    }

    return this.variants.find(variant =>
        variant.identifyingAttributes.every(attr =>
            attributes[attr.key] === attr.value
        )
    );
};

// 🆕 Get active variants only
productSchema.methods.getActiveVariants = function () {
    return this.variants.filter(v => v.isActive);
};

// 🆕 Check if variant exists
productSchema.methods.variantExists = function (attributes) {
    return !!this.findVariant(attributes);
};

// 🆕 Get variants by color
productSchema.methods.getVariantsByColor = function (colorValue) {
    return this.variants.filter(variant =>
        variant.identifyingAttributes.some(attr =>
            (attr.key === 'color' || attr.isColor) && attr.value === colorValue
        )
    );
};

// 🆕 Find variant by color
productSchema.methods.findVariantByColor = function (colorValue) {
    return this.variants.find(variant =>
        variant.identifyingAttributes.some(attr =>
            (attr.key === 'color' || attr.isColor) && attr.value === colorValue
        )
    );
};

// 🆕 Get gallery images for specific color
productSchema.methods.getColorGallery = function (colorValue) {
    const variant = this.findVariantByColor(colorValue);

    // Return variant-specific gallery if available
    if (variant && variant.images.gallery.length > 0) {
        return variant.images.gallery;
    }

    // Fallback to product base gallery
    return this.images.gallery;
};

// 🆕 Check if color is available (has stock)
productSchema.methods.isColorAvailable = function (colorValue) {
    const variants = this.getVariantsByColor(colorValue);
    return variants.some(variant => variant.stockQuantity > 0 && variant.isActive);
};

// 🆕 Get total stock for a color
productSchema.methods.getColorStock = function (colorValue) {
    const variants = this.getVariantsByColor(colorValue);
    return variants.reduce((total, variant) => total + variant.stockQuantity, 0);
};

// 🆕 Simple method to add color variant
productSchema.methods.addColorVariant = async function (colorName, variantData) {
    const colorVariant = {
        name: `${this.name} - ${colorName}`,
        price: variantData.price || this.basePrice,
        mrp: variantData.mrp || this.mrp || variantData.price || this.basePrice,
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

    // Generate slug for the color variant
    await this.generateVariantSlug(colorVariant);

    this.variants.push(colorVariant);
    this.variantConfiguration.hasVariants = true;
    this.variantConfiguration.variantType = 'Color';

    // Auto-add color to variantAttributes if not exists
    const colorAttribute = this.variantConfiguration.attributes.find(
        attr => attr.key === 'color'
    );

    if (!colorAttribute) {
        this.variantConfiguration.attributes.push({
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

// 🆕 Generate variants from configuration
productSchema.methods.generateVariants = async function (baseVariantData = {}) {
    if (!this.variantConfiguration.hasVariants) {
        throw new Error('Product is not configured for variants');
    }

    const combinations = this.generateAttributeCombinations();

    this.variants = await Promise.all(combinations.map(async (combination) => {
        const variantName = this.generateVariantName(combination);
        const attributes = this.formatIdentifyingAttributes(combination);
        const baseSlug = this.generateVariantSlugFromAttributes(combination);

        const variant = {
            name: variantName,
            identifyingAttributes: attributes,
            price: this.basePrice,
            mrp: this.mrp || this.basePrice,
            stockQuantity: 0,
            sku: this.generateVariantSKU(combination),
            slug: baseSlug,
            specifications: this.generateVariantSpecifications(combination),
            ...baseVariantData
        };

        await this.generateVariantSlug(variant);
        return variant;
    }));

    this.variantConfiguration.hasVariants = true;
    this.markModified('variants');
};

// 🆕 Helper to get hex code from color name
productSchema.methods.getColorHexCode = function (colorName) {
    const colorMap = {
        'red': '#FF0000', 'blue': '#0000FF', 'green': '#008000', 'black': '#000000',
        'white': '#FFFFFF', 'gray': '#808080', 'silver': '#C0C0C0', 'gold': '#FFD700',
        'purple': '#800080', 'pink': '#FFC0CB', 'orange': '#FFA500', 'yellow': '#FFFF00',
        'brown': '#A52A2A', 'navy': '#000080', 'teal': '#008080', 'maroon': '#800000'
    };
    return colorMap[colorName.toLowerCase()] || '#CCCCCC';
};

// 🆕 Generate variant name from attributes
productSchema.methods.generateVariantName = function (combination) {
    const attributeStrings = combination.map(attr =>
        `${attr.label}: ${attr.value}`
    );
    return `${this.name} - ${attributeStrings.join(' | ')}`;
};

// 🆕 Generate SKU from combination
productSchema.methods.generateVariantSKU = function (combination) {
    const baseSKU = this.sku || this.name.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 6);
    const variantCodes = combination.map(attr =>
        attr.value.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 3)
    );
    return `${baseSKU}-${variantCodes.join('-')}`;
};

// 🆕 Generate variant slug from combination
productSchema.methods.generateVariantSlugFromAttributes = function (combination) {
    const productSlug = this.slug;
    const variantSlugPart = combination
        .map(attr => attr.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        .join('-')
        .replace(/(^-|-$)+/g, '');
    return `${productSlug}-${variantSlugPart}`;
};

// 🆕 Format identifying attributes
productSchema.methods.formatIdentifyingAttributes = function (combination) {
    return combination.map(attr => ({
        key: attr.key,
        label: attr.label,
        value: attr.value,
        displayValue: attr.value
    }));
};

// 🆕 Generate variant-specific specifications
productSchema.methods.generateVariantSpecifications = function (combination) {
    const variantSpecs = [];
    combination.forEach(attr => {
        variantSpecs.push({
            sectionTitle: attr.label,
            specs: [{ key: attr.key, value: attr.value }]
        });
    });
    return variantSpecs;
};

// 🆕 Generate attribute combinations
productSchema.methods.generateAttributeCombinations = function () {
    if (!this.variantConfiguration.attributes || this.variantConfiguration.attributes.length === 0) {
        return [];
    }

    const combinations = [];
    const attributes = this.variantConfiguration.attributes;

    function generate(index, current) {
        if (index === attributes.length) {
            combinations.push([...current]);
            return;
        }

        const attribute = attributes[index];
        for (const value of attribute.values) {
            current.push({
                key: attribute.key,
                label: attribute.label,
                value: value
            });
            generate(index + 1, current);
            current.pop();
        }
    }

    generate(0, []);
    return combinations;
};

// 🆕 Bulk update variant prices
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

// Virtual for reviews from separate collection
productSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'product'
});

// Update review stats method
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
            this.totalReviews = 0;
            this.averageRating = 0;
        }

        await this.save();
        return this;
    } catch (error) {
        console.error('❌ Error updating review stats:', error);
        throw error;
    }
};

// Static method to update review stats
productSchema.statics.updateProductReviewStats = async function (productId) {
    const product = await this.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }
    return await product.updateReviewStats();
};

// Indexes
productSchema.index({
    name: 'text',
    description: 'text',
    tags: 'text',
    'variants.name': 'text'
}, {
    name: "product_search_index",
    weights: {
        name: 10,
        tags: 5,
        'variants.name': 3,
        description: 1
    }
});

productSchema.index({ 'variants.slug': 1 });

module.exports = mongoose.model('Product', productSchema);