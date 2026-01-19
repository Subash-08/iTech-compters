const Video = require('../models/Video');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const sharp = require('sharp'); // ADD THIS IMPORT

// Set ffmpeg path from ffmpeg-static
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}
// Import from uploadVideo
const {
    getVideoMetadata,
    generateThumbnail,
    optimizeVideo
} = require('../middlewares/uploadVideo');

// Or if you created a separate videoOptimizer utility:
// const videoOptimizer = require('../utils/videoOptimizer');

class VideoController {
    uploadVideo = async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No video file provided'
                });
            }

            // Get basic metadata (no FFmpeg)
            const metadata = await getVideoMetadata(req.file.path, req.file);

            // Generate placeholder thumbnail
            const thumbnailFilename = `thumb_${path.basename(req.file.filename, path.extname(req.file.filename))}.jpg`;
            const thumbnailPath = await generateThumbnail(req.file.path, thumbnailFilename);

            // No optimization - just use original file
            const videoUrl = `uploads/videos/original/${req.file.filename}`;

            // Parse tags from request
            let tags = [];
            if (req.body.tags) {
                try {
                    tags = JSON.parse(req.body.tags);
                    if (!Array.isArray(tags)) {
                        tags = [];
                    }
                } catch (error) {
                    // If JSON parsing fails, use empty array
                    tags = [];
                }
            }

            // Create video record
            const video = new Video({
                filename: req.file.filename,
                originalName: req.file.originalname,
                title: req.body.title || path.parse(req.file.originalname).name,
                description: req.body.description || '',
                path: req.file.path,
                url: videoUrl,
                thumbnail: thumbnailPath,
                thumbnailUrl: `/public/uploads/thumbnails/${thumbnailFilename}`,
                optimizedUrl: videoUrl, // Same as original since no optimization
                duration: metadata.duration,
                size: metadata.size,
                format: metadata.format,
                resolution: metadata.resolution,
                bitrate: metadata.bitrate,
                optimized: false, // No optimization without FFmpeg
                tags: tags
            });

            await video.save();
            const populatedVideo = await Video.findById(video._id)
                .select('-path -__v')
                .lean();

            // Calculate virtual properties manually for response
            const responseVideo = {
                ...populatedVideo,
                durationFormatted: populatedVideo.durationFormatted || '0:00',
                sizeFormatted: populatedVideo.sizeFormatted || '0 B'
            };

            res.status(201).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    video: responseVideo
                }
            });
        } catch (error) {
            console.error('Upload error:', error);

            // Cleanup uploaded file on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                success: false,
                message: 'Failed to upload video',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    // Upload multiple videos
    uploadMultipleVideos = async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No video files provided'
                });
            }

            const uploadPromises = req.files.map(async (file, index) => {
                try {
                    const metadata = await videoOptimizer.getVideoMetadata(file.path);

                    const thumbnailFilename = `thumb_${path.basename(file.filename, path.extname(file.filename))}.jpg`;
                    const thumbnailPath = path.join('public/uploads/thumbnails', thumbnailFilename);
                    await videoOptimizer.generateThumbnail(file.path, thumbnailPath);

                    const optimizedFilename = `optimized_${file.filename}`;
                    const optimizedPath = path.join('uploads/videos/optimized', optimizedFilename);
                    await videoOptimizer.optimizeVideo(file.path, optimizedPath, 'medium');

                    const video = new Video({
                        filename: file.filename,
                        originalName: file.originalname,
                        title: req.body.titles?.[index] || path.parse(file.originalname).name,
                        description: req.body.descriptions?.[index] || '',
                        path: file.path,
                        url: `/uploads/videos/original/${file.filename}`,
                        thumbnail: thumbnailPath,
                        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
                        optimizedUrl: `/uploads/videos/optimized/${optimizedFilename}`,
                        duration: metadata.duration,
                        size: metadata.size,
                        format: metadata.format,
                        resolution: metadata.resolution,
                        bitrate: metadata.bitrate,
                        optimized: true,
                        tags: req.body.tags?.[index] || []
                    });

                    return await video.save();
                } catch (error) {
                    console.error(`Error processing file ${file.originalname}:`, error);
                    return null;
                }
            });

            const videos = (await Promise.all(uploadPromises)).filter(v => v !== null);

            res.status(201).json({
                success: true,
                message: `${videos.length} video(s) uploaded successfully`,
                data: {
                    videos: videos.map(video => ({
                        id: video._id,
                        title: video.title,
                        url: video.url,
                        thumbnailUrl: video.thumbnailUrl,
                        duration: video.durationFormatted,
                        size: video.sizeFormatted
                    }))
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload videos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    getAllVideos = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const filter = {};

            // Search filter
            if (req.query.search) {
                filter.$or = [
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } },
                    { originalName: { $regex: req.query.search, $options: 'i' } }
                ];
            }

            // Used filter
            if (req.query.isUsed !== undefined) {
                filter.isUsed = req.query.isUsed === 'true';
            }

            // Date range filter
            if (req.query.startDate && req.query.endDate) {
                filter.createdAt = {
                    $gte: new Date(req.query.startDate),
                    $lte: new Date(req.query.endDate)
                };
            }

            const total = await Video.countDocuments(filter);
            const videos = await Video.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-path -__v');

            // Ensure virtual properties are calculated
            const videosWithVirtuals = videos.map(video => ({
                ...video.toObject(),
                durationFormatted: video.durationFormatted || '0:00',
                sizeFormatted: video.sizeFormatted || '0 B'
            }));

            res.json({
                success: true,
                data: {
                    videos: videosWithVirtuals,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get videos error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch videos'
            });
        }
    }

    // Get single video - FIXED
    getVideoById = async (req, res) => {
        try {
            const video = await Video.findById(req.params.id)
                .select('-path -__v');

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Ensure virtual properties
            const videoWithVirtuals = {
                ...video.toObject(),
                durationFormatted: video.durationFormatted || '0:00',
                sizeFormatted: video.sizeFormatted || '0 B'
            };

            res.json({
                success: true,
                data: { video: videoWithVirtuals }
            });
        } catch (error) {
            console.error('Get video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch video'
            });
        }
    }

    // Update video
    updateVideo = async (req, res) => {
        try {
            const video = await Video.findById(req.params.id);

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Update fields
            if (req.body.title !== undefined) video.title = req.body.title;
            if (req.body.description !== undefined) video.description = req.body.description;
            if (req.body.tags !== undefined) video.tags = req.body.tags;

            await video.save();

            res.json({
                success: true,
                message: 'Video updated successfully',
                data: { video }
            });
        } catch (error) {
            console.error('Update video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update video'
            });
        }
    };

    // Delete video
    deleteVideo = async (req, res) => {
        try {
            const video = await Video.findById(req.params.id);

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Check if video is used in any section
            const sectionsUsingVideo = await Section.find({ 'videos.video': video._id });
            if (sectionsUsingVideo.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete video. It is being used in one or more sections.',
                    data: {
                        usedInSections: sectionsUsingVideo.map(s => ({
                            id: s._id,
                            title: s.title
                        }))
                    }
                });
            }

            // Delete files
            const filesToDelete = [
                video.path,
                video.thumbnail,
                video.optimizedUrl ? `uploads/videos/optimized/${path.basename(video.optimizedUrl)}` : null
            ].filter(Boolean);

            filesToDelete.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            await video.deleteOne();

            res.json({
                success: true,
                message: 'Video deleted successfully'
            });
        } catch (error) {
            console.error('Delete video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete video'
            });
        }
    };

    // Get unused videos
    getUnusedVideos = async (req, res) => {
        try {
            const videos = await Video.find({ isUsed: false })
                .sort({ createdAt: -1 })
                .select('_id title thumbnailUrl durationFormatted sizeFormatted createdAt');

            res.json({
                success: true,
                data: { videos }
            });
        } catch (error) {
            console.error('Get unused videos error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch unused videos'
            });
        }
    };
}

module.exports = new VideoController();