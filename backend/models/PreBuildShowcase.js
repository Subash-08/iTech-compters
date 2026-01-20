const mongoose = require("mongoose");

const preBuildShowcaseSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: [true, "Category is required (e.g., Creative Power)"],
            trim: true,
            maxLength: 50
        },
        title: {
            type: String,
            required: [true, "Title is required (e.g., Content Creation)"],
            trim: true,
            maxLength: 50
        },
        price: {
            type: String,
            required: [true, "Price label is required (e.g., Starting ₹49999)"],
            trim: true
        },
        image: {
            url: {
                type: String,
                required: true
            },
            altText: String
        },
        buttonLink: {
            type: String,
            default: "/prebuilt-pcs",
            trim: true
        },
        isWide: {
            type: Boolean,
            default: true,
            description: "Determines if the card spans full width (col-span-4)"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PreBuildShowcase", preBuildShowcaseSchema);