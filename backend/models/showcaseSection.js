// models/showcaseSection.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const showcaseSectionSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Section title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [200, 'Subtitle cannot exceed 200 characters']
    },
    type: {
        type: String,
        enum: ['grid', 'carousel'],
        default: 'grid'
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }],
    displayOrder: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    showViewAll: {
        type: Boolean,
        default: true
    },
    viewAllLink: {
        type: String,
        trim: true
    },
    timerConfig: {
        hasTimer: {
            type: Boolean,
            default: false
        },
        endDate: {
            type: Date
        },
        timerText: {
            type: String,
            default: 'Ends in'
        }
    },
    styleConfig: {
        backgroundColor: {
            type: String,
            default: '#ffffff'
        },
        textColor: {
            type: String,
            default: '#000000'
        },
        accentColor: {
            type: String,
            default: '#007bff'
        },
        cardStyle: {
            type: String,
            enum: ['modern', 'minimal', 'elegant', 'bold'],
            default: 'modern'
        }
    },
    visibility: {
        isPublic: {
            type: Boolean,
            default: true
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date
        },
        showOnHomepage: {
            type: Boolean,
            default: true
        },
        showInCategory: [{
            type: Schema.Types.ObjectId,
            ref: 'Category'
        }]
    },
    meta: {
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        clicks: {
            type: Number,
            default: 0
        },
        impressions: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for timer status
showcaseSectionSchema.virtual('timerStatus').get(function () {
    if (!this.timerConfig.hasTimer || !this.timerConfig.endDate) {
        return 'no-timer';
    }

    const now = new Date();
    const endDate = new Date(this.timerConfig.endDate);

    if (now > endDate) {
        return 'expired';
    }

    return 'active';
});

// Virtual for time remaining
showcaseSectionSchema.virtual('timeRemaining').get(function () {
    if (!this.timerConfig.hasTimer || !this.timerConfig.endDate) {
        return null;
    }

    const now = new Date();
    const endDate = new Date(this.timerConfig.endDate);
    const diff = endDate - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
});

// Indexes for better performance
showcaseSectionSchema.index({ isActive: 1, displayOrder: 1 });
showcaseSectionSchema.index({ 'visibility.showOnHomepage': 1, isActive: 1 });
showcaseSectionSchema.index({ 'visibility.endDate': 1 });
showcaseSectionSchema.index({ 'timerConfig.endDate': 1 });

// Pre-save middleware to update viewAllLink
showcaseSectionSchema.pre('save', function (next) {
    if (this.showViewAll && !this.viewAllLink) {
        this.viewAllLink = `/section/${this._id}`;
    }
    next();
});

module.exports = mongoose.model('ShowcaseSection', showcaseSectionSchema);