const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true }, // Variant name (e.g. "Red - 256GB")

    attributes: [
        {
            key: { type: String, required: true, trim: true }, // e.g. "Color"
            value: { type: String, required: true, trim: true } // e.g. "Red"
        }
    ],

    // 💰 Pricing & Stock
    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },

    // 📦 SKU / Barcode / ID fields
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        set: v => v === "" ? null : v
    },
    barcode: { type: String, trim: true },
    hsnCode: { type: String, trim: true }, // For GST classification (useful in India)

    // ⚙️ Product condition & logistics
    weight: { type: Number, min: 0 },  // in grams or kg
    dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: { type: String, default: "cm" }
    },
    packageDimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: { type: String, default: "cm" }
    },
    shippingWeight: { type: Number, min: 0 }, // for courier use
    estimatedDelivery: { type: String }, // e.g. "3-5 business days"

    // 🖼️ Images
    images: [
        {
            url: { type: String },
            alt: { type: String }
        }
    ],

    // ⚙️ Warranty / Info
    warranty: { type: String },
    warrantyPeriod: { type: String }, // e.g. "1 Year", "6 Months"
    warrantyType: { type: String, enum: ["Manufacturer", "Seller", "None"], default: "Manufacturer" },


    // 🔖 Status & Flags
    isDefault: { type: Boolean, default: false }, // default variant to display first
    isActive: { type: Boolean, default: true },

    // 🕓 Meta
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Auto-update timestamps on modification
variantSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

// 🔧 Check stock availability
variantSchema.methods.isAvailable = function (quantity = 1) {
    return this.stock >= quantity;
};

// 🔧 Calculate effective price (returns offerPrice if valid)
variantSchema.methods.getEffectivePrice = function () {
    return this.offerPrice > 0 && this.offerPrice < this.price
        ? this.offerPrice
        : this.price;
};

// 🔧 Compare attributes (useful for finding matching variants)
variantSchema.methods.matchesAttributes = function (attributes) {
    return this.attributes.every(attr => attributes[attr.key] === attr.value);
};

module.exports = variantSchema;
