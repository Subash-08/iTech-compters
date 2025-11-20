const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        trim: true
    },
    categorySlug: {
        type: String,
        required: true,
        trim: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
    },
    productName: String,
    productPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    productImage: String,
    productSlug: String,
    userNote: {
        type: String,
        trim: true,
        default: '',
        maxlength: 500
    },
    selected: {
        type: Boolean,
        default: false
    },
    required: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { _id: false });

const pcQuoteSchema = new mongoose.Schema({
    // Customer details
    customer: {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        email: {
            type: String,
            required: [true, 'Customer email is required'],
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number'],
            maxlength: [15, 'Phone number cannot exceed 15 characters']
        },
        notes: {
            type: String,
            trim: true,
            default: '',
            maxlength: [1000, 'Notes cannot exceed 1000 characters']
        }
    },

    // Build configuration
    components: [componentSchema],

    // Pricing
    totalEstimated: {
        type: Number,
        default: 0,
        min: 0
    },

    // Status tracking
    status: {
        type: String,
        enum: {
            values: ['pending', 'contacted', 'quoted', 'accepted', 'rejected', 'cancelled'],
            message: 'Status must be pending, contacted, quoted, accepted, rejected, or cancelled'
        },
        default: 'pending'
    },

    // Admin management
    adminNotes: {
        type: String,
        trim: true,
        default: '',
        maxlength: [2000, 'Admin notes cannot exceed 2000 characters']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Metadata
    quoteExpiry: {
        type: Date,
        default: function () {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        },
        validate: {
            validator: function (value) {
                return value > new Date();
            },
            message: 'Quote expiry must be in the future'
        }
    },

    // Tracking
    ipAddress: String,
    userAgent: String,
    source: {
        type: String,
        enum: ['web', 'mobile', 'api'],
        default: 'web'
    },

    // Timestamps for lifecycle tracking
    contactedAt: Date,
    quotedAt: Date,
    respondedAt: Date

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for isExpired
pcQuoteSchema.virtual('isExpired').get(function () {
    return this.quoteExpiry < new Date();
});

// Virtual for daysUntilExpiry
pcQuoteSchema.virtual('daysUntilExpiry').get(function () {
    const diffTime = Math.abs(this.quoteExpiry - new Date());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware for calculated fields
pcQuoteSchema.pre('save', function (next) {
    // Calculate total price
    this.totalEstimated = this.components
        .filter(comp => comp.selected && comp.productPrice)
        .reduce((total, comp) => total + (comp.productPrice || 0), 0);

    // Update timestamps based on status changes
    if (this.isModified('status')) {
        const now = new Date();
        if (this.status === 'contacted' && !this.contactedAt) {
            this.contactedAt = now;
        } else if (this.status === 'quoted' && !this.quotedAt) {
            this.quotedAt = now;
        } else if (['accepted', 'rejected'].includes(this.status) && !this.respondedAt) {
            this.respondedAt = now;
        }
    }

    next();
});

// Pre-save validation for required components
pcQuoteSchema.pre('save', function (next) {
    const requiredComponents = this.components.filter(comp => comp.required && !comp.selected);
    if (requiredComponents.length > 0 && this.status !== 'pending') {
        const missing = requiredComponents.map(comp => comp.category).join(', ');
        next(new Error(`Required components not selected: ${missing}`));
        return;
    }
    next();
});

// Static method to find expired quotes
pcQuoteSchema.statics.findExpired = function () {
    return this.find({
        quoteExpiry: { $lt: new Date() },
        status: { $in: ['pending', 'contacted', 'quoted'] }
    });
};

// Static method for quote statistics
pcQuoteSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalEstimated' },
                avgValue: { $avg: '$totalEstimated' }
            }
        },
        {
            $project: {
                status: '$_id',
                count: 1,
                totalValue: 1,
                avgValue: { $round: ['$avgValue', 2] },
                _id: 0
            }
        }
    ]);

    const total = await this.countDocuments();
    const pending = await this.countDocuments({ status: 'pending' });
    const expired = await this.countDocuments({
        quoteExpiry: { $lt: new Date() },
        status: { $in: ['pending', 'contacted', 'quoted'] }
    });

    return {
        byStatus: stats,
        total,
        pending,
        expired
    };
};

// Instance method to extend expiry
pcQuoteSchema.methods.extendExpiry = function (days = 7) {
    this.quoteExpiry = new Date(this.quoteExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    return this.save();
};

// Indexes for performance
pcQuoteSchema.index({ status: 1, createdAt: -1 });
pcQuoteSchema.index({ 'customer.email': 1 });
pcQuoteSchema.index({ quoteExpiry: 1 });
pcQuoteSchema.index({ createdAt: -1 });
pcQuoteSchema.index({ totalEstimated: -1 });
pcQuoteSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('PCQuote', pcQuoteSchema);