const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, unique: true, lowercase: true },
        description: { type: String },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
