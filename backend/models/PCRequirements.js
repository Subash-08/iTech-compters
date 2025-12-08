const mongoose = require('mongoose');
const N8NService = require('../services/n8nService');

const pcRequirementsSchema = new mongoose.Schema({
    // Customer Information
    customer: {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Customer email is required'],
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City/Location is required'],
            trim: true
        },
        additionalNotes: {
            type: String,
            trim: true,
            default: ''
        }
    },

    // PC Requirements
    requirements: {
        purpose: {
            type: String,
            required: [true, 'PC purpose is required'],
            enum: [
                'Gaming',
                'Office / Work from Home',
                'Professional Work (Editing, Designing, Architecture, etc.)',
                'Educational / Student Use',
                'General Home Use',
                'Other'
            ]
        },
        purposeCustom: {
            type: String,
            trim: true
        },
        budget: {
            type: String,
            required: [true, 'Budget is required'],
            enum: [
                'Rs 25,000 - Rs 30,000',
                'Rs 30,000 - Rs 50,000',
                'Rs 50,000 - Rs 75,000',
                'Rs 75,000 - Rs 1,00,000',
                'Rs 1 Lakh - Rs 1.5 Lakh',
                'More than 1.5 Lakh',
                'Other'
            ]
        },
        budgetCustom: {
            type: String,
            trim: true
        },
        paymentPreference: {
            type: String,
            required: [true, 'Payment preference is required'],
            enum: ['Full payment', 'Emi']
        },
        deliveryTimeline: {
            type: String,
            required: [true, 'Delivery timeline is required'],
            enum: [
                'Immediately (Within 1–2 Days)',
                'Within a Week',
                'Within a Month',
                'Just Checking Prices',
                'Other'
            ]
        },
        timelineCustom: {
            type: String,
            trim: true
        }
    },

    // Status
    status: {
        type: String,
        enum: ['new', 'processing', 'quoted', 'contacted', 'completed', 'cancelled'],
        default: 'new'
    },

    // Admin Fields
    adminNotes: {
        type: String,
        default: ''
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recommendations: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        price: Number,
        reason: String
    }],
    estimatedTotal: Number,

    // Source Tracking
    source: {
        type: String,
        enum: ['requirements_form', 'manual', 'other'],
        default: 'requirements_form'
    },

    // Metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        referrer: String,
        deviceType: String
    },

    // Timestamps
    contactAttempts: [{
        date: Date,
        method: String,
        notes: String,
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    quotedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

// Pre-save middleware to handle custom fields
pcRequirementsSchema.pre('save', function (next) {
    if (this.requirements.purpose === 'Other' && this.requirements.purposeCustom) {
        this.requirements.purpose = this.requirements.purposeCustom;
    }
    if (this.requirements.budget === 'Other' && this.requirements.budgetCustom) {
        this.requirements.budget = this.requirements.budgetCustom;
    }
    if (this.requirements.deliveryTimeline === 'Other' && this.requirements.timelineCustom) {
        this.requirements.deliveryTimeline = this.requirements.timelineCustom;
    }
    next();
});


// Indexes for performance
pcRequirementsSchema.index({ status: 1, createdAt: -1 });
pcRequirementsSchema.index({ 'customer.email': 1 });
pcRequirementsSchema.index({ 'customer.phone': 1 });
pcRequirementsSchema.index({ createdAt: -1 });
pcRequirementsSchema.index({ 'requirements.budget': 1 });
pcRequirementsSchema.index({ assignedTo: 1 });

// Static methods
pcRequirementsSchema.statics.getStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalEstimatedValue: { $sum: '$estimatedTotal' },
                avgBudget: { $avg: '$estimatedTotal' }
            }
        },
        {
            $project: {
                status: '$_id',
                count: 1,
                totalEstimatedValue: 1,
                avgBudget: { $round: ['$avgBudget', 2] },
                _id: 0
            }
        }
    ]);
};

module.exports = mongoose.model('PCRequirements', pcRequirementsSchema);