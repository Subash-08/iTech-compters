const mongoose = require("mongoose");

const ytVideoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Video title is required"],
            trim: true,
            maxLength: [200, "Title cannot exceed 200 characters"]
        },
        videoUrl: {
            type: String,
            required: [true, "YouTube video URL is required"],
            trim: true
        },
        videoId: {
            type: String,
            required: true,
            trim: true
        },
        thumbnailUrl: {
            type: String,
            required: true
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

module.exports = mongoose.model("YTVideo", ytVideoSchema);