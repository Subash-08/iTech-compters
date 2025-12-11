const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
    instagramUrl: {
        type: String,
        required: true,
        trim: true
    },
    embedUrl: {
        type: String,
        required: true,
        trim: true
    },
    reelId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        default: 0
    },
    height: {
        type: Number,
        default: 600
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reel', reelSchema);