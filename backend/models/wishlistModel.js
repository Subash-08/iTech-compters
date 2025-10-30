const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User ID is required'],
        unique: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, 'Product ID is required']
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

// Instance methods
wishlistSchema.methods.addItem = async function (productId) {
    const existingItem = this.items.find(
        item => item.product.toString() === productId.toString()
    );

    if (existingItem) {
        throw new Error('Product already in wishlist');
    }

    if (this.items.length >= 100) {
        throw new Error('Wishlist cannot have more than 100 items');
    }

    this.items.push({
        product: productId,
        addedAt: new Date()
    });

    return this.save();
};

wishlistSchema.methods.removeItem = async function (productId) {
    const initialLength = this.items.length;
    this.items = this.items.filter(
        item => item.product.toString() !== productId.toString()
    );

    if (this.items.length === initialLength) {
        throw new Error('Product not found in wishlist');
    }

    return this.save();
};

wishlistSchema.methods.clearWishlist = async function () {
    this.items = [];
    return this.save();
};

wishlistSchema.methods.hasItem = function (productId) {
    return this.items.some(item => item.product.toString() === productId.toString());
};

module.exports = mongoose.model("Wishlist", wishlistSchema);