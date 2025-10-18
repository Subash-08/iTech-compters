const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: String,
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true, select: false },
    avatar: String,
    bio: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            variant: { type: mongoose.Schema.Types.ObjectId },
            quantity: { type: Number, default: 1 },
        },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
}, { timestamps: true });

// 🔐 Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 🔑 JWT token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
};

// 🔍 Password validation
userSchema.methods.isValidPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// 🔄 Password reset token
userSchema.methods.getResetToken = function () {
    const token = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000; // 30 min
    return token;
};

// 💳 Add product to cart
userSchema.methods.addToCart = async function (productId, variantId, quantity = 1) {
    const itemIndex = this.cart.findIndex(
        item => item.product.toString() === productId.toString() && item.variant.toString() === variantId.toString()
    );
    if (itemIndex > -1) {
        this.cart[itemIndex].quantity += quantity;
    } else {
        this.cart.push({ product: productId, variant: variantId, quantity });
    }
    await this.save();
};

// 🗑️ Remove product from cart
userSchema.methods.removeFromCart = async function (productId, variantId) {
    this.cart = this.cart.filter(
        item => !(item.product.toString() === productId.toString() && item.variant.toString() === variantId.toString())
    );
    await this.save();
};

module.exports = mongoose.model("User", userSchema);
