const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Brand name is required'],
            unique: true,
            trim: true,
            maxLength: [100, 'Brand name cannot exceed 100 characters']
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            required: [true, 'Brand slug is required']
        },
        description: {
            type: String,
            maxLength: [500, 'Description cannot exceed 500 characters']
        },
        // Logo field for brand
        logo: {
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
        // Status Management
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true
        },
        deactivationReason: {
            type: String,
            enum: ["discontinued", "seasonal", "restructuring", "low-performance", "other", null],
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
        // SEO Fields
        metaTitle: {
            type: String,
            maxLength: [60, 'Meta title cannot exceed 60 characters']
        },
        metaDescription: {
            type: String,
            maxLength: [160, 'Meta description cannot exceed 160 characters']
        },
        metaKeywords: [{
            type: String,
            lowercase: true,
            trim: true
        }],
        // Audit Fields
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for products in this brand
brandSchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "brand"
});

// Indexes for performance
brandSchema.index({ name: 1, status: 1 });
brandSchema.index({ slug: 1, status: 1 });
brandSchema.index({ 'logo.url': 1 });
brandSchema.index({ isFeatured: -1, order: 1 });

// Prevent hard deletion
brandSchema.pre('remove', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

brandSchema.pre('deleteOne', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

brandSchema.pre('deleteMany', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

// Instance methods for status management
brandSchema.methods.deactivate = async function (reason = "other", adminId = null) {
    this.status = "inactive";
    this.deactivationReason = reason;
    this.deactivatedAt = new Date();
    this.deactivatedBy = adminId;
    return this.save();
};

brandSchema.methods.activate = async function () {
    this.status = "active";
    this.deactivationReason = null;
    this.deactivatedAt = null;
    this.deactivatedBy = null;
    return this.save();
};

// Logo management methods
brandSchema.methods.updateLogo = async function (logoData) {
    this.logo = {
        url: logoData.url || this.logo.url,
        altText: logoData.altText || this.logo.altText,
        publicId: logoData.publicId || this.logo.publicId
    };
    return this.save();
};

brandSchema.methods.removeLogo = async function () {
    this.logo = {
        url: null,
        altText: null,
        publicId: null
    };
    return this.save();
};

// Static methods for querying
brandSchema.statics.getActiveBrands = function () {
    return this.find({ status: "active" })
        .sort({ name: 1 });
};

brandSchema.statics.getBrandsWithLogos = function () {
    return this.find({
        status: "active",
        'logo.url': { $ne: null }
    }).sort({ name: 1 });
};

// Query helpers
brandSchema.query.active = function () {
    return this.where({ status: "active" });
};

brandSchema.query.featured = function () {
    return this.where({ isFeatured: true, status: "active" });
};

brandSchema.query.inactive = function () {
    return this.where({ status: "inactive" });
};

brandSchema.query.withLogos = function () {
    return this.where({ 'logo.url': { $ne: null } });
};

brandSchema.query.withoutLogos = function () {
    return this.where({ 'logo.url': null });
};

module.exports = mongoose.model("Brand", brandSchema);