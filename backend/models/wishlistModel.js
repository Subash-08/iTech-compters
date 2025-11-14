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
                return this.productType === 'product'; // ✅ Only required for regular products
            }
        },
        preBuiltPC: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PreBuiltPC',
            required: function () {
                return this.productType === 'prebuilt-pc'; // ✅ Only required for PreBuiltPCs
            }
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

// models/Wishlist.js - FIXED addItem method (optional, for consistency)
wishlistSchema.methods.addItem = async function (productId, productType = 'product') {
    // 🛑 FIX: Check both product types for existing items
    const existingItem = this.items.find(item =>
        (item.product && item.product.toString() === productId.toString()) ||
        (item.preBuiltPC && item.preBuiltPC.toString() === productId.toString())
    );

    if (existingItem) {
        throw new Error('Item already in wishlist');
    }

    if (this.items.length >= 100) {
        throw new Error('Wishlist cannot have more than 100 items');
    }

    // 🛑 FIX: Create item based on product type
    const newItem = {
        productType: productType,
        addedAt: new Date()
    };

    if (productType === 'product') {
        newItem.product = productId;
    } else if (productType === 'prebuilt-pc') {
        newItem.preBuiltPC = productId;
    }

    this.items.push(newItem);

    return this.save();
};

// models/Wishlist.js - FIXED removeItem method
wishlistSchema.methods.removeItem = async function (productId) {
    const initialLength = this.items.length;

    // 🛑 FIX: Check both product and preBuiltPC fields
    this.items = this.items.filter(item => {
        // Check regular products
        if (item.product && item.product.toString() === productId.toString()) {
            return false; // Remove this item
        }
        // Check Pre-built PCs
        if (item.preBuiltPC && item.preBuiltPC.toString() === productId.toString()) {
            return false; // Remove this item
        }
        return true; // Keep this item
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

// models/Wishlist.js - FIXED hasItem method
wishlistSchema.methods.hasItem = function (productId) {
    return this.items.some(item =>
        (item.product && item.product.toString() === productId.toString()) ||
        (item.preBuiltPC && item.preBuiltPC.toString() === productId.toString())
    );
};

module.exports = mongoose.model("Wishlist", wishlistSchema);