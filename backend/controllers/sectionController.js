// backend/controllers/sectionController.js
const Section = require('../models/Section');
const Video = require('../models/Video');

class SectionController {
    // Create section
    createSection = async (req, res) => {
        try {
            const nextOrder = await Section.getNextOrder();

            const section = new Section({
                ...req.body,
                order: req.body.order !== undefined ? req.body.order : nextOrder
            });

            await section.save();

            res.status(201).json({
                success: true,
                message: 'Section created successfully',
                data: { section }
            });
        } catch (error) {
            console.error('Create section error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create section',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    // backend/controllers/sectionController.js - Update getAllSections
    getAllSections = async (req, res) => {
        try {
            const sections = await Section.find()
                .sort({ order: 1 })
                .populate('videos.video', 'title thumbnailUrl durationFormatted url optimizedUrl')
                .lean();

            // Add videoCount to each section
            const sectionsWithCount = sections.map(section => ({
                ...section,
                videoCount: section.videos ? section.videos.length : 0
            }));

            res.json({
                success: true,
                data: { sections: sectionsWithCount }
            });
        } catch (error) {
            console.error('Get sections error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sections'
            });
        }
    };

    // backend/controllers/sectionController.js
    getVisibleSections = async (req, res) => {
        try {
            // Add try-catch inside for MongoDB operations
            const sections = await Section.find({ visible: true })
                .sort({ order: 1 })
                .populate({
                    path: 'videos.video',
                    select: 'title thumbnailUrl durationFormatted url optimizedUrl',
                    // Add error handling for missing videos
                    options: {
                        allowNull: true,
                        onError: (err) => {
                            console.log('Error populating video:', err);
                            return null;
                        }
                    }
                })
                .select('-__v -createdAt -updatedAt')
                .lean();

            // Safe transformation
            const transformedSections = sections.map(section => {
                // Filter out null/undefined videos
                const validVideos = (section.videos || [])
                    .filter(v => v && v.video) // Only keep videos that exist
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(video => ({
                        id: video.video?._id?.toString() || '',
                        title: video.title || video.video?.title || 'Untitled',
                        description: video.description || '',
                        url: video.video?.optimizedUrl || video.video?.url || '',
                        thumbnailUrl: video.video?.thumbnailUrl || '',
                        duration: video.video?.durationFormatted || '',
                        settings: video.settings || {}
                    }))
                    .filter(v => v.url); // Only keep videos with URLs

                return {
                    id: section._id.toString(),
                    title: section.title || '',
                    description: section.description || '',
                    layoutType: section.layoutType || 'grid',
                    gridConfig: section.gridConfig || {},
                    sliderConfig: section.sliderConfig || {},
                    backgroundColor: section.backgroundColor || '',
                    textColor: section.textColor || '',
                    padding: section.padding || {},
                    maxWidth: section.maxWidth || '',
                    videos: validVideos
                };
            });

            // Filter out sections with no videos
            const sectionsWithVideos = transformedSections.filter(section =>
                section.videos.length > 0
            );

            res.json({
                success: true,
                data: {
                    sections: sectionsWithVideos,
                    count: sectionsWithVideos.length
                }
            });
        } catch (error) {
            console.error('Get visible sections error:', error);
            // Return empty array instead of 500 error
            res.json({
                success: true,
                data: {
                    sections: [],
                    count: 0
                }
            });
        }
    };

    getSectionById = async (req, res) => {
        try {
            const section = await Section.findById(req.params.id)
                .populate('videos.video', 'title thumbnailUrl durationFormatted url optimizedUrl');

            if (!section) {
                return res.status(404).json({
                    success: false,
                    message: 'Section not found'
                });
            }

            // Convert to object and add videoCount
            const sectionData = section.toObject();
            sectionData.videoCount = section.videos ? section.videos.length : 0;

            res.json({
                success: true,
                data: { section: sectionData }
            });
        } catch (error) {
            console.error('Get section error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch section'
            });
        }
    };

    // Update section
    updateSection = async (req, res) => {
        try {
            const section = await Section.findById(req.params.id);

            if (!section) {
                return res.status(404).json({
                    success: false,
                    message: 'Section not found'
                });
            }

            // Update allowed fields
            const allowedUpdates = [
                'title', 'description', 'layoutType', 'visible', 'order',
                'gridConfig', 'sliderConfig', 'backgroundColor', 'textColor',
                'padding', 'maxWidth'
            ];

            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    section[field] = req.body[field];
                }
            });

