const PreBuildShowcase = require("../models/PreBuildShowcase");
const fs = require("fs");
const path = require("path");

// Create new showcase item
exports.createShowcaseItem = async (req, res, next) => {
    try {
        const { category, title, price, buttonLink, isWide, isActive, order } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please upload a background image" });
        }

        // Construct image URL (relative path)
        const imageUrl = `/uploads/sections/prebuild/${req.file.filename}`;

        const newItem = await PreBuildShowcase.create({
            category,
            title,
            price,
            image: {
                url: imageUrl,
                altText: title
            },
            buttonLink,
            isWide: isWide === 'true' || isWide === true,
            isActive: isActive === 'true' || isActive === true,
            order
        });

        res.status(201).json({
            success: true,
            message: "Showcase item created successfully",
            data: newItem
        });

    } catch (error) {
        // Cleanup file if DB save fails
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file after failed db save:", err);
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all items (Public)
exports.getShowcaseItems = async (req, res, next) => {
    try {
        // Fetch active items sorted by 'order'
        const items = await PreBuildShowcase.find({ isActive: true }).sort({ order: 1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all items (Admin - includes inactive)
exports.getAdminShowcaseItems = async (req, res, next) => {
    try {
        const items = await PreBuildShowcase.find().sort({ order: 1 });
        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update item
exports.updateShowcaseItem = async (req, res, next) => {
    try {
        let item = await PreBuildShowcase.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        const data = { ...req.body };

        // Handle Image Update
        if (req.file) {
            // 1. Delete old image
            if (item.image && item.image.url) {
                const oldPath = path.join(__dirname, `../public${item.image.url}`);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            // 2. Set new image
            data.image = {
                url: `/uploads/sections/prebuild/${req.file.filename}`,
                altText: data.title || item.title
            };
        }

        item = await PreBuildShowcase.findByIdAndUpdate(req.params.id, data, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: "Item updated successfully",
            data: item
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete item
exports.deleteShowcaseItem = async (req, res, next) => {
    try {
        const item = await PreBuildShowcase.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Delete image file
        if (item.image && item.image.url) {
            const filePath = path.join(__dirname, `../public${item.image.url}`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await item.deleteOne();

        res.status(200).json({
            success: true,
            message: "Item deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};