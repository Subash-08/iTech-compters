// models/preBuiltPCModel.js
const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
    partType: {
        type: String,
        required: [true, 'Part type is required'],
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Component name is required'],
        trim: true
    },
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true
    },
    specs: {
        type: String,
        trim: true
    },
    image: {
        public_id: {
            type: String,
            default: ''
        },
        url: {
            type: String,
            default: ''
        }
    }
}, { _id: true });

const benchmarkTestSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: [true, 'Test name is required'],
        trim: true
    },
    testCategory: {
        type: String,
        required: [true, 'Test category is required'],
        enum: ['Gaming', 'Synthetic', 'Productivity', 'Thermal', 'Power Consumption'],
        trim: true
    },
    score: {
        type: Number,
        required: [true, 'Test score is required']
    },
    unit: {
        type: String,
        required: [true, 'Test unit is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    settings: {
        resolution: {
            type: String,
            default: '1920x1080'
        },
        quality: {
            type: String,
            default: 'Ultra'
        },
        otherSettings: {
            type: String,
            default: ''
        }
    },
    comparison: {
        betterThan: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }, // Percentage better than similar builds
        averageScore: {
            type: Number,
            default: 0
        }
    },
    testedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const performanceSummarySchema = new mongoose.Schema({
    gamingPerformance: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    productivityPerformance: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    thermalPerformance: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    powerEfficiency: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    overallRating: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    strengths: [{
        type: String,
        trim: true
    }],
    limitations: [{
        type: String,
        trim: true
    }],
    recommendedUse: [{
        type: String,
        enum: ['Gaming', 'Streaming', 'Video Editing', '3D Rendering', 'Programming', 'Office Work', 'Content Creation'],
        trim: true
    }]
});

const preBuiltPCSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'PC name is required'],
        trim: true,
        maxlength: [100, 'PC name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Gaming', 'Office', 'Editing', 'Budget', 'Workstation', 'Streaming'],
        trim: true
    },
    taxRate: {
        type: Number,
        default: 0.18,
        min: 0,
        max: 1
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    images: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    tags: [{
        type: String,
        trim: true
    }],
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Base price cannot be negative']
    },
    offerPrice: {
        type: Number,
        min: [0, 'Offer price cannot be negative']
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: [0, 'Total reviews cannot be negative']
    },
    condition: {
        type: String,
        default: 'New',
        enum: ['New', 'Refurbished', 'Used'],
        trim: true
    },
    components: [componentSchema],

    // Test Results Section
    benchmarkTests: [benchmarkTestSchema],
    performanceSummary: performanceSummarySchema,
    testNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Test notes cannot exceed 1000 characters']
    },
    testedBy: {
        type: String,
        trim: true
    },
    testDate: {
        type: Date
    },
    isTested: {
        type: Boolean,
        default: false
    },

    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    discountPrice: {
        type: Number,
        min: [0, 'Discount price cannot be negative']
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100']
    },
    stockQuantity: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock quantity cannot be negative'],
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    warranty: {
        type: String,
        default: '1 Year',
        trim: true
    },
    performanceRating: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Generate slug before saving
preBuiltPCSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Calculate discount percentage before saving
preBuiltPCSchema.pre('save', function (next) {
    if (this.totalPrice > 0 && this.discountPrice) {
        this.discountPercentage = Math.round(((this.totalPrice - this.discountPrice) / this.totalPrice) * 100);
    } else {
        this.discountPercentage = 0;
    }
    next();
});
preBuiltPCSchema.pre('save', function (next) {
    // Set basePrice = totalPrice for consistency
    if (!this.basePrice) {
        this.basePrice = this.totalPrice;
    }

    // Set offerPrice = discountPrice if exists, otherwise = basePrice
    if (this.discountPrice && this.discountPrice > 0) {
        this.offerPrice = this.discountPrice;
    } else if (!this.offerPrice) {
        this.offerPrice = this.basePrice;
    }

    // Calculate discount percentage
    if (this.basePrice > 0 && this.offerPrice < this.basePrice) {
        this.discountPercentage = Math.round(((this.basePrice - this.offerPrice) / this.basePrice) * 100);
    } else {
        this.discountPercentage = 0;
    }

    next();
});
// Calculate overall performance rating based on benchmark tests
preBuiltPCSchema.pre('save', function (next) {
    if (this.benchmarkTests && this.benchmarkTests.length > 0) {
        // Calculate average performance based on test scores
        const totalTests = this.benchmarkTests.length;
        const totalScore = this.benchmarkTests.reduce((sum, test) => sum + (test.comparison?.betterThan || 50), 0);
        this.performanceRating = Math.round((totalScore / totalTests) / 10);

        // Update performance summary if not set
        if (!this.performanceSummary) {
            this.performanceSummary = {
                overallRating: this.performanceRating,
                gamingPerformance: this.performanceRating,
                productivityPerformance: this.performanceRating,
                thermalPerformance: this.performanceRating,
                powerEfficiency: this.performanceRating
            };
        }
    }
    next();
});

module.exports = mongoose.model('PreBuiltPC', preBuiltPCSchema);