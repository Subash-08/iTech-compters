import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService, Blog, BlogFilters } from '../services/blogService';
import { toast } from 'react-toastify';
import { getImageUrl, getPlaceholderImage } from '../../utils/imageUtils';

// Safe icon fallbacks
const SafeIcons = {
  Loader: ({ className }: { className?: string }) => (
    <div className={className}>⏳</div>
  ),
  Plus: ({ className }: { className?: string }) => (
    <div className={className}>+</div>
  ),
  Edit: ({ className }: { className?: string }) => (
    <div className={className}>✏️</div>
  ),
  Eye: ({ className }: { className?: string }) => (
    <div className={className}>👁️</div>
  ),
  Trash: ({ className }: { className?: string }) => (
    <div className={className}>🗑️</div>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <div className={className}>📅</div>
  ),
  Tag: ({ className }: { className?: string }) => (
    <div className={className}>🏷️</div>
  ),
};

const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  const [filters, setFilters] = useState<BlogFilters>({
    page: 1,
    limit: 10,
    status: '',
    search: '',
    sort: '-created_at'
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    loadBlogs();
  }, [filters]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await blogService.getAllBlogs(filters);
      if (response.success) {
        setBlogs(response.data);
        setTotal(response.total);
        setPages(response.pages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load blogs');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await blogService.updateBlogStatus(id, status);
      toast.success(`Blog ${status} successfully`);
      loadBlogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    try {
      await blogService.toggleFeatured(id, !currentFeatured);
      toast.success(`Blog ${currentFeatured ? 'removed from' : 'added to'} featured`);
      loadBlogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update featured status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this blog?')) return;
    
    try {
      await blogService.deleteBlog(id);
      toast.success('Blog archived successfully');
      loadBlogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive blog');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBlogs.length === 0) {
      toast.warning('Please select blogs first');
      return;
    }

    try {
      await blogService.bulkUpdateBlogs(selectedBlogs, action);
      toast.success(`Bulk ${action} completed`);
      setSelectedBlogs([]);
      loadBlogs();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} blogs`);
    }
  };

  const toggleSelectBlog = (id: string) => {
    setSelectedBlogs(prev => 
      prev.includes(id) 
        ? prev.filter(blogId => blogId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBlogs.length === blogs.length) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(blogs.map(blog => blog._id));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string = 'draft') => {
    const statusLower = status.toLowerCase();
    const colors: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      review: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[statusLower] || 'bg-gray-100 text-gray-800';
  };

  const getDisplayStatus = (status: string = 'Draft') => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <SafeIcons.Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading blogs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-600">Manage your blog content and publications</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/blogs/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <SafeIcons.Plus className="w-5 h-5" />
            <span>Create Blog</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="-updated_at">Recently Updated</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search blogs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadBlogs}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBlogs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-700">
            {selectedBlogs.length} blog{selectedBlogs.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkAction('publish')}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Archive Selected
            </button>
            <button
              onClick={() => handleBulkAction('draft')}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
            >
              Move to Draft
            </button>
            <button
              onClick={() => setSelectedBlogs([])}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={loadBlogs}
            className="ml-4 text-sm underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Blogs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={blogs.length > 0 && selectedBlogs.length === blogs.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blog Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blogs.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedBlogs.includes(blog._id)}
                      onChange={() => toggleSelectBlog(blog._id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
<td className="px-6 py-4">
  <div className="flex items-start space-x-3">
    {blog.image_url && (
      <img
        src={getImageUrl(blog.image_url)}
        alt={blog.title || blog.Title}
        className="w-16 h-12 object-cover rounded"
        onError={(e) => {
          e.currentTarget.src = getPlaceholderImage("No Image");
        }}
      />
    )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {blog.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          )}
                          {blog.workflow?.auto_generated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              AI Generated
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {blog.title || blog.Title || 'Untitled'}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <SafeIcons.Tag className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {(blog.category?.join(', ') || blog.Category || 'Uncategorized')} • 
                            {(blog.tags || blog.Tags || []).slice(0, 2).join(', ')}
                            {(blog.tags || blog.Tags || []).length > 2 && ` +${(blog.tags || blog.Tags || []).length - 2}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status || blog.Status)}`}>
                        {getDisplayStatus(blog.status || blog.Status || 'Draft')}
                      </span>
                      {blog.published_at && (
                        <span className="text-xs text-gray-500">
                          <SafeIcons.Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(blog.published_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(blog.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/blogs/edit/${blog._id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <SafeIcons.Edit className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/blog/${blog.slug || blog.Slug}`}
                        target="_blank"
                        className="text-green-600 hover:text-green-800"
                        title="Preview"
                      >
                        <SafeIcons.Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleToggleFeatured(blog._id, blog.featured)}
                        className={`${blog.featured ? 'text-purple-600 hover:text-purple-800' : 'text-gray-400 hover:text-gray-600'}`}
                        title={blog.featured ? "Remove from featured" : "Add to featured"}
                      >
                        ⭐
                      </button>
                      <button
                        onClick={() => handleStatusChange(blog._id, blog.Status === 'Published' ? 'draft' : 'publish')}
                        className="text-indigo-600 hover:text-indigo-800"
                        title={blog.Status === 'Published' ? "Unpublish" : "Publish"}
                      >
                        {blog.Status === 'Published' ? '🔼' : '📤'}
                      </button>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Archive"
                      >
                        <SafeIcons.Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {blogs.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.status 
                ? "Try adjusting your filters" 
                : "Get started by creating your first blog post"}
            </p>
            {!(filters.search || filters.status) && (
              <Link
                to="/admin/blogs/new"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center space-x-2"
              >
                <SafeIcons.Plus className="w-5 h-5" />
                <span>Create First Blog</span>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(filters.page! - 1) * filters.limit! + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(filters.page! * filters.limit!, total)}
                </span>{' '}
                of <span className="font-medium">{total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page! - 1) })}
                  disabled={filters.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {filters.page} of {pages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pages, filters.page! + 1) })}
                  disabled={filters.page === pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;