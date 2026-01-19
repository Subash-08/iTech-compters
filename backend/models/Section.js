// backend/models/Section.js
const mongoose = require('mongoose');

const videoSubSchema = new mongoose.Schema({
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    title: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    settings: {
        autoplay: { type: Boolean, default: false },
        loop: { type: Boolean, default: false },
        muted: { type: Boolean, default: true },
        controls: { type: Boolean, default: true },
        playsInline: { type: Boolean, default: true }
    }
}, {
    _id: true,
    timestamps: false
});

const sectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    layoutType: {
        type: String,
        enum: ['card', 'full-video', 'slider', 'grid', 'masonry', 'reels'],
        default: 'card'
    },
    gridConfig: {
        columns: { type: Number, default: 3, min: 1, max: 6 },
        gap: { type: Number, default: 16, min: 0, max: 100 }
    },
    sliderConfig: {
        autoplay: { type: Boolean, default: true },
        delay: { type: Number, default: 5000, min: 1000 },
        loop: { type: Boolean, default: true },
        showNavigation: { type: Boolean, default: true },
        showPagination: { type: Boolean, default: true }
    },
    videos: [videoSubSchema],
    order: {
        type: Number,
        default: 0
    },
    visible: {
        type: Boolean,
        default: true
    },
    backgroundColor: {
        type: String,
        default: '#ffffff'
    },
    textColor: {
        type: String,
        default: '#000000'
    },
    padding: {
        top: { type: Number, default: 40 },
        bottom: { type: Number, default: 40 },
        left: { type: Number, default: 0 },
        right: { type: Number, default: 0 }
    },
    maxWidth: {
        type: String,
        default: '1200px'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for active videos count
sectionSchema.virtual('videoCount').get(function () {
    return this.videos.length;
});

// Indexes for better query performance
sectionSchema.index({ order: 1 });
sectionSchema.index({ visible: 1 });
sectionSchema.index({ layoutType: 1 });
sectionSchema.index({ createdAt: -1 });

// Middleware to update updatedAt timestamp
sectionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get next order value
sectionSchema.statics.getNextOrder = async function () {
    const lastSection = await this.findOne({}).sort({ order: -1 });
    return lastSection ? lastSection.order + 1 : 0;
};

module.exports = mongoose.model('Section', sectionSchema);