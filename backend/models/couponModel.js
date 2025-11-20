const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        // Basic Information
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            maxLength: [20, 'Coupon code cannot exceed 20 characters']
        },
        name: {
            type: String,
            required: [true, 'Coupon name is required'],
            trim: true,
            maxLength: [100, 'Coupon name cannot exceed 100 characters']
        },
        description: {
            type: String,
            maxLength: [500, 'Description cannot exceed 500 characters']
        },

        // Discount Configuration
        discountType: {
            type: String,
            enum: ["percentage", "fixed", "free_shipping"],
            required: [true, 'Discount type is required']
        },
        discountValue: {
            type: Number,
            required: function () {
                return this.discountType !== 'free_shipping';
            },
            min: [0, 'Discount value cannot be negative'],
            validate: {
                validator: function (value) {
                    if (this.discountType === 'percentage') {
                        return value <= 100;
                    }
                    return true;
                },
                message: 'Percentage discount cannot exceed 100%'
            }
        },
        maximumDiscount: {
            type: Number,
            min: [0, 'Maximum discount cannot be negative'],
            default: null
        },
        minimumCartValue: {
            type: Number,
            min: [0, 'Minimum cart value cannot be negative'],
            default: 0
        },

        // Usage Limits
        usageLimit: {
            type: Number,
            min: [0, 'Usage limit cannot be negative'],
            default: null
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0
        },
        usageLimitPerUser: {
            type: Number,
            min: [0, 'Usage limit per user cannot be negative'],
            default: 1
        },

        // Validity Period
        validFrom: {
            type: Date,
            required: [true, 'Valid from date is required']
        },
        validUntil: {
            type: Date,
            required: [true, 'Valid until date is required']
        },

        // Applicability
        applicableTo: {
            type: String,
            enum: ["all_products", "specific_products", "specific_categories", "specific_brands"],
            default: "all_products"
        },
        specificProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }],
        specificCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        }],
        specificBrands: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand"
        }],
        excludedProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }],

        // User Restrictions
        allowedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        userEligibility: {
            type: String,
            enum: ["all_users", "new_users", "existing_users", "specific_users"],
            default: "all_users"
        },
        minimumOrders: {
            type: Number,
            min: 0,
            default: 0
        },

        // Status Management
        status: {
            type: String,
            enum: ["active", "inactive", "expired", "usage_limit_reached"],
            default: "active",
            index: true
        },
        isOneTimeUse: {
            type: Boolean,
            default: false
        },

        // Audit Fields
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for checking if coupon is currently valid
couponSchema.virtual("isValid").get(function () {
    const now = new Date();
    return this.status === "active" &&
        now >= this.validFrom &&
        now <= this.validUntil &&
        (!this.usageLimit || this.usageCount < this.usageLimit);
});

// Virtual for remaining uses
couponSchema.virtual("remainingUses").get(function () {
    if (!this.usageLimit) return Infinity;
    return Math.max(0, this.usageLimit - this.usageCount);
});

