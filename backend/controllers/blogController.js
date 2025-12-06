const Blog = require('../models/blogModel');

// Helper function to clean HTML from ```html markers
const cleanHtml = (html) => {
    if (!html) return '';
    return html
        .replace(/^```html\s*/i, '')
        .replace(/```$/g, '')
        .trim();
};

// ==================== PUBLIC ROUTES ====================

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
exports.getPublishedBlogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            tag,
            featured,
            sort = '-published_at',
            search
        } = req.query;

        // Build query - IMPORTANT: Use 'Published' with capital P
        let query = { Status: 'Published' };

        // Filter by category - note: your data has Category (capital C) which is null
        if (category) {
            query.Category = category;
        }

        // Filter by tag - note: your data has Tags (capital T) array
        if (tag) {
            query.Tags = { $in: [tag] }; // Use $in for array field
        }

        // Filter featured posts - now you have featured field in your schema
        if (featured === 'true') {
            query.featured = true; // This should work since you added featured field
        }

        // Search functionality - use correct field names
        if (search) {
            query.$or = [
                { Title: { $regex: search, $options: 'i' } }, // Capital T
                { 'Meta-tags': { $regex: search, $options: 'i' } }, // With hyphen
                { Tags: { $regex: search, $options: 'i' } } // Capital T
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const blogs = await Blog.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-Html -workflow'); // Exclude full HTML and workflow from list view

        const total = await Blog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: blogs.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: blogs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single published blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
// @desc    Get single published blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            Slug: req.params.slug,
            Status: 'Published'
        });

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Clean HTML before sending
        const cleanedBlog = blog.toObject();
        if (cleanedBlog.Html) {
            cleanedBlog.Html = cleanHtml(cleanedBlog.Html);
        }

        // Get related blogs - exclude current blog
        const relatedQuery = {
            _id: { $ne: blog._id },
            Status: 'Published'
        };

        // Add category filter if exists
        if (blog.Category) {
            relatedQuery.Category = blog.Category;
        }

        const relatedBlogs = await Blog.find(relatedQuery)
            .limit(3)
            .select('Title Slug Meta-tags image_url published_at');

        // Calculate reading time if not already calculated
        if (!cleanedBlog.reading_time) {
            const cleanHtml = cleanedBlog.Html.replace(/^```html\s*/i, '').replace(/```$/g, '');
            const wordCount = cleanHtml.split(/\s+/).length;
            cleanedBlog.reading_time = Math.ceil(wordCount / 200);
        }

        res.status(200).json({
            success: true,
            data: {
                ...cleanedBlog,
                related_blogs: relatedBlogs
            }
        });

    } catch (error) {
        console.error('Error in getBlogBySlug:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Blog.aggregate([
            { $match: { Status: 'Published' } }, // Capital P
            { $unwind: '$Category' },
            { $group: { _id: '$Category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: categories.filter(cat => cat._id !== null)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get blog tags
// @route   GET /api/blogs/tags
// @access  Public
exports.getTags = async (req, res) => {
    try {
        const tags = await Blog.aggregate([
            { $match: { Status: 'published' } },
            { $unwind: '$Tags' },
            { $group: { _id: '$Tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 }
        ]);

        res.status(200).json({
            success: true,
            data: tags.filter(tag => tag._id !== null) // Filter out null tags
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get featured blogs
// @route   GET /api/blogs/featured
// @access  Public
exports.getFeaturedBlogs = async (req, res) => {
    try {
        // Since you don't have featured field, get recent published blogs instead
        const blogs = await Blog.find({ Status: 'published' })
            .sort('-createdAt')
            .limit(5)
            .select('Title Slug Meta-tags');

        res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get recent blogs
// @route   GET /api/blogs/recent
// @access  Public
exports.getRecentBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ Status: 'published' })
            .sort('-createdAt')
            .limit(5)
            .select('Title Slug Meta-tags Category');

        res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// ==================== ADMIN ROUTES ====================

// @desc    Get all blogs (admin with filters)
// @route   GET /api/admin/blogs
// @access  Private/Admin
exports.getAdminBlogs = async (req, res) => {
    try {
        const {
            status,
            category,
            tag,
            search,
            page = 1,
            limit = 20,
            sort = '-createdAt'
        } = req.query;

        // Build query
        let query = {};

        // Filter by status - use capital S
        if (status) {
            query.Status = status;
        }

        // Filter by category - use capital C
        if (category) {
            query.Category = category;
        }

        // Filter by tag - use capital T
        if (tag) {
            query.Tags = tag;
        }

        // Search - use correct field names
        if (search) {
            query.$or = [
                { Title: { $regex: search, $options: 'i' } },
                { 'Meta-tags': { $regex: search, $options: 'i' } },
                { Slug: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const blogs = await Blog.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-Html'); // Exclude full HTML in list view

        const total = await Blog.countDocuments(query);

        // Get counts by status - use capital S
        const statusCounts = await Blog.aggregate([
            { $group: { _id: '$Status', count: { $sum: 1 } } }
        ]);

        // Clean HTML for each blog
        const cleanedBlogs = blogs.map(blog => {
            const blogObj = blog.toObject();
            if (blogObj.Html) {
                blogObj.Html = cleanHtml(blogObj.Html);
            }
            return blogObj;
        });

        res.status(200).json({
            success: true,
            count: blogs.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            statusCounts,
            data: cleanedBlogs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single blog by ID (admin)
// @route   GET /api/admin/blogs/:id
// @access  Private/Admin
exports.getAdminBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Clean HTML before sending
        const cleanedBlog = blog.toObject();
        if (cleanedBlog.Html) {
            cleanedBlog.Html = cleanHtml(cleanedBlog.Html);
        }

        res.status(200).json({
            success: true,
            data: cleanedBlog
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Create blog (for n8n automation or manual)
// @route   POST /api/admin/blogs
// @access  Private/Admin
exports.createBlog = async (req, res) => {
    try {
        // Clean HTML if present
        if (req.body.Html) {
            req.body.Html = cleanHtml(req.body.Html);
        }

        // Set auto-generated data
        req.body.createdAt = new Date();
        req.body.updatedAt = new Date();


        // Ensure status is properly capitalized if provided
        if (req.body.Status) {
            req.body.Status = req.body.Status.charAt(0).toUpperCase() + req.body.Status.slice(1).toLowerCase();
        } else {
            req.body.Status = 'Draft'; // Default
        }

        const blog = await Blog.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            data: blog
        });

    } catch (error) {
        // Handle duplicate slug error
        if (error.code === 11000) {
            // Generate unique slug
            if (req.body.Title) {
                const slugify = require('slugify');
                const slug = slugify(req.body.Title, { lower: true, strict: true });
                req.body.Slug = `${slug}-${Date.now()}`;

                // Retry with new slug
                const blog = await Blog.create(req.body);
                return res.status(201).json({
                    success: true,
                    message: 'Blog created with unique slug',
                    data: blog
                });
            }
        }

        res.status(400).json({
            success: false,
            message: 'Failed to create blog',
            error: error.message
        });
    }
};

// @desc    Update blog
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;


        if (req.body.slug || req.body.Slug || req.body.title) {
            const raw = req.body.slug || req.body.Slug || req.body.title;
            req.body.slug = raw
                .toString()
                .replace(/\n/g, '')          // remove newline
                .replace(/\r/g, '')          // remove carriage return
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]/g, '');
        }


        // Clean HTML if present
        if (req.body.Html) {
            req.body.Html = cleanHtml(req.body.Html);
        }

        // Update timestamp
        req.body.updatedAt = new Date();

        // Ensure status is properly capitalized if provided
        if (req.body.Status) {
            req.body.Status = req.body.Status.charAt(0).toUpperCase() + req.body.Status.slice(1).toLowerCase();
        }

        const blog = await Blog.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Clean HTML before sending response
        const cleanedBlog = blog.toObject();
        if (cleanedBlog.Html) {
            cleanedBlog.Html = cleanHtml(cleanedBlog.Html);
        }

        res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            data: cleanedBlog
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update blog',
            error: error.message
        });
    }
};

// @desc    Update blog status
// @route   PATCH /api/admin/blogs/:id/status
// @access  Private/Admin
exports.updateBlogStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let { status } = req.body;

        // Validate and capitalize status
        const validStatuses = ['Draft', 'Review', 'Published', 'Archived'];
        status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const updateData = { Status: status, updatedAt: new Date() };

        // Set published_at when publishing
        if (status === 'Published') {
            updateData.published_at = new Date();
        }

        const blog = await Blog.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Blog status updated to ${status}`,
            data: blog
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

// @desc    Toggle featured status
// @route   PATCH /api/admin/blogs/:id/featured
// @access  Private/Admin
exports.toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        const blog = await Blog.findByIdAndUpdate(
            id,
            { featured, updatedAt: new Date() },
            { new: true }
        );

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Blog featured status updated to ${featured}`,
            data: blog
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update featured status',
            error: error.message
        });
    }
};

// @desc    Update blog image
// @route   PATCH /api/admin/blogs/:id/image
// @access  Private/Admin
exports.updateBlogImage = async (req, res) => {
    try {
        const { id } = req.params;

        // Get uploaded file path
        const image_url = req.file ? `/uploads/blogs/${req.file.filename}` : req.body.image_url;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        const blog = await Blog.findByIdAndUpdate(
            id,
            { image_url, updatedAt: new Date() },
            { new: true }
        );

        if (!blog) {
            // Optionally delete the uploaded file if blog not found
            if (req.file) {
                fs.unlinkSync(path.join(__dirname, '../public', image_url));
            }
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Blog image updated',
            data: blog
        });

    } catch (error) {
        // Delete uploaded file on error
        if (req.file) {
            fs.unlinkSync(path.join(__dirname, '../public', `/uploads/blogs/${req.file.filename}`));
        }
        res.status(400).json({
            success: false,
            message: 'Failed to update image',
            error: error.message
        });
    }
};

// In your blog controller
exports.uploadBlogImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        const image_url = `/uploads/blogs/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                image_url: image_url,
                filename: req.file.filename,
                path: req.file.path
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// @desc    Delete blog
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Archive instead of hard delete
        blog.Status = 'Archived';
        blog.updatedAt = new Date();
        await blog.save();

        res.status(200).json({
            success: true,
            message: 'Blog archived successfully',
            data: {}
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete blog',
            error: error.message
        });
    }
};

// @desc    Get blog statistics
// @route   GET /api/admin/blogs/statistics
// @access  Private/Admin
exports.getBlogStatistics = async (req, res) => {
    try {
        const totalBlogs = await Blog.countDocuments();
        const publishedBlogs = await Blog.countDocuments({ Status: 'published' });
        const draftBlogs = await Blog.countDocuments({ Status: 'draft' });
        const archivedBlogs = await Blog.countDocuments({ Status: 'archived' });

        // Recent blog activity
        const recentActivity = await Blog.find()
            .sort('-updatedAt')
            .limit(5)
            .select('Title Status updatedAt');

        // Blogs by category - use capital C
        const blogsByCategory = await Blog.aggregate([
            { $match: { Category: { $ne: null } } }, // Filter out null categories
            { $unwind: '$Category' },
            { $group: { _id: '$Category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total: totalBlogs,
                published: publishedBlogs,
                drafts: draftBlogs,
                archived: archivedBlogs,
                featured: 0, // You don't have featured field
                recentActivity,
                byCategory: blogsByCategory
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

// @desc    Bulk update blogs
// @route   POST /api/admin/blogs/bulk
// @access  Private/Admin
exports.bulkUpdateBlogs = async (req, res) => {
    try {
        const { ids, action, data } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Blog IDs are required'
            });
        }

        let updateData = {};
        let message = '';

        switch (action) {
            case 'publish':
                updateData = {
                    Status: 'Published',
                    published_at: new Date(),
                    updatedAt: new Date()
                };
                message = 'Blogs published successfully';
                break;
            case 'archive':
                updateData = {
                    Status: 'Archived',
                    updatedAt: new Date()
                };
                message = 'Blogs archived successfully';
                break;
            case 'draft':
                updateData = {
                    Status: 'Draft',
                    updatedAt: new Date()
                };
                message = 'Blogs moved to draft successfully';
                break;
            default:
                updateData = { ...data, updatedAt: new Date() };
                message = 'Blogs updated successfully';
        }

        const result = await Blog.updateMany(
            { _id: { $in: ids } },
            updateData
        );

        res.status(200).json({
            success: true,
            message,
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to perform bulk update',
            error: error.message
        });
    }
};