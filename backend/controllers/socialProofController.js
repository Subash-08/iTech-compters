const SocialProofSection = require("../models/SocialProofSection");
const fs = require("fs");
const path = require("path");

// Create or Update Social Proof Section (Admin only)
exports.createOrUpdateSocialProof = async (req, res, next) => {
    try {
        const {
            isActive,
            backgroundColor,
            heading,
            googleRating,
            googleLabel,
            instagramFollowers,
            instagramLabel,
            youtubeSubscribers,
            youtubeLabel
        } = req.body;

        // Check if section already exists
        let section = await SocialProofSection.findOne();

        const data = {
            isActive: isActive === 'true' || isActive === true,
            backgroundColor,
            heading,
            google: {
                rating: parseFloat(googleRating),
                label: googleLabel
            },
            instagram: {
                followers: instagramFollowers,
                label: instagramLabel
            },
            youtube: {
                subscribers: youtubeSubscribers,
                label: youtubeLabel
            }
        };

        // Handle Image Uploads (req.files when using .fields())
        if (req.files) {
            // Handle illustration image
            if (req.files.illustrationImage && req.files.illustrationImage[0]) {
                const imageUrl = `/uploads/sections/social-proof/${req.files.illustrationImage[0].filename}`;

                // If updating and old image exists, delete it
                if (section && section.illustrationImage && section.illustrationImage.url) {
                    const oldPath = path.join(__dirname, `../public${section.illustrationImage.url}`);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                data.illustrationImage = {
                    url: imageUrl,
                    altText: heading || "Social Proof Illustration"
                };
            }

            // Handle background image
            if (req.files.backgroundImage && req.files.backgroundImage[0]) {
                const bgImageUrl = `/uploads/sections/social-proof/${req.files.backgroundImage[0].filename}`;

                // If updating and old background image exists, delete it
                if (section && section.backgroundImage && section.backgroundImage.url) {
                    const oldPath = path.join(__dirname, `../public${section.backgroundImage.url}`);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                data.backgroundImage = {
                    url: bgImageUrl,
                    altText: "Social Proof Background"
                };
            }
        }

        if (section) {
            // Update existing section
            section = await SocialProofSection.findByIdAndUpdate(
                section._id,
                data,
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                message: "Social proof section updated successfully",
                data: section
            });
        } else {
            // Create new section
            section = await SocialProofSection.create(data);

            return res.status(201).json({
                success: true,
                message: "Social proof section created successfully",
                data: section
            });
        }

    } catch (error) {
        // Cleanup files if DB save fails
        if (req.files) {
            if (req.files.illustrationImage) {
                fs.unlink(req.files.illustrationImage[0].path, (err) => {
                    if (err) console.error("Error deleting illustration file:", err);
                });
            }
            if (req.files.backgroundImage) {
                fs.unlink(req.files.backgroundImage[0].path, (err) => {
                    if (err) console.error("Error deleting background file:", err);
                });
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Social Proof Section (Public)
exports.getSocialProof = async (req, res, next) => {
    try {
        const section = await SocialProofSection.findOne({ isActive: true });

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "No active social proof section found"
            });
        }

        res.status(200).json({
            success: true,
            data: section
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Social Proof Section (Admin - includes inactive)
exports.getAdminSocialProof = async (req, res, next) => {
    try {
        const section = await SocialProofSection.findOne();

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "No social proof section found"
            });
        }

        res.status(200).json({
            success: true,
            data: section
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Social Proof Section by ID (Admin only)
exports.updateSocialProofById = async (req, res, next) => {
    try {
        let section = await SocialProofSection.findById(req.params.id);

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Social proof section not found"
            });
        }

        const {
            isActive,
            backgroundColor,
            heading,
            googleRating,
            googleLabel,
            instagramFollowers,
            instagramLabel,
            youtubeSubscribers,
            youtubeLabel
        } = req.body;

        const data = {};

        if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;
        if (backgroundColor) data.backgroundColor = backgroundColor;
        if (heading) data.heading = heading;

        // Update Google data
        if (googleRating || googleLabel) {
            data.google = {
                rating: googleRating ? parseFloat(googleRating) : section.google.rating,
                label: googleLabel || section.google.label
            };
        }

        // Update Instagram data
        if (instagramFollowers || instagramLabel) {
            data.instagram = {
                followers: instagramFollowers || section.instagram.followers,
                label: instagramLabel || section.instagram.label
            };
        }

        // Update YouTube data
        if (youtubeSubscribers || youtubeLabel) {
            data.youtube = {
                subscribers: youtubeSubscribers || section.youtube.subscribers,
                label: youtubeLabel || section.youtube.label
            };
        }

        // Handle Image Updates (req.files when using .fields())
        if (req.files) {
            // Handle illustration image update
            if (req.files.illustrationImage && req.files.illustrationImage[0]) {
                // Delete old image
                if (section.illustrationImage && section.illustrationImage.url) {
                    const oldPath = path.join(__dirname, `../public${section.illustrationImage.url}`);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                data.illustrationImage = {
                    url: `/uploads/sections/social-proof/${req.files.illustrationImage[0].filename}`,
                    altText: heading || section.heading
                };
            }

            // Handle background image update
            if (req.files.backgroundImage && req.files.backgroundImage[0]) {
                // Delete old background image
                if (section.backgroundImage && section.backgroundImage.url) {
                    const oldPath = path.join(__dirname, `../public${section.backgroundImage.url}`);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                data.backgroundImage = {
                    url: `/uploads/sections/social-proof/${req.files.backgroundImage[0].filename}`,
                    altText: "Social Proof Background"
                };
            }
        }

        section = await SocialProofSection.findByIdAndUpdate(
            req.params.id,
            data,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Social proof section updated successfully",
            data: section
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
