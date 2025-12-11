const express = require('express');
const router = express.Router();
const Reel = require('../models/InstagramReel');

// Helper to extract reel ID from URL
const extractReelId = (url) => {
    const matches = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
    return matches ? matches[1] : null;
};

// Helper to create embed URL
const createEmbedUrl = (reelId, width = 600) => {
    return `https://www.instagram.com/reel/${reelId}/embed/captioned/?cr=1&v=14&wp=${width}&rd=${encodeURIComponent('https://itechcomputers.shop')}&rp=%2F`;
};

// GET all active reels
router.get('/', async (req, res) => {
    try {
        const reels = await Reel.find({ isActive: true }).sort({ order: 1 });
        res.json(reels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single reel
router.get('/:id', async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });
        res.json(reel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create new reel
router.post('/', async (req, res) => {
    try {
        const { instagramUrl, title, description, thumbnail, views, likes, comments, duration, height, order } = req.body;

        // Extract reel ID from URL
        const reelId = extractReelId(instagramUrl);
        if (!reelId) {
            return res.status(400).json({ message: 'Invalid Instagram Reel URL' });
        }

        // Create embed URL
        const embedUrl = createEmbedUrl(reelId, height || 600);

        const reel = new Reel({
            instagramUrl,
            embedUrl,
            reelId,
            title,
            description,
            thumbnail,
            views: views || 0,
            likes: likes || 0,
            comments: comments || 0,
            duration: duration || 0,
            height: height || 600,
            order: order || 0
        });

        const savedReel = await reel.save();
        res.status(201).json(savedReel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update reel
router.put('/:id', async (req, res) => {
    try {
        const { instagramUrl, title, description, thumbnail, views, likes, comments, duration, height, order, isActive } = req.body;

        const updates = {
            title,
            description,
            thumbnail,
            views,
            likes,
            comments,
            duration,
            height,
            order,
            isActive,
            updatedAt: Date.now()
        };

        // If URL changed, update embed URL and reel ID
        if (instagramUrl) {
            const reelId = extractReelId(instagramUrl);
            if (!reelId) {
                return res.status(400).json({ message: 'Invalid Instagram Reel URL' });
            }
            updates.instagramUrl = instagramUrl;
            updates.reelId = reelId;
            updates.embedUrl = createEmbedUrl(reelId, height || 600);
        }

        const reel = await Reel.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!reel) return res.status(404).json({ message: 'Reel not found' });
        res.json(reel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE reel
router.delete('/:id', async (req, res) => {
    try {
        const reel = await Reel.findByIdAndDelete(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });
        res.json({ message: 'Reel deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;