            await section.save();

            res.json({
                success: true,
                message: 'Section updated successfully',
                data: { section }
            });
        } catch (error) {
            console.error('Update section error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update section'
            });
        }
    };

    // Delete section
    deleteSection = async (req, res) => {
        try {
            const section = await Section.findById(req.params.id);

            if (!section) {
                return res.status(404).json({
                    success: false,
                    message: 'Section not found'
                });
            }

            // Update video usage status
            const videoIds = section.videos.map(v => v.video);
            await Video.updateMany(
                { _id: { $in: videoIds } },
                { $set: { isUsed: false } }
            );

            await section.deleteOne();

            // Reorder remaining sections
            await this.reorderSectionsAfterDelete();

            res.json({
                success: true,
                message: 'Section deleted successfully'
            });
        } catch (error) {
            console.error('Delete section error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete section'
            });
        }
    };

    // Add video to section
    addVideoToSection = async (req, res) => {
        try {
            const section = await Section.findById(req.params.sectionId);
            const video = await Video.findById(req.body.videoId);

            if (!section) {
                return res.status(404).json({
                    success: false,
                    message: 'Section not found'
                });
            }

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Check if video already in section
            const existingVideo = section.videos.find(v => v.video.toString() === req.body.videoId);
            if (existingVideo) {
                return res.status(400).json({
                    success: false,
                    message: 'Video already exists in this section'
                });
            }

            // Get next order value
            const nextOrder = section.videos.length > 0
                ? Math.max(...section.videos.map(v => v.order)) + 1
                : 0;

            // Add video to section
            section.videos.push({
                video: video._id,
                title: req.body.title || video.title,
                description: req.body.description || '',
                order: nextOrder,
                settings: {
                    autoplay: req.body.autoplay || false,
                    loop: req.body.loop || false,
                    muted: req.body.muted !== undefined ? req.body.muted : true,
                    controls: req.body.controls !== undefined ? req.body.controls : true,
                    playsInline: req.body.playsInline !== undefined ? req.body.playsInline : true
                }
            });

            // Update video usage status
            video.isUsed = true;
            await video.save();

            await section.save();

            const populatedSection = await Section.findById(section._id)
                .populate('videos.video', 'title thumbnailUrl durationFormatted url optimizedUrl');

            res.json({
                success: true,
                message: 'Video added to section successfully',
                data: { section: populatedSection }
            });
        } catch (error) {
            console.error('Add video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add video to section'
            });
        }
    };

    removeVideoFromSection = async (req, res) => {
        try {
            // Use sectionId and videoId from params to match route
            const { sectionId, videoId } = req.params;

            const section = await Section.findById(sectionId);

            if (!section) {
                return res.status(404).json({
                    success: false,
                    message: 'Section not found'
                });
            }

            // Find the video index in the section
            const videoIndex = section.videos.findIndex(
                v => v._id.toString() === videoId
            );

            if (videoIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found in section'
                });
            }

            // Get the actual video ID (the reference to Video model)
            const actualVideoId = section.videos[videoIndex].video;

            // Remove video from section
            section.videos.splice(videoIndex, 1);

            // Reorder remaining videos
            section.videos.forEach((video, index) => {
                video.order = index;
            });

            // Update video usage status if not used elsewhere
            if (actualVideoId) {
                const otherSectionsUsingVideo = await Section.find({
                    'videos.video': actualVideoId,
                    _id: { $ne: section._id }
                });

                if (otherSectionsUsingVideo.length === 0) {
                    await Video.findByIdAndUpdate(actualVideoId, { isUsed: false });
                }
            }

            await section.save();

            res.json({
                success: true,
                message: 'Video removed from section successfully',
                data: { section }
            });
        } catch (error) {
            console.error('Remove video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove video from section',
                error: error.message
            });
        }
    };

    // Reorder videos within section - FIXED
    reorderVideosInSection = async (req, res) => {
        try {
            const { sectionId } = req.params; // Use sectionId from params
            const { videos } = req.body; // Expecting array in req.body.videos

            const section = await Section.findById(sectionId); // Use sectionId

            if (!section) {
                return res.status(404).json({
                    success: false,
                    message: 'Section not found'
                });
            }

            // Validate new order
            if (!Array.isArray(videos)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order data - videos must be an array'
                });
            }

            // Create a map of video orders
            const orderMap = {};
            videos.forEach((item, index) => {
                if (item.videoId) {
                    orderMap[item.videoId] = index;
                }
            });

            // Update video orders
            section.videos.forEach(video => {
                const newOrderIndex = orderMap[video._id.toString()];
                if (newOrderIndex !== undefined) {
                    video.order = newOrderIndex;
                }
            });

            // Sort videos by order
            section.videos.sort((a, b) => a.order - b.order);

            await section.save();

            // Populate video details if needed
            const populatedSection = await Section.findById(section._id)
                .populate('videos.video', 'title thumbnailUrl durationFormatted url optimizedUrl settings');

            res.json({
                success: true,
                message: 'Videos reordered successfully',
                data: { section: populatedSection }
            });
        } catch (error) {
            console.error('Reorder videos error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reorder videos',
                error: error.message
            });
        }
    };

    reorderSections = async (req, res) => {
        try {
            const { sections } = req.body; // Expecting array in req.body.sections

            if (!Array.isArray(sections)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order data - sections must be an array'
                });
            }

            // Update each section's order
            const updatePromises = sections.map((item, index) =>
                Section.findByIdAndUpdate(
                    item.id,
                    { order: index },
                    { new: true }
                )
            );

            await Promise.all(updatePromises);

            // Get all sections sorted by order
            const updatedSections = await Section.find()
                .sort({ order: 1 })
                .populate('videos.video', 'title thumbnailUrl durationFormatted url optimizedUrl settings');

            res.json({
                success: true,
                message: 'Sections reordered successfully',
                data: { sections: updatedSections }
            });
        } catch (error) {
            console.error('Reorder sections error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reorder sections',
                error: error.message
            });
        }
    };

    // Reorder sections after delete (internal method)
    reorderSectionsAfterDelete = async () => {
        const sections = await Section.find().sort({ order: 1 });

        for (let i = 0; i < sections.length; i++) {
            sections[i].order = i;
            await sections[i].save();
        }
    };

    updateVideoInSection = async (req, res) => {
        try {
            const { sectionId, videoId } = req.params;

            const section = await Section.findById(sectionId);

            if (!section) {
                return res.status(404).json({
                    success: false,
                    message: 'Section not found'
                });
            }

            const video = section.videos.id(videoId);

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found in section'
                });
            }

            // Update video details
            if (req.body.title !== undefined) video.title = req.body.title;
            if (req.body.description !== undefined) video.description = req.body.description;
            if (req.body.order !== undefined) video.order = req.body.order;

            // Update settings
            if (req.body.settings) {
                video.settings = {
                    ...video.settings,
                    ...req.body.settings
                };
            }

            await section.save();

            // You don't need populate since videos are embedded documents
            // Just return the updated section
            res.json({
                success: true,
                message: 'Video updated successfully',
                data: { section }
            });
        } catch (error) {
            console.error('Update video in section error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update video in section',
                error: error.message
            });
        }
    };
}

module.exports = new SectionController();