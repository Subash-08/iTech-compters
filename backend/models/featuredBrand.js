// models/featuredBrand.js
const mongoose = require("mongoose");

const featuredBrandSchema = new mongoose.Schema(
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
        // Logo field for featured brand
        logo: {
            url: {
                type: String,
                required: [true, 'Logo URL is required']
            },
            altText: {
                type: String,
                default: ''
            },
            publicId: {
                type: String,
                default: null
            },
            dimensions: {
                width: {
                    type: Number,
                    default: null
                },
                height: {
                    type: Number,
                    default: null
                }
            },
            size: {
                type: Number, // Size in bytes
                default: null
            },
            format: {
                type: String,
                enum: ['png', 'jpg', 'jpeg', 'svg', 'webp', null],
                default: null
            }
        },
        websiteUrl: {
            type: String,
            default: null,
            match: [/^https?:\/\/.+\..+/, 'Please enter a valid URL']
        },
        // For display in the trusted brands section
        displayOrder: {
            type: Number,
            default: 0,
            min: 0,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        // Status Management
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true
        },
        // Additional fields for tracking
        views: {
            type: Number,
            default: 0
        },
        clicks: {
            type: Number,
            default: 0
        },
        // Audit Fields
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                delete ret.createdBy;
                delete ret.updatedBy;
                return ret;
            }
        },
        toObject: { virtuals: true }
    }
);

// Indexes for performance
featuredBrandSchema.index({ name: 1, status: 1 });
featuredBrandSchema.index({ slug: 1, status: 1 });
featuredBrandSchema.index({ 'logo.url': 1 });
featuredBrandSchema.index({ displayOrder: 1, status: 1 });
featuredBrandSchema.index({ isActive: 1, status: 1 });

// Pre-save hook to create slug
featuredBrandSchema.pre('save', function (next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-');
    }
    next();
});

// Prevent hard deletion
featuredBrandSchema.pre('remove', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

featuredBrandSchema.pre('deleteOne', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

featuredBrandSchema.pre('deleteMany', function (next) {
    next(new Error("Hard deletion is not allowed. Use deactivation instead."));
});

// Instance methods
featuredBrandSchema.methods.deactivate = async function (adminId = null) {
    this.status = "inactive";
    this.isActive = false;
    this.updatedBy = adminId;
    return this.save();
};

featuredBrandSchema.methods.activate = async function (adminId = null) {
    this.status = "active";
    this.isActive = true;
    this.updatedBy = adminId;
    return this.save();
};

featuredBrandSchema.methods.incrementViews = async function () {
    this.views += 1;
    return this.save();
};

featuredBrandSchema.methods.incrementClicks = async function () {
    this.clicks += 1;
    return this.save();
};

featuredBrandSchema.methods.updateLogo = async function (logoData) {
    this.logo = {
        url: logoData.url || this.logo.url,
        altText: logoData.altText || this.logo.altText,
        publicId: logoData.publicId || this.logo.publicId,
        dimensions: logoData.dimensions || this.logo.dimensions,
        size: logoData.size || this.logo.size,
        format: logoData.format || this.logo.format
    };
    return this.save();
};

featuredBrandSchema.methods.updateDisplayOrder = async function (order) {
    this.displayOrder = order;
    return this.save();
};

// Static methods
featuredBrandSchema.statics.getActiveFeaturedBrands = function () {
    return this.find({
        status: "active",
        isActive: true,
        'logo.url': { $ne: null }
    })
        .sort({ displayOrder: 1, name: 1 })
        .select('name slug description logo.url logo.altText websiteUrl displayOrder views clicks');
};

featuredBrandSchema.statics.getActiveCount = async function () {
    return this.countDocuments({
        status: "active",
        isActive: true,
        'logo.url': { $ne: null }
    });
};

featuredBrandSchema.statics.getAllForAdmin = function () {
    return this.find()
        .sort({ displayOrder: 1, createdAt: -1 })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
};

// Query helpers
featuredBrandSchema.query.active = function () {
    return this.where({
        status: "active",
        isActive: true
    });
};

featuredBrandSchema.query.withLogos = function () {
    return this.where({ 'logo.url': { $ne: null } });
};

featuredBrandSchema.query.ordered = function () {
    return this.sort({ displayOrder: 1, name: 1 });
};

module.exports = mongoose.model("FeaturedBrand", featuredBrandSchema);