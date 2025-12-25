const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Enums
const ORDER_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    REFUNDED: "refunded"
};

const PAYMENT_STATUS = {
    CREATED: "created",
    ATTEMPTED: "attempted",
    CAPTURED: "captured",
    FAILED: "failed"
};

const PAYMENT_METHOD = {
    RAZORPAY: "razorpay"
};

const ORDER_SOURCE = {
    WEB: "web",
    MOBILE: "mobile",
    UNKNOWN: "unknown"
};

// Payment Attempt Schema
const paymentAttemptSchema = new Schema({
    razorpayOrderId: {
        type: String,
        required: true,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        sparse: true,
        index: true
    },
    razorpaySignature: {
        type: String,
        sparse: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: "INR"
    },
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.CREATED
    },
    gatewayPaymentMethod: {
        type: String,
        enum: ["card", "upi", "netbanking", "wallet"],
        sparse: true
    },
    gatewayResponse: {
        type: Schema.Types.Mixed,
        default: {}
    },
    signatureVerified: {
        type: Boolean,
        default: false
    },
    errorReason: String,
    razorpayExpiresAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    capturedAt: Date
}, { _id: true });

// Timeline Event Schema
const timelineEventSchema = new Schema({
    event: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    changedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    changedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

// Order Item with Price Tracking
const orderItemSchema = new Schema({
    productType: {
        type: String,
        enum: ["product", "prebuilt-pc"],
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "items.productType"
    },
    variant: {
        variantId: String,
        name: String,
        sku: String,
        identifyingAttributes: [{
            key: String,
            label: String,
            value: String
        }]
    },
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    image: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    discountedPrice: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    taxRate: {
        type: Number,
        default: 0.18
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    returnable: {
        type: Boolean,
        default: true
    },
    returnWindow: {
        type: Number,
        default: 7
    }
}, { _id: true });

// Enhanced Coupon Schema
const couponSchema = new Schema({
    couponId: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        required: true
    },
    code: {
        type: String,
        required: true
    },
    name: String,
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    maxDiscount: Number
}, { _id: false });

// Optional GST Info
const gstInfoSchema = new Schema({
    gstNumber: {
        type: String,
        uppercase: true,
        trim: true
    },
    businessName: {
        type: String,
        trim: true
    },
    businessAddress: {
        type: String,
        trim: true
    },
    isBusiness: {
        type: Boolean,
        default: false
    }
}, { _id: false });

// Shipping Events for Tracking
const shippingEventSchema = new Schema({
    event: {
        type: String,
        required: true
    },
    description: String,
    location: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, { _id: true });

// Main Order Schema
const orderSchema = new Schema({
    // Order Identification
    orderNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    // Order Source & Security
    source: {
        type: String,
        enum: Object.values(ORDER_SOURCE),
        default: ORDER_SOURCE.WEB
    },
    ipAddress: String,
    userAgent: String,
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },

    // Fraud Detection
    fraudScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    riskFlags: [{
        type: String,
        enum: ["high_value", "new_customer", "multiple_attempts", "suspicious_location"]
    }],

    // Order Items with Price Snapshots
    items: [orderItemSchema],

    // Pricing
    pricing: {
        subtotal: { type: Number, required: true, min: 0 },
        shipping: { type: Number, required: true, min: 0 },
        tax: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
        currency: { type: String, default: "INR" },
        amountPaid: { type: Number, default: 0 },
        amountDue: { type: Number, default: 0 },
        totalSavings: { type: Number, default: 0 }
    },

    // Address Snapshots
    shippingAddress: {
        type: Schema.Types.Mixed,
        required: true
    },
    billingAddress: {
        type: Schema.Types.Mixed,
        required: true
    },

    // Optional GST
    gstInfo: gstInfoSchema,

    // Shipping & Tracking
    shippingMethod: {
        name: { type: String, required: true },
        deliveryDays: { type: Number, required: true },
        cost: { type: Number, required: true },
        trackingNumber: String,
        carrier: String
    },
    shippingEvents: [shippingEventSchema],
    estimatedDelivery: Date,
    deliveredAt: Date,

    // Payment Information
    payment: {
        method: {
            type: String,
            enum: Object.values(PAYMENT_METHOD),
            required: true
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.CREATED
        },
        attempts: [paymentAttemptSchema],
        currentAttemptId: {
            type: Schema.Types.ObjectId
        },
        lastAttemptAt: Date,
        totalAttempts: {
            type: Number,
            default: 0
        },
        retryAllowed: {
            type: Boolean,
            default: true
        }
    },

    // Enhanced Coupon Info
    coupon: couponSchema,

    // Order Status & Timeline
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING
    },
    orderTimeline: [timelineEventSchema],

    // Invoice
    invoiceNumber: String,
    invoiceUrl: String,

    // Expiry for unpaid orders
    expiresAt: Date,

    // Refunds (Future)
    totalRefunded: {
        type: Number,
        default: 0
    },

    // Admin Notes
    adminNotes: [{
        note: String,
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Notifications
    sendNotifications: {
        type: Boolean,
        default: true
    },
    invoices: {
        autoGenerated: {
            invoiceNumber: {
                type: String,
                unique: true,
                sparse: true
            },
            pdfPath: {
                type: String,
                sparse: true
            },
            pdfUrl: {
                type: String,
                sparse: true
            },
            generatedAt: {
                type: Date
            },
            version: {
                type: Number,
                default: 1
            },
            status: {
                type: String,
                enum: ['generated', 'failed', 'pending'],
                default: 'pending'
            }
        },
        adminUploaded: {
            invoiceNumber: {
                type: String,
                sparse: true
            },
            originalFileName: {
                type: String,
                sparse: true
            },
            pdfPath: {
                type: String,
                sparse: true
            },
            pdfUrl: {
                type: String,
                sparse: true
            },
            uploadedAt: {
                type: Date
            },
            uploadedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                sparse: true
            },
            notes: {
                type: String,
                sparse: true
            },
            fileSize: {
                type: Number,
                sparse: true
            },
            mimeType: {
                type: String,
                sparse: true
            }
        }
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Add virtuals for easy access
orderSchema.virtual("hasAutoGeneratedInvoice").get(function () {
    return !!(this.invoices?.autoGenerated?.pdfPath);
});

orderSchema.virtual("hasAdminUploadedInvoice").get(function () {
    return !!(this.invoices?.adminUploaded?.pdfPath);
});

orderSchema.virtual("allInvoices").get(function () {
    const invoices = [];

    if (this.hasAutoGeneratedInvoice) {
        invoices.push({
            type: 'auto_generated',
            invoiceNumber: this.invoices.autoGenerated.invoiceNumber,
            pdfUrl: this.invoices.autoGenerated.pdfUrl,
            generatedAt: this.invoices.autoGenerated.generatedAt,
            version: this.invoices.autoGenerated.version,
            source: 'system'
        });
    }

    if (this.hasAdminUploadedInvoice) {
        invoices.push({
            type: 'admin_uploaded',
            invoiceNumber: this.invoices.adminUploaded.invoiceNumber,
            originalFileName: this.invoices.adminUploaded.originalFileName,
            pdfUrl: this.invoices.adminUploaded.pdfUrl,
            uploadedAt: this.invoices.adminUploaded.uploadedAt,
            uploadedBy: this.invoices.adminUploaded.uploadedBy,
            notes: this.invoices.adminUploaded.notes,
            fileSize: this.invoices.adminUploaded.fileSize,
            source: 'admin'
        });
    }

    return invoices;
});
// Virtuals
orderSchema.virtual("isPaid").get(function () {
    return this.payment.status === PAYMENT_STATUS.CAPTURED;
});

orderSchema.virtual("isDelivered").get(function () {
    return this.status === ORDER_STATUS.DELIVERED;
});

orderSchema.virtual("canBeCancelled").get(function () {
    const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
    return cancellableStatuses.includes(this.status) && !this.isPaid;
});

orderSchema.virtual("currentPaymentAttempt").get(function () {
    if (!this.payment.currentAttemptId) return null;
    return this.payment.attempts.id(this.payment.currentAttemptId);
});

// ✅ FIXED: REMOVED the duplicate virtual canRetryPayment
// Only keeping the instance method below

// In your Order Model - Fix the pre-save middleware
orderSchema.pre("save", async function (next) {
    // ✅ Check if this is a new document and orderNumber doesn't exist
    if (this.isNew && !this.orderNumber) {
        // Generate order number: ORD-YYYYMMDD-XXXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.orderNumber = `ORD-${dateStr}-${random}`;
    }

    // Set amount due if not set
    if (this.isNew && this.pricing) {
        this.pricing.amountDue = this.pricing.total || 0;

        // Calculate total savings
        if (this.items && this.items.length > 0) {
            this.pricing.totalSavings = this.items.reduce((total, item) => {
                const itemSavings = ((item.originalPrice || item.price) - (item.discountedPrice || item.price)) * item.quantity;
                return total + itemSavings;
            }, 0);
        }

        // Set expiry (24 hours for unpaid orders)
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Add initial timeline event
        if (!this.orderTimeline) {
            this.orderTimeline = [];
        }
        this.orderTimeline.push({
            event: "order_created",
            message: "Order was created",
            changedBy: this.user
        });
    }
    next();
});

// Static Methods
orderSchema.statics.findByRazorpayOrderId = function (razorpayOrderId) {
    return this.findOne({ "payment.attempts.razorpayOrderId": razorpayOrderId });
};

orderSchema.statics.findByRazorpayPaymentId = function (razorpayPaymentId) {
    return this.findOne({ "payment.attempts.razorpayPaymentId": razorpayPaymentId });
};

// Instance Methods
orderSchema.methods.addTimelineEvent = function (event, message, metadata = {}, changedBy = null) {
    this.orderTimeline.push({
        event,
        message,
        metadata,
        changedBy
    });
    return this.save();
};

orderSchema.methods.createPaymentAttempt = function (razorpayOrderId, amount, razorpayExpiresAt) {
    const attempt = {
        razorpayOrderId,
        amount,
        currency: this.pricing.currency,
        status: PAYMENT_STATUS.CREATED,
        razorpayExpiresAt: razorpayExpiresAt ? new Date(razorpayExpiresAt * 1000) : null
    };

    this.payment.attempts.push(attempt);

    const newAttempt = this.payment.attempts[this.payment.attempts.length - 1];
    this.payment.currentAttemptId = newAttempt._id;

    // Reset top-level payment status when creating new attempt
    this.payment.status = PAYMENT_STATUS.CREATED;
    this.payment.lastAttemptAt = new Date();
    this.payment.totalAttempts = (this.payment.totalAttempts || 0) + 1;

    // Disable retry after 5 attempts
    if (this.payment.totalAttempts >= 5) {
        this.payment.retryAllowed = false;
    }

    this.addTimelineEvent("payment_attempt_created", "New payment attempt created", {
        attemptId: newAttempt._id.toString(),
        razorpayOrderId,
        amount,
        totalAttempts: this.payment.totalAttempts
    });

    return this.save().then(() => newAttempt._id.toString()); // ✅ Return the attemptId
};

orderSchema.methods.updatePaymentAttempt = function (attemptId, updates) {
    const attempt = this.payment.attempts.id(attemptId);
    if (!attempt) {
        throw new Error(`Payment attempt ${attemptId} not found`);
    }

    // Prevent double capture
    if (attempt.status === PAYMENT_STATUS.CAPTURED && updates.status === PAYMENT_STATUS.CAPTURED) {
        return this;
    }

    Object.assign(attempt, updates);

    // ✅ FIXED: Update top-level payment.status to match attempt status
    // This ensures consistency between attempt and order payment status
    if (updates.status) {
        this.payment.status = updates.status;
    }

    // Add timeline events based on status changes
    if (updates.status === PAYMENT_STATUS.ATTEMPTED) {
        this.addTimelineEvent("payment_attempted", "User attempted payment", {
            attemptId: attemptId.toString(),
            razorpayPaymentId: updates.razorpayPaymentId
        });
    }
    else if (updates.status === PAYMENT_STATUS.CAPTURED) {
        // Only update order status if not already confirmed
        if (this.status !== ORDER_STATUS.CONFIRMED) {
            this.status = ORDER_STATUS.CONFIRMED;
            this.pricing.amountPaid = this.pricing.total;
            this.pricing.amountDue = 0;
            this.expiresAt = undefined;
        }

        this.addTimelineEvent("payment_captured", "Payment was successfully captured", {
            attemptId: attemptId.toString(),
            razorpayPaymentId: updates.razorpayPaymentId,
            gatewayPaymentMethod: updates.gatewayPaymentMethod
        });
    }
    else if (updates.status === PAYMENT_STATUS.FAILED) {
        this.addTimelineEvent("payment_failed", "Payment attempt failed", {
            attemptId: attemptId.toString(),
            errorReason: updates.errorReason
        });
    }

    return this.save();
};

orderSchema.methods.getSuccessfulAttempt = function () {
    return this.payment.attempts.find(attempt =>
        attempt.status === PAYMENT_STATUS.CAPTURED
    );
};

// ✅ FIXED: Only ONE canRetryPayment method (instance method)
orderSchema.methods.canRetryPayment = function () {
    return this.payment.retryAllowed &&
        this.payment.status !== PAYMENT_STATUS.CAPTURED &&
        this.status === ORDER_STATUS.PENDING &&
        this.payment.totalAttempts < 5;
};

// Indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, "payment.status": 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "payment.attempts.razorpayOrderId": 1 });
orderSchema.index({ "payment.attempts.razorpayPaymentId": 1 });
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Order", orderSchema);
module.exports.ORDER_STATUS = ORDER_STATUS;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
module.exports.PAYMENT_METHOD = PAYMENT_METHOD;