const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please enter slide title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [200, 'Subtitle cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: {
        type: String, // Store file path instead of Cloudinary object
        required: true
    },
    buttonText: {
        type: String,
        trim: true,
        maxlength: [50, 'Button text cannot exceed 50 characters']
    },
    buttonLink: {
        type: String,
        trim: true
    },
    backgroundColor: {
        type: String,
        default: '#ffffff'
    },
    textColor: {
        type: String,
        default: '#000000'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    }
}, {
    timestamps: true
});

const heroSectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter hero section name'],
        unique: true,
        trim: true
    },
    slides: [heroSlideSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    autoPlay: {
        type: Boolean,
        default: true
    },
    autoPlaySpeed: {
        type: Number,
        default: 5000,
        min: 1000,
        max: 15000
    },
    transitionEffect: {
        type: String,
        enum: ['slide', 'fade', 'cube', 'coverflow'],
        default: 'slide'
    },
    showNavigation: {
        type: Boolean,
        default: true
    },
    showPagination: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
heroSectionSchema.index({ isActive: 1, 'slides.isActive': 1 });
heroSectionSchema.index({ 'slides.startDate': 1, 'slides.endDate': 1 });

module.exports = mongoose.model('HeroSection', heroSectionSchema);