const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
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
        ref: "PreBuiltPC",
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
        stock: Number,
        attributes: [{
            key: String,
            label: String,
            value: String,
            displayValue: String
        }]
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        max: [100, 'Quantity cannot exceed 100']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User ID is required'],
        unique: true
    },
    items: [cartItemSchema],
    totalItems: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    strictPopulate: false
});

// Calculate totals before saving
cartSchema.pre('save', function (next) {
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
    this.totalPrice = this.items.reduce((total, item) => total + (item.quantity * item.price), 0);
    this.lastUpdated = Date.now();
    next();
});

// Indexes
cartSchema.index({ userId: 1 });
cartSchema.index({ lastUpdated: 1 });

// models/Cart.js - FIXED addItem method
cartSchema.methods.addItem = async function (productId, variantData = null, quantity = 1, price = 0, productType = 'product') {
    if (quantity < 1 || quantity > 100) {
        throw new Error('Quantity must be between 1 and 100');
    }

    // ✅ FIXED: Handle case where variantData might be just a variantId string
    let actualVariantData = variantData;

    // If variantData is just a string (variantId), convert to object
    if (typeof variantData === 'string') {
        actualVariantData = { variantId: variantData };
    }

    // Backward compatibility handling
    if (typeof productId === 'object' && productId.productType) {
        productType = productId.productType;
        actualVariantData = productId.variantData;
        quantity = productId.quantity;
        price = productId.price;
        productId = productId.productId;
    }

    const existingItemIndex = this.items.findIndex(item => {
        if (item.productType !== productType) return false;

        if (productType === 'product') {
            // ✅ FIXED: Extract product ID from both object and string
            const itemProductId = item.product?._id?.toString() || item.product?.toString();
            const targetProductId = productId.toString();

            const productMatch = itemProductId === targetProductId;

            // ✅ FIXED: Extract variant ID from both object and string
            const itemVariantId = item.variant?.variantId?._id?.toString() ||
                item.variant?.variantId?.toString();
            const targetVariantId = actualVariantData?.variantId?.toString();

            const variantMatch = actualVariantData ?
                itemVariantId === targetVariantId :
                !itemVariantId;
            return productMatch && variantMatch;
        } else if (productType === 'prebuilt-pc') {
            const itemPCId = item.preBuiltPC?._id?.toString() || item.preBuiltPC?.toString();
            const targetPCId = productId.toString();
            return itemPCId === targetPCId;
        }
        return false;
    });

    if (existingItemIndex > -1) {
        const newQuantity = this.items[existingItemIndex].quantity + quantity;
        if (newQuantity > 100) {
            throw new Error('Total quantity cannot exceed 100');
        }
        this.items[existingItemIndex].quantity = newQuantity;
    } else {
        if (this.items.length >= 50) {
            throw new Error('Cart cannot have more than 50 items');
        }

        const newItem = {
            productType: productType,
            quantity: quantity,
            price: price,
            addedAt: new Date()
        };

        // Add product reference based on type
        if (productType === 'product') {
            newItem.product = productId; // This should be just the ID, not populated object
            // Add variant data if provided
            if (actualVariantData) {
                newItem.variant = {
                    variantId: actualVariantData.variantId,
                    name: actualVariantData.name,
                    price: actualVariantData.price,
                    mrp: actualVariantData.mrp,
                    stock: actualVariantData.stock,
                    attributes: actualVariantData.attributes,
                    sku: actualVariantData.sku
                };
            }
        } else if (productType === 'prebuilt-pc') {
            newItem.preBuiltPC = productId;
        }

        this.items.push(newItem);
    }

    return this.save();
};

// Updated updateQuantity with productType support
cartSchema.methods.updateQuantity = async function (productId, variantId = null, quantity = 1, productType = 'product') {
    if (quantity < 1 || quantity > 100) {
        throw new Error('Quantity must be between 1 and 100');
    }

    const item = this.items.find(item => {
        if (item.productType !== productType) return false;

        if (productType === 'product') {
            return item.product.toString() === productId.toString() &&
                (variantId ?
                    item.variant?.variantId?.toString() === variantId :
                    !item.variant?.variantId
                );
        } else if (productType === 'prebuilt-pc') {
            return item.preBuiltPC.toString() === productId.toString();
        }
        return false;
    });

    if (!item) {
        throw new Error('Item not found in cart');
    }

    item.quantity = quantity;
    return this.save();
};

// models/Cart.js - SIMPLIFIED removeItem
cartSchema.methods.removeItem = async function (productId, variantId = null, productType = 'product') {
    const initialLength = this.items.length;
    const searchProductId = productId.toString();
    const searchVariantId = variantId ? variantId.toString() : null;

    // ✅ SIMPLIFIED: Remove any item matching productId (ignore variant if not provided)
    this.items = this.items.filter(item => {
        if (item.productType !== productType) return true;

        if (productType === 'product') {
            const productMatch = item.product?.toString() === searchProductId;

            if (searchVariantId) {
                // Remove specific variant
                const variantMatch = item.variant?.variantId?.toString() === searchVariantId;
                return !(productMatch && variantMatch);
            } else {
                // Remove any item with this productId
                return !productMatch;
            }
        } else if (productType === 'prebuilt-pc') {
            return item.preBuiltPC?.toString() !== searchProductId;
        }

        return true;
    });
    if (this.items.length === initialLength) {
        throw new Error(`Item not found in cart. Product: ${productId}, Variant: ${variantId}, Type: ${productType}`);
    }

    return this.save();
};

// Updated getItem with productType support
cartSchema.methods.getItem = function (productId, variantId = null, productType = 'product') {
    return this.items.find(item => {
        if (item.productType !== productType) return false;

        if (productType === 'product') {
            return item.product.toString() === productId.toString() &&
                (variantId ?
                    item.variant?.variantId?.toString() === variantId :
                    !item.variant?.variantId
                );
        } else if (productType === 'prebuilt-pc') {
            return item.preBuiltPC.toString() === productId.toString();
        }
        return false;
    });
};

// Updated hasItem with productType support
cartSchema.methods.hasItem = function (productId, variantId = null, productType = 'product') {
    return this.items.some(item => {
        if (item.productType !== productType) return false;

        if (productType === 'product') {
            return item.product.toString() === productId.toString() &&
                (variantId ?
                    item.variant?.variantId?.toString() === variantId :
                    !item.variant?.variantId
                );
        } else if (productType === 'prebuilt-pc') {
            return item.preBuiltPC.toString() === productId.toString();
        }
        return false;
    });
};

// Clear cart remains the same
cartSchema.methods.clearCart = async function () {
    this.items = [];
    return this.save();
};

module.exports = mongoose.model("Cart", cartSchema);