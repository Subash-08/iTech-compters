const express = require('express');
const router = express.Router();
const {
    // Public routes
    getPublishedBlogs,
    getBlogBySlug,
    getCategories,
    getTags,
    getFeaturedBlogs,
    getRecentBlogs,

    // Admin routes
    getAdminBlogs,
    getAdminBlogById,
    createBlog,
    updateBlog,
    updateBlogStatus,
    toggleFeatured,
    updateBlogImage,
    deleteBlog,
    getBlogStatistics,
    bulkUpdateBlogs,
    uploadBlogImage
} = require('../controllers/blogController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { blogUpload, handleMulterError } = require('../config/multerConfig');

// ==================== PUBLIC ROUTES ====================
router.get('/blogs', getPublishedBlogs);
router.get('/blogs/featured', getFeaturedBlogs);
router.get('/blogs/recent', getRecentBlogs);
router.get('/blogs/categories', getCategories);
router.get('/blogs/tags', getTags);
router.get('/blogs/:slug', getBlogBySlug);

// ==================== ADMIN ROUTES ====================
// Blog listing and management
router.get('/admin/blogs', isAuthenticatedUser, authorizeRoles('admin'), getAdminBlogs);
router.get('/admin/blogs/statistics', isAuthenticatedUser, authorizeRoles('admin'), getBlogStatistics);
router.get('/admin/blogs/:id', isAuthenticatedUser, authorizeRoles('admin'), getAdminBlogById);
router.post('/admin/blogs', isAuthenticatedUser, authorizeRoles('admin'), createBlog);
router.put('/admin/blogs/:id', isAuthenticatedUser, authorizeRoles('admin'), updateBlog);
router.delete('/admin/blogs/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteBlog);

// Blog status and featured management
router.put('/admin/blogs/:id/status', isAuthenticatedUser, authorizeRoles('admin'), updateBlogStatus);
router.put('/admin/blogs/:id/featured', isAuthenticatedUser, authorizeRoles('admin'), toggleFeatured);

// Blog image management
router.put('/blogs/:id/image',
    blogUpload.single('image'),
    handleMulterError,
    updateBlogImage
);
router.post('/admin/blogs/upload-image',
    blogUpload.single('image'),
    handleMulterError,
    uploadBlogImage
);
// Bulk operations
router.post('/admin/blogs/bulk', isAuthenticatedUser, authorizeRoles('admin'), bulkUpdateBlogs);

// ==================== N8N WEBHOOK ROUTE ====================
// This route doesn't require authentication since n8n will call it
// Add API key validation in production
router.post('/webhook/blogs/create', createBlog);

module.exports = router;