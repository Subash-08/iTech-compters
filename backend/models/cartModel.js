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

// Enhanced addItem method with debugging
cartSchema.methods.addItem = async function (productId, variantData = null, quantity = 1, price = 0, productType = 'product') {
    console.log('🛒 addItem called with:', { productId, variantData, quantity, price, productType });

    if (quantity < 1 || quantity > 100) {
        throw new Error('Quantity must be between 1 and 100');
    }

    // Backward compatibility handling
    if (typeof productId === 'object' && productId.productType) {
        console.log('🛒 Using new format with productType');
        productType = productId.productType;
        variantData = productId.variantData;
        quantity = productId.quantity;
        price = productId.price;
        productId = productId.productId;
    }

    const existingItemIndex = this.items.findIndex(item => {
        if (item.productType !== productType) return false;

        if (productType === 'product') {
            const productMatch = item.product.toString() === productId.toString();
            const variantMatch = variantData ?
                item.variant?.variantId?.toString() === variantData.variantId?.toString() :
                !item.variant?.variantId;

            console.log('🛒 Item comparison:', {
                itemProduct: item.product.toString(),
                targetProduct: productId.toString(),
                itemVariant: item.variant?.variantId,
                targetVariant: variantData?.variantId,
                productMatch,
                variantMatch
            });

            return productMatch && variantMatch;
        } else if (productType === 'prebuilt-pc') {
            return item.preBuiltPC.toString() === productId.toString();
        }
        return false;
    });

    console.log('🛒 Existing item index:', existingItemIndex);

    if (existingItemIndex > -1) {
        const newQuantity = this.items[existingItemIndex].quantity + quantity;
        if (newQuantity > 100) {
            throw new Error('Total quantity cannot exceed 100');
        }
        this.items[existingItemIndex].quantity = newQuantity;
        console.log('🛒 Updated existing item quantity to:', newQuantity);
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
            newItem.product = productId;
            // Add variant data if provided
            if (variantData) {
                newItem.variant = {
                    variantId: variantData.variantId,
                    name: variantData.name,
                    price: variantData.price,
                    mrp: variantData.mrp,
                    stock: variantData.stock,
                    attributes: variantData.attributes,
                    sku: variantData.sku
                };
                console.log('🛒 Added variant data to new item:', newItem.variant);
            }
        } else if (productType === 'prebuilt-pc') {
            newItem.preBuiltPC = productId;
        }

        this.items.push(newItem);
        console.log('🛒 Added new item to cart');
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

// Updated removeItem with productType support
cartSchema.methods.removeItem = async function (productId, variantId = null, productType = 'product') {
    const initialLength = this.items.length;

    const searchProductId = productId.toString();
    const searchVariantId = variantId ? variantId.toString() : null;

    this.items = this.items.filter(item => {
        if (item.productType !== productType) return true;

        if (productType === 'product') {
            const itemProductId = item.product.toString();
            const itemVariantId = item.variant?.variantId?.toString();

            if (searchVariantId) {
                return !(itemProductId === searchProductId && itemVariantId === searchVariantId);
            } else {
                return !(itemProductId === searchProductId && !itemVariantId);
            }
        } else if (productType === 'prebuilt-pc') {
            const itemPCId = item.preBuiltPC.toString();
            return !(itemPCId === searchProductId);
        }

        return true;
    });

    if (this.items.length === initialLength) {
        throw new Error('Item not found in cart');
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