const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, unique: true, lowercase: true },
        logo: String,
        description: String,
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
