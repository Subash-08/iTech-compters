const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            variant: { type: mongoose.Schema.Types.ObjectId },
            quantity: { type: Number, default: 1 },
            price: Number,
            offerPrice: Number,
        }
    ],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        fullName: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        phone: String,
    },
    paymentMethod: { type: String, enum: ["COD", "Stripe", "PayPal"], default: "COD" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    status: { type: String, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
}, { timestamps: true });

// Pre-save: calculate totalAmount if not provided
orderSchema.pre("save", async function (next) {
    if (!this.totalAmount && this.products.length > 0) {
        this.totalAmount = this.products.reduce((sum, item) => {
            const price = item.offerPrice || item.price || 0;
            return sum + price * item.quantity;
        }, 0);
    }
    next();
});

module.exports = mongoose.model("Order", orderSchema);