// Virtual for days remaining
couponSchema.virtual("daysRemaining").get(function () {
    const now = new Date();
    const validUntil = new Date(this.validUntil);
    if (now > validUntil) return 0;
    const diffTime = validUntil - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for performance
couponSchema.index({ code: 1, status: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ status: 1, validUntil: 1 });
couponSchema.index({ applicableTo: 1, specificProducts: 1 });
couponSchema.index({ applicableTo: 1, specificCategories: 1 });

// Pre-save middleware to update status based on conditions
couponSchema.pre('save', function (next) {
    const now = new Date();

    // Check if coupon has expired
    if (this.validUntil < now) {
        this.status = "expired";
    }

    // Check if usage limit reached
    if (this.usageLimit && this.usageCount >= this.usageLimit) {
        this.status = "usage_limit_reached";
    }

    next();
});

// Static methods
couponSchema.statics.getActiveCoupons = function () {
    const now = new Date();
    return this.find({
        status: "active",
        validFrom: { $lte: now },
        validUntil: { $gte: now }
    });
};

couponSchema.statics.validateCoupon = async function (code, userId, cartItems = [], cartTotal = 0) {
    const coupon = await this.findOne({
        code: code.toUpperCase(),
        status: "active"
    });

    if (!coupon) {
        throw new Error("Invalid coupon code");
    }

    const validation = coupon.validateForUser(userId, cartItems, cartTotal);
    if (!validation.isValid) {
        throw new Error(validation.message);
    }

    return coupon;
};

// Instance methods
couponSchema.methods.validateForUser = function (userId, cartItems = [], cartTotal = 0) {
    const now = new Date();
    const result = { isValid: true, message: "" };

    // Check validity period
    if (now < this.validFrom) {
        result.isValid = false;
        result.message = "Coupon is not yet valid";
        return result;
    }

    if (now > this.validUntil) {
        result.isValid = false;
        result.message = "Coupon has expired";
        return result;
    }

    // Check usage limits
    if (this.usageLimit && this.usageCount >= this.usageLimit) {
        result.isValid = false;
        result.message = "Coupon usage limit reached";
        return result;
    }

    // Check minimum cart value
    if (cartTotal < this.minimumCartValue) {
        result.isValid = false;
        result.message = `Minimum cart value of ${this.minimumCartValue} required`;
        return result;
    }

    // Check user eligibility
    if (this.userEligibility === "new_users") {
        // This would require checking user's order history
        result.isValid = false;
        result.message = "Coupon is only for new users";
        return result;
    }

    if (this.userEligibility === "specific_users" &&
        this.allowedUsers.length > 0 &&
        !this.allowedUsers.includes(userId)) {
        result.isValid = false;
        result.message = "You are not eligible for this coupon";
        return result;
    }

    // Check product applicability
    if (this.applicableTo !== "all_products") {
        const applicableItems = cartItems.filter(item => {
            if (this.applicableTo === "specific_products") {
                return this.specificProducts.includes(item.product);
            } else if (this.applicableTo === "specific_categories") {
                return this.specificCategories.includes(item.category);
            } else if (this.applicableTo === "specific_brands") {
                return this.specificBrands.includes(item.brand);
            }
            return false;
        });

        if (applicableItems.length === 0) {
            result.isValid = false;
            result.message = "Coupon not applicable to any items in cart";
            return result;
        }
    }

    // Check excluded products
    if (this.excludedProducts.length > 0) {
        const hasExcludedProducts = cartItems.some(item =>
            this.excludedProducts.includes(item.product)
        );

        if (hasExcludedProducts) {
            result.isValid = false;
            result.message = "Coupon cannot be used with some products in your cart";
            return result;
        }
    }

    return result;
};

couponSchema.methods.calculateDiscount = function (cartTotal, applicableItemsTotal = null) {
    let discount = 0;
    const amountToApply = applicableItemsTotal !== null ? applicableItemsTotal : cartTotal;

    switch (this.discountType) {
        case "percentage":
            discount = (amountToApply * this.discountValue) / 100;
            if (this.maximumDiscount && discount > this.maximumDiscount) {
                discount = this.maximumDiscount;
            }
            break;

        case "fixed":
            discount = Math.min(this.discountValue, amountToApply);
            break;

        case "free_shipping":
            discount = 0; // This would be handled separately in shipping calculation
            break;
    }

    return Math.max(0, Math.min(discount, cartTotal));
};

couponSchema.methods.incrementUsage = async function (userId) {
    this.usageCount += 1;

    if (this.isOneTimeUse) {
        this.status = "inactive";
    }

    await this.save();

    // Record usage in separate collection if needed
    // await CouponUsage.create({ coupon: this._id, user: userId, usedAt: new Date() });
};

// Query helpers
couponSchema.query.active = function () {
    const now = new Date();
    return this.where({
        status: "active",
        validFrom: { $lte: now },
        validUntil: { $gte: now }
    });
};

couponSchema.query.expired = function () {
    const now = new Date();
    return this.where({
        $or: [
            { status: "expired" },
            { validUntil: { $lt: now } }
        ]
    });
};

couponSchema.query.validForUser = function (userId) {
    const now = new Date();
    return this.where({
        status: "active",
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $or: [
            { userEligibility: "all_users" },
            { userEligibility: "existing_users" },
            { allowedUsers: userId }
        ]
    });
};

module.exports = mongoose.model("Coupon", couponSchema);