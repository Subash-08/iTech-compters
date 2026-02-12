const mongoose = require("mongoose");

const socialProofSectionSchema = new mongoose.Schema(
    {
        isActive: {
            type: Boolean,
            default: true
        },
        backgroundColor: {
            type: String,
            default: "#0FA3A3",
            trim: true
        },
        backgroundImage: {
            url: {
                type: String,
                default: ""
            },
            altText: {
                type: String,
                default: "Social Proof Background"
            }
        },
        heading: {
            type: String,
            required: [true, "Heading is required"],
            trim: true,
            maxLength: 100,
            default: "JOIN OUR THRIVING TRIBE"
        },
        illustrationImage: {
            url: {
                type: String,
                default: ""
            },
            altText: {
                type: String,
                default: "Social Proof Illustration"
            }
        },
        google: {
            rating: {
                type: Number,
                required: [true, "Google rating is required"],
                min: 0,
                max: 5,
                default: 4.8
            },
            label: {
                type: String,
                default: "Rating on Google Review",
                trim: true
            }
        },
        instagram: {
            followers: {
                type: String,
                required: [true, "Instagram followers count is required"],
                trim: true,
                default: "168K"
            },
            label: {
                type: String,
                default: "Followers on Instagram",
                trim: true
            }
        },
        youtube: {
            subscribers: {
                type: String,
                required: [true, "YouTube subscribers count is required"],
                trim: true,
                default: "12K+"
            },
            label: {
                type: String,
                default: "Subscribers on YouTube",
                trim: true
            }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("SocialProofSection", socialProofSectionSchema);
