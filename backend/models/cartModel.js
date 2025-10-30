const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, 'Product ID is required']
    },
    variant: {
        // Remove the ProductVariant reference and store variant data directly
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
        },
        name: String,
        price: Number,
        stock: Number,
        // Store the identifying attributes for display
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
    // ✅ Add this to fix strictPopulate error
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

// Instance methods
// In cartModel.js - update the addItem method
cartSchema.methods.addItem = async function (productId, variantData, quantity, price) {
    if (quantity < 1 || quantity > 100) {
        throw new Error('Quantity must be between 1 and 100');
    }

    const existingItemIndex = this.items.findIndex(
        item => item.product.toString() === productId.toString() &&
            (variantData ?
                item.variant?.variantId?.toString() === variantData.variantId.toString() :
                !item.variant?.variantId
            )
    );

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
            product: productId,
            quantity,
            price,
            addedAt: new Date()
        };

        // Add variant data if provided
        if (variantData) {
            newItem.variant = variantData;
        }

        this.items.push(newItem);
    }

    return this.save();
};

// Similarly update other methods (updateQuantity, removeItem, etc.)
cartSchema.methods.updateQuantity = async function (productId, variantId, quantity) {
    if (quantity < 1 || quantity > 100) {
        throw new Error('Quantity must be between 1 and 100');
    }

    const item = this.items.find(
        item => item.product.toString() === productId.toString() &&
            (variantId ?
                item.variant?.variantId?.toString() === variantId :
                !item.variant?.variantId
            )
    );

    if (!item) {
        throw new Error('Item not found in cart');
    }

    item.quantity = quantity;
    return this.save();
};

// In cartModel.js - simplified removeItem
cartSchema.methods.removeItem = async function (productId, variantId = null) {
    const initialLength = this.items.length;

    // Convert everything to strings for consistent comparison
    const searchProductId = productId.toString();
    const searchVariantId = variantId ? variantId.toString() : null;

    if (searchVariantId) {
        // Remove variant-specific item
        this.items = this.items.filter(item => {
            const itemProductId = item.product.toString();
            const itemVariantId = item.variant?.variantId?.toString();

            const isMatch = itemProductId === searchProductId &&
                itemVariantId === searchVariantId;

            if (isMatch) {
            }

            return !isMatch;
        });
    } else {
        // Remove base product item (no variant)
        this.items = this.items.filter(item => {
            const itemProductId = item.product.toString();
            const isMatch = itemProductId === searchProductId;

            if (isMatch) {
            }

            return !isMatch;
        });
    }

    if (this.items.length === initialLength) {
        console.error('❌ Item not found in cart');
        console.error('🛒 Available items:');
        this.items.forEach((item, index) => {
            console.error(`   Item ${index}:`, {
                productId: item.product.toString(),
                variantId: item.variant?.variantId?.toString()
            });
        });
        throw new Error('Item not found in cart');
    }
    return this.save();
};

cartSchema.methods.clearCart = async function () {
    this.items = [];
    return this.save();
};

cartSchema.methods.getItem = function (productId, variantId = null) {
    return this.items.find(
        item => item.product.toString() === productId.toString() &&
            item.variant?.toString() === variantId?.toString()
    );
};

cartSchema.methods.hasItem = function (productId, variantId = null) {
    return this.items.some(
        item => item.product.toString() === productId.toString() &&
            item.variant?.toString() === variantId?.toString()
    );
};

module.exports = mongoose.model("Cart", cartSchema);