// backend/models/Video.js
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    path: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        default: ''
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    hasCustomThumbnail: {
        type: Boolean,
        default: false
    },
    optimizedUrl: {
        type: String,
        default: ''
    },
    duration: {
        type: Number,
        default: 0
    },
    size: {
        type: Number,
        required: true
    },
    sizeFormatted: {
        type: String,
        default: '0 Bytes'
    },
    format: {
        type: String,
        required: true
    },
    resolution: {
        width: {
            type: Number,
            default: 0
        },
        height: {
            type: Number,
            default: 0
        }
    },
    bitrate: {
        type: Number,
        default: 0
    },
    optimized: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    isUsed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    // Add this to include virtuals in toJSON() and toObject()
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for formatted duration
videoSchema.virtual('durationFormatted').get(function () {
    if (!this.duration) return '0:00';

    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = Math.floor(this.duration % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Method to check if thumbnail exists
videoSchema.methods.hasThumbnail = function () {
    return !!this.thumbnailUrl;
};

// Method to mark video as used
videoSchema.methods.markAsUsed = function () {
    this.isUsed = true;
    return this.save();
};

// Method to mark video as unused
videoSchema.methods.markAsUnused = function () {
    this.isUsed = false;
    return this.save();
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;