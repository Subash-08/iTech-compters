const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    customer: {
        name: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        email: String,
        address: String,
        companyName: String,
        gstin: String,
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        sku: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        gstPercentage: {
            type: Number,
            default: 0
        },
        gstAmount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        },
        category: String,
        variant: mongoose.Schema.Types.Mixed
    }],
    customProducts: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        gstPercentage: {
            type: Number,
            default: 0
        },
        gstAmount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        },
        category: String,
        isCustom: {
            type: Boolean,
            default: true
        },
        sku: String,
        hsnCode: String
    }],
    preBuiltPCs: [{
        pcId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PreBuiltPC',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        components: [{
            name: String,
            sku: String,
            quantity: Number,
            unitPrice: Number
        }],
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        gstPercentage: {
            type: Number,
            default: 0
        },
        gstAmount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    }],
    totals: {
        subtotal: {
            type: Number,
            required: true,
            default: 0
        },
        totalGst: {
            type: Number,
            required: true,
            default: 0
        },
        grandTotal: {
            type: Number,
            required: true,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        shipping: {
            type: Number,
            default: 0
        },
        roundOff: {
            type: Number,
            default: 0
        }
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'paid', 'cancelled', 'refunded'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['cash', 'card', 'upi', 'cod', 'bank_transfer', 'online'],
            default: 'cash'
        },
        transactionId: String,
        paidAmount: Number,
        paidDate: Date
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    dueDate: Date,
    notes: String,
    adminNotes: String,
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pdfPath: String,
    metadata: {
        ipAddress: String,
        userAgent: String
    }
}, {
    timestamps: true
});

// Generate invoice number
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        this.invoiceNumber = `INV-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
    }

    // Calculate due date (30 days from invoice date if not set)
    if (!this.dueDate) {
        const dueDate = new Date(this.invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);
        this.dueDate = dueDate;
    }

    next();
});

invoiceSchema.pre('save', function (next) {
    let subtotal = 0;
    let totalGst = 0;

    // Calculate products totals
    this.products.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemGst = itemTotal * (item.gstPercentage / 100);
        item.total = itemTotal;
        item.gstAmount = itemGst;
        subtotal += itemTotal;
        totalGst += itemGst;
    });

    // Calculate custom products totals
    this.customProducts.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemGst = itemTotal * (item.gstPercentage / 100);
        item.total = itemTotal;
        item.gstAmount = itemGst;
        subtotal += itemTotal;
        totalGst += itemGst;
    });
    // Apply discount and shipping
    const afterDiscount = subtotal - (this.totals.discount || 0);
    const afterShipping = afterDiscount + (this.totals.shipping || 0);

    // Calculate grand total with GST
    const grandTotalBeforeRound = afterShipping + totalGst;
    const roundOff = Math.round(grandTotalBeforeRound) - grandTotalBeforeRound;

    this.totals.subtotal = subtotal;
    this.totals.totalGst = totalGst;
    this.totals.grandTotal = Math.round(grandTotalBeforeRound);
    this.totals.roundOff = roundOff;

    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);