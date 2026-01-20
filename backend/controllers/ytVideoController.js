const YTVideo = require("../models/YTVideo");

// Helper: Extract YouTube Video ID
const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Create new video
exports.createYTVideo = async (req, res, next) => {
    try {
        const { title, videoUrl, order, isActive } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ success: false, message: "Video URL is required" });
        }

        const videoId = extractVideoId(videoUrl);

        if (!videoId) {
            return res.status(400).json({ success: false, message: "Invalid YouTube URL" });
        }

        // Auto-generate high-res thumbnail URL from YouTube
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        const video = await YTVideo.create({
            title,
            videoUrl,
            videoId,
            thumbnailUrl,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: "YouTube video added successfully",
            data: video
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all videos (Public - Active only)
exports.getYTVideos = async (req, res, next) => {
    try {
        const videos = await YTVideo.find({ isActive: true }).sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: videos.length,
            data: videos
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all videos (Admin - All)
exports.getAdminYTVideos = async (req, res, next) => {
    try {
        const videos = await YTVideo.find().sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: videos
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update video
exports.updateYTVideo = async (req, res, next) => {
    try {
        let video = await YTVideo.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        const { title, videoUrl, order, isActive } = req.body;
        const updateData = { title, order, isActive };

        // If URL changed, update ID and Thumbnail
        if (videoUrl && videoUrl !== video.videoUrl) {
            const videoId = extractVideoId(videoUrl);
            if (!videoId) {
                return res.status(400).json({ success: false, message: "Invalid YouTube URL" });
            }
            updateData.videoUrl = videoUrl;
            updateData.videoId = videoId;
            updateData.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }

        video = await YTVideo.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: "YouTube video updated successfully",
            data: video
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete video
exports.deleteYTVideo = async (req, res, next) => {
    try {
        const video = await YTVideo.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        await video.deleteOne();

        res.status(200).json({
            success: true,
            message: "YouTube video deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};