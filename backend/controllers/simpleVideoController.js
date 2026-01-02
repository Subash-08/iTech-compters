// backend/controllers/simpleVideoController.js
const Video = require('../models/Video');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const sharp = require('sharp');

// Set ffmpeg path from ffmpeg-static
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

class SimpleVideoController {
    // Helper function to generate thumbnail using FFmpeg
    generateThumbnail = (videoPath, videoId) => {
        return new Promise((resolve, reject) => {
            const thumbnailName = `thumb_${videoId}_${Date.now()}.jpg`;
            const thumbnailPath = path.join(__dirname, '../public/uploads/thumbnails', thumbnailName);
            const thumbnailUrl = `/public/uploads/thumbnails/${thumbnailName}`;

            // Ensure thumbnails directory exists
            const thumbDir = path.join(__dirname, '../public/uploads/thumbnails');
            if (!fs.existsSync(thumbDir)) {
                fs.mkdirSync(thumbDir, { recursive: true });
            }

            ffmpeg(videoPath)
                .on('end', () => {
                    resolve({
                        thumbnail: thumbnailPath,
                        thumbnailUrl: thumbnailUrl
                    });
                })
                .on('error', (err) => {
                    console.error('Thumbnail generation error:', err);
                    reject(err);
                })
                .screenshots({
                    count: 1,
                    timemarks: ['50%'],
                    filename: thumbnailName,
                    folder: thumbDir,
                    size: '320x240'
                });
        });
    }

