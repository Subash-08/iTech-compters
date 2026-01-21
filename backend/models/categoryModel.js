const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true
        },
        description: { type: String },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        // Image field for category
        image: {
            url: {
                type: String,
                default: null
            },
            altText: {
                type: String,
                default: null
            },
            publicId: {
                type: String, // For Cloudinary or other CDN
                default: null
            }
        },
        // SOFT DELETE STATUS
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true
        },
        deactivationReason: {
            type: String,
            enum: ["out-of-stock", "seasonal", "restructuring", "other", "manual_deactivation", null],
            default: null
        },
        deactivatedAt: {
            type: Date,
            default: null
        },
        deactivatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        order: {
            type: Number,
            default: 0,
            index: true
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true
        },
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String],
    },
    { timestamps: true }
);

// Prevent hard deletion
categorySchema.pre('remove', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

categorySchema.pre('deleteOne', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

categorySchema.pre('deleteMany', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

// Deactivation method
categorySchema.methods.deactivate = async function (reason = "other", adminId = null) {
    this.status = "inactive";
    this.deactivationReason = reason;
    this.deactivatedAt = new Date();
    this.deactivatedBy = adminId;
    return this.save();
};

// Reactivation method
categorySchema.methods.reactivate = async function () {
    this.status = "active";
    this.deactivationReason = null;
    this.deactivatedAt = null;
    this.deactivatedBy = null;
    return this.save();
};

// Image management methods
categorySchema.methods.updateImage = async function (imageData) {
    this.image = {
        url: imageData.url || this.image.url,
        altText: imageData.altText || this.image.altText,
        publicId: imageData.publicId || this.image.publicId
    };
    return this.save();
};

categorySchema.methods.removeImage = async function () {
    this.image = {
        url: null,
        altText: null,
        publicId: null
    };
    return this.save();
};

// Query helpers for easy filtering
categorySchema.query.active = function () {
    return this.where({ status: "active" });
};

categorySchema.query.inactive = function () {
    return this.where({ status: "inactive" });
};

categorySchema.query.withImages = function () {
    return this.where({ 'image.url': { $ne: null } });
};

categorySchema.query.withoutImages = function () {
    return this.where({ 'image.url': null });
};

module.exports = mongoose.model("Category", categorySchema);