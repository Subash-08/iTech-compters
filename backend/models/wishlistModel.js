const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User ID is required'],
        unique: true
    },
    items: [{
        productType: {
            type: String,
            enum: ['product', 'prebuilt-pc'],
            default: 'product'
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: function () {
                return this.productType === 'product';
            }
        },
        preBuiltPC: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PreBuiltPC',
            required: function () {
                return this.productType === 'prebuilt-pc';
            }
        },
        variant: {
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false
            },
            name: String,
            price: Number,
            mrp: Number,
            stock: Number,
            attributes: [{
                key: String,
                label: String,
                value: String,
                displayValue: String,
                hexCode: String,
                isColor: Boolean
            }],
            sku: String
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    itemCount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate item count before saving
wishlistSchema.pre('save', function (next) {
    this.itemCount = this.items.length;
    this.lastUpdated = Date.now();
    next();
});

// Indexes
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ lastUpdated: 1 });
wishlistSchema.index({ 'items.addedAt': 1 });

// ✅ FIXED: addItem method with proper error handling
wishlistSchema.methods.addItem = async function (productId, variantData = null, productType = 'product') {
    const existingItem = this.items.find(item => {
        if (item.productType !== productType) return false;

        if (productType === 'product') {
            const sameProduct = item.product && item.product.toString() === productId.toString();

            if (variantData && variantData.variantId) {
                const sameVariant = item.variant && item.variant.variantId.toString() === variantData.variantId.toString();
                return sameProduct && sameVariant;
            }

            return sameProduct && !item.variant;
        } else if (productType === 'prebuilt-pc') {
            return item.preBuiltPC && item.preBuiltPC.toString() === productId.toString();
        }
        return false;
    });

    if (existingItem) {
        throw new Error('Item already in wishlist');
    }

    if (this.items.length >= 100) {
        throw new Error('Wishlist cannot have more than 100 items');
    }

    const newItem = {
        productType: productType,
        addedAt: new Date()
    };

    if (productType === 'product') {
        newItem.product = productId;
        if (variantData && variantData.variantId) {
            newItem.variant = {
                variantId: variantData.variantId,
                name: variantData.name,
                price: variantData.price,
                mrp: variantData.mrp,
                stock: variantData.stock,
                attributes: variantData.attributes || [],
                sku: variantData.sku
            };
        }
    } else if (productType === 'prebuilt-pc') {
        newItem.preBuiltPC = productId;
    }

    this.items.push(newItem);
    return this.save();
};

// ✅ FIXED: removeItem method for both product types
wishlistSchema.methods.removeItem = async function (productId, variantId = null, productType = 'product') {
    const initialLength = this.items.length;

    this.items = this.items.filter(item => {
        if (productType === 'product' && item.productType === 'product') {
            if (item.product && item.product.toString() === productId.toString()) {
                if (variantId) {
                    return !(item.variant && item.variant.variantId.toString() === variantId.toString());
                }
                return false;
            }
        } else if (productType === 'prebuilt-pc' && item.productType === 'prebuilt-pc') {
            return !(item.preBuiltPC && item.preBuiltPC.toString() === productId.toString());
        }
        return true;
    });

    if (this.items.length === initialLength) {
        throw new Error('Product not found in wishlist');
    }

    return this.save();
};

wishlistSchema.methods.clearWishlist = async function () {
    this.items = [];
    return this.save();
};

wishlistSchema.methods.hasItem = function (productId, variantId = null, productType = 'product') {
    return this.items.some(item => {
        if (productType === 'product' && item.productType === 'product') {
            if (item.product && item.product.toString() === productId.toString()) {
                if (variantId) {
                    return item.variant && item.variant.variantId.toString() === variantId.toString();
                }
                return true;
            }
        } else if (productType === 'prebuilt-pc' && item.productType === 'prebuilt-pc') {
            return item.preBuiltPC && item.preBuiltPC.toString() === productId.toString();
        }
        return false;
    });
};

wishlistSchema.methods.getItem = function (productId, variantId = null) {
    return this.items.find(item => {
        if (item.product && item.product.toString() === productId.toString()) {
            if (variantId) {
                return item.variant && item.variant.variantId.toString() === variantId.toString();
            }
            return !item.variant;
        }
        return false;
    });
};

module.exports = mongoose.model("Wishlist", wishlistSchema);