    processThumbnail = async (thumbnailFile) => {
        try {
            if (!thumbnailFile) return null;

            const thumbDir = path.join(__dirname, '../public/uploads/thumbnails');
            if (!fs.existsSync(thumbDir)) {
                fs.mkdirSync(thumbDir, { recursive: true });
            }

            const thumbFileName = `thumb-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
            const thumbFullPath = path.join(thumbDir, thumbFileName);

            await sharp(thumbnailFile.path)
                .resize(320, 240, { fit: 'cover', position: 'center' })
                .jpeg({ quality: 80 })
                .toFile(thumbFullPath);

            // OPTIONAL cleanup (safe)
            try {
                fs.unlinkSync(thumbnailFile.path);
            } catch { }

            return {
                url: `/uploads/thumbnails/${thumbFileName}`
            };

        } catch (err) {
            console.error('Thumbnail processing error:', err);
            return null;
        }
    };


    // Helper for auto-generating thumbnail (fallback)
    generateAutoThumbnail = async (videoPath, videoId) => {
        try {
            // Use existing generateThumbnail method
            return await this.generateThumbnail(videoPath, videoId);
        } catch (error) {
            console.error('Auto-thumbnail generation error:', error);
            return null;
        }
    };

    // UPLOAD VIDEO WITH THUMBNAIL METHOD
    uploadVideoWithThumbnail = async (req, res) => {
        try {
            if (!req.files || !req.files.video) {
                return res.status(400).json({
                    success: false,
                    message: 'No video file provided'
                });
            }

            const videoFile = req.files.video[0];
            const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

            // Parse tags
            let tags = [];
            if (req.body.tags) {
                try {
                    tags = JSON.parse(req.body.tags);
                    if (!Array.isArray(tags)) tags = [];
                } catch (error) {
                    tags = [];
                }
            }

            let thumbnailUrl = '';
            let hasCustomThumbnail = false;

            if (thumbnailFile) {
                const thumb = await this.processThumbnail(thumbnailFile);

                if (thumb?.url) {
                    thumbnailUrl = thumb.url;
                    hasCustomThumbnail = true;
                }
            }



            const videoData = {
                filename: videoFile.filename,
                originalName: videoFile.originalname,
                title: req.body.title || path.parse(videoFile.originalname).name,
                description: req.body.description || '',
                path: videoFile.path,
                url: `/uploads/videos/original/${videoFile.filename}`,

                thumbnail: thumbnailUrl,
                thumbnailUrl: thumbnailUrl,
                hasCustomThumbnail,

                optimizedUrl: `/uploads/videos/original/${videoFile.filename}`,
                size: videoFile.size,
                format: path.extname(videoFile.originalname).slice(1),
                tags,
                isUsed: false
            };



            const video = new Video(videoData);
            await video.save();

            // If no custom thumbnail, try auto-generating one
            if (!hasCustomThumbnail) {
                try {
                    const autoThumbnail = await this.generateAutoThumbnail(videoFile.path, video._id);
                    if (autoThumbnail) {
                        video.thumbnail = autoThumbnail.thumbnail;
                        video.thumbnailUrl = autoThumbnail.thumbnailUrl;
                        video.hasCustomThumbnail = false;
                        await video.save();
                    }
                } catch (autoError) {
                }
            }

            res.status(201).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    video: {
                        _id: video._id,
                        title: video.title,
                        url: video.url,
                        thumbnailUrl: video.thumbnailUrl,
                        hasCustomThumbnail: video.hasCustomThumbnail,
                        size: video.size,
                        sizeFormatted: video.sizeFormatted,
                        format: video.format,
                        createdAt: video.createdAt
                    }
                }
            });

        } catch (error) {
            console.error('Upload error:', error);

            // Cleanup files on error
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    fileArray.forEach(file => {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    });
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to upload video',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    // UPLOAD MULTIPLE VIDEOS WITH THUMBNAILS (PRODUCTION-SAFE)
    uploadMultipleVideosWithThumbnails = async (req, res) => {
        try {
            if (!req.files?.videos?.length) {
                return res.status(400).json({
                    success: false,
                    message: 'No video files provided'
                });
            }

            const videoFiles = req.files.videos;
            const thumbnailFiles = req.files.thumbnails || [];

            // -------- Parse optional arrays safely --------
            let titles = [];
            let descriptions = [];
            let tagsArray = [];

            try {
                if (req.body.titles) titles = JSON.parse(req.body.titles);
                if (req.body.descriptions) descriptions = JSON.parse(req.body.descriptions);
                if (req.body.tags) tagsArray = JSON.parse(req.body.tags);
            } catch {
                // ignore malformed JSON
            }

            const videos = [];

            for (let i = 0; i < videoFiles.length; i++) {
                const videoFile = videoFiles[i];
                const thumbnailFile = thumbnailFiles[i] || null;

                const title =
                    Array.isArray(titles) && titles[i]
                        ? titles[i]
                        : path.parse(videoFile.originalname).name;

                const description =
                    Array.isArray(descriptions) && descriptions[i]
                        ? descriptions[i]
                        : '';

                const tags =
                    Array.isArray(tagsArray) && Array.isArray(tagsArray[i])
                        ? tagsArray[i]
                        : [];

                // -------- Handle thumbnail correctly --------
                let thumbnailUrl = '';
                let hasCustomThumbnail = false;

                if (thumbnailFile) {
                    const processed = await this.processThumbnail(thumbnailFile);

                    if (processed?.url) {
                        thumbnailUrl = processed.url;
                        hasCustomThumbnail = true;
                    }
                }

                // -------- Create DB record --------
                const video = await Video.create({
                    filename: videoFile.filename,
                    originalName: videoFile.originalname,
                    title,
                    description,

                    path: videoFile.path,
                    url: `/uploads/videos/original/${videoFile.filename}`,

                    thumbnail: thumbnailUrl,
                    thumbnailUrl,

                    hasCustomThumbnail,

                    optimizedUrl: `/uploads/videos/original/${videoFile.filename}`,
                    duration: 0,
                    size: videoFile.size,
                    sizeFormatted: this.formatFileSize(videoFile.size),
                    format: path.extname(videoFile.originalname).slice(1).toLowerCase(),
                    resolution: { width: 0, height: 0 },
                    bitrate: 0,
                    optimized: false,
                    tags,
                    isUsed: false
                });

                // -------- Auto-generate thumbnail if missing --------
                if (!hasCustomThumbnail) {
                    try {
                        const autoThumb = await this.generateAutoThumbnail(
                            videoFile.path,
                            video._id
                        );

                        if (autoThumb?.thumbnailUrl) {
                            video.thumbnail = autoThumb.thumbnail;
                            video.thumbnailUrl = autoThumb.thumbnailUrl;
                            video.hasCustomThumbnail = false;
                            await video.save();
                        }
                    } catch (err) {
                        console.error('Auto thumbnail failed:', err.message);
                    }
                }

                videos.push(video);
            }

            res.status(201).json({
                success: true,
                message: `${videos.length} videos uploaded successfully`,
                data: {
                    videos: videos.map(v => ({
                        _id: v._id,
                        title: v.title,
                        url: v.url,
                        thumbnailUrl: v.thumbnailUrl,
                        hasCustomThumbnail: v.hasCustomThumbnail,
                        size: v.size,
                        format: v.format,
                        createdAt: v.createdAt
                    }))
                }
            });

        } catch (error) {
            console.error('Multiple upload error:', error);

            // -------- Cleanup on failure --------
            if (req.files) {
                Object.values(req.files).flat().forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to upload videos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };



    // UPDATE THUMBNAIL FOR EXISTING VIDEO
    updateThumbnail = async (req, res) => {
        try {
            const video = await Video.findById(req.params.id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No thumbnail file provided'
                });
            }

            // Delete old thumbnail if exists
            if (video.thumbnail && fs.existsSync(video.thumbnail)) {
                try {
                    fs.unlinkSync(video.thumbnail);
                } catch (unlinkError) {
                    console.warn('Could not delete old thumbnail:', unlinkError.message);
                }
            }

            // Process new thumbnail
            const thumbnailData = await this.processThumbnail(req.file);

            if (!thumbnailData) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process thumbnail'
                });
            }

            // Update video
            video.thumbnail = thumbnailData.path;
            video.thumbnailUrl = thumbnailData.url;
            video.hasCustomThumbnail = true;
            await video.save();

            res.json({
                success: true,
                message: 'Thumbnail updated successfully',
                data: {
                    thumbnailUrl: video.thumbnailUrl,
                    hasCustomThumbnail: video.hasCustomThumbnail
                }
            });

        } catch (error) {
            console.error('Update thumbnail error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update thumbnail',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    // REGENERATE THUMBNAIL
    regenerateThumbnail = async (req, res) => {
        try {
            const video = await Video.findById(req.params.id);

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Delete old thumbnail if exists
            if (video.thumbnail && fs.existsSync(video.thumbnail)) {
                try {
                    fs.unlinkSync(video.thumbnail);
                } catch (unlinkError) {
                    console.warn('Could not delete old thumbnail:', unlinkError.message);
                }
            }

            // Generate new thumbnail
            const thumbnail = await this.generateThumbnail(video.path, video._id);

            // Update video
            video.thumbnail = thumbnail.thumbnail;
            video.thumbnailUrl = thumbnail.thumbnailUrl;
            video.hasCustomThumbnail = false;
            await video.save();

            res.json({
                success: true,
                message: 'Thumbnail regenerated successfully',
                data: {
                    thumbnailUrl: video.thumbnailUrl
                }
            });
        } catch (error) {
            console.error('Regenerate thumbnail error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to regenerate thumbnail'
            });
        }
    };

    // ORIGINAL UPLOAD VIDEO METHOD (for backward compatibility)
    uploadVideo = async (req, res) => {

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No video file provided'
                });
            }

            // Parse tags
            let tags = [];
            if (req.body.tags) {
                try {
                    tags = JSON.parse(req.body.tags);
                    if (!Array.isArray(tags)) tags = [];
                } catch (error) {
                    tags = [];
                }
            }

            // Create video record first
            const video = new Video({
                filename: req.file.filename,
                originalName: req.file.originalname,
                title: req.body.title || path.parse(req.file.originalname).name,
                description: req.body.description || '',
                path: req.file.path,
                url: `/uploads/videos/${req.file.filename}`,
                thumbnail: '',
                thumbnailUrl: '',
                optimizedUrl: `/uploads/videos/${req.file.filename}`,
                duration: 0,
                size: req.file.size,
                sizeFormatted: this.formatFileSize(req.file.size),
                format: path.extname(req.file.originalname).replace('.', ''),
                resolution: { width: 0, height: 0 },
                bitrate: 0,
                optimized: false,
                tags: tags,
                isUsed: false,
                hasCustomThumbnail: false
            });

            await video.save();
            try {
                const thumbnail = await this.generateThumbnail(req.file.path, video._id);

                // Update video with thumbnail info
                video.thumbnail = thumbnail.thumbnail;
                video.thumbnailUrl = thumbnail.thumbnailUrl;
                video.hasCustomThumbnail = false;
                await video.save();
            } catch (thumbError) {
                console.error('Failed to generate thumbnail:', thumbError);
                // Continue even if thumbnail fails
            }

            res.status(201).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    video: {
                        _id: video._id,
                        title: video.title,
                        url: video.url,
                        thumbnailUrl: video.thumbnailUrl || '',
                        hasCustomThumbnail: video.hasCustomThumbnail,
                        size: video.size,
                        sizeFormatted: video.sizeFormatted,
                        format: video.format,
                        createdAt: video.createdAt,
                        isUsed: video.isUsed
                    }
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error stack:', error.stack);

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
    };

    // ORIGINAL UPLOAD MULTIPLE VIDEOS METHOD (for backward compatibility)
    uploadMultipleVideos = async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No video files provided'
                });
            }

            const videos = [];
            for (const file of req.files) {
                // Parse tags
                let tags = [];
                if (req.body.tags) {
                    try {
                        const allTags = JSON.parse(req.body.tags);
                        tags = Array.isArray(allTags) ? allTags : [];
                    } catch {
                        tags = [];
                    }
                }

                // Create video
                const video = new Video({
                    filename: file.filename,
                    originalName: file.originalname,
                    title: path.parse(file.originalname).name,
                    description: '',
                    path: file.path,
                    url: `/uploads/videos/${file.filename}`,
                    thumbnail: '',
                    thumbnailUrl: '',
                    optimizedUrl: `/uploads/videos/${file.filename}`,
                    duration: 0,
                    size: file.size,
                    sizeFormatted: this.formatFileSize(file.size),
                    format: path.extname(file.originalname).replace('.', ''),
                    resolution: { width: 0, height: 0 },
                    bitrate: 0,
                    optimized: false,
                    tags: tags,
                    isUsed: false,
                    hasCustomThumbnail: false
                });

                await video.save();

                // Generate thumbnail
                try {
                    const thumbnail = await this.generateThumbnail(file.path, video._id);
                    video.thumbnail = thumbnail.thumbnail;
                    video.thumbnailUrl = thumbnail.thumbnailUrl;
                    await video.save();
                } catch (thumbError) {
                    console.error('Failed to generate thumbnail for', video._id, thumbError);
                }

                videos.push(video);
            }

            res.status(201).json({
                success: true,
                message: `${videos.length} videos uploaded successfully`,
                data: {
                    videos: videos.map(v => ({
                        _id: v._id,
                        title: v.title,
                        url: v.url,
                        thumbnailUrl: v.thumbnailUrl || '',
                        hasCustomThumbnail: v.hasCustomThumbnail,
                        size: v.size,
                        format: v.format,
                        createdAt: v.createdAt
                    }))
                }
            });
        } catch (error) {
            console.error('Multiple upload error:', error);

            // Cleanup all files
            if (req.files) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to upload videos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    // Helper to format file size
    formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Keep existing methods (getAllVideos, getVideoById, etc.)
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

            res.json({
                success: true,
                data: {
                    videos,
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
    };

    // Get single video
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

            res.json({
                success: true,
                data: { video }
            });
        } catch (error) {
            console.error('Get video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch video'
            });
        }
    };

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

            // Handle tags
            if (req.body.tags !== undefined) {
                try {
                    const tags = JSON.parse(req.body.tags);
                    if (Array.isArray(tags)) {
                        video.tags = tags;
                    }
                } catch {
                    // If not JSON, ignore
                }
            }

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

            // Delete file
            if (fs.existsSync(video.path)) {
                fs.unlinkSync(video.path);
            }

            // Delete thumbnail if exists
            if (video.thumbnail && fs.existsSync(video.thumbnail)) {
                fs.unlinkSync(video.thumbnail);
            }

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
}

// Export the controller instance
module.exports = new SimpleVideoController();