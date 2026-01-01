import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogService, Blog, BlogFormData } from '../services/blogService';
import { toast } from 'react-toastify';
import api from '../../config/axiosConfig';
import { getImageUrl, getPlaceholderImage } from '../../utils/imageUtils';

interface BlogEditorProps {
  isEdit?: boolean;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
const [formData, setFormData] = useState<BlogFormData>({
  'Meta-tags': '',
  Title: '',
  Html: '',
  Slug: '',
  Category: null,
  Tags: [],
  Status: 'Draft', // Make sure this is always set
  excerpt: '',
  author: 'AI Generated',
  featured: false,
  image_url: null,
  published_at: null,
});

  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadBlog();
    }
  }, [isEdit, id]);

const loadBlog = async () => {
  try {
    setLoading(true);
    const response = await blogService.getBlogById(id!);
    if (response.success) {
      const blog = response.data;
      setFormData({
        'Meta-tags': blog['Meta-tags'] || blog.meta_tags || '',
        Title: blog.Title || blog.title || '',
        Html: blog.Html || blog.html || '',
        Slug: blog.Slug || blog.slug || '',
        Category: blog.Category || (blog.category?.[0] || null),
        Tags: blog.Tags || blog.tags || [],
        Status: (blog.Status || blog.status || 'Draft') as any, // Ensure this is always set
        excerpt: blog.excerpt || '',
        author: blog.author || 'AI Generated',
        featured: blog.featured || false,
        image_url: blog.image_url || null,
        published_at: blog.published_at || null,
      });
    }
  } catch (err: any) {
    setError(err.message || 'Failed to load blog');
    console.error('Load error:', err);
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.Title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.Slug.trim()) {
      // Auto-generate slug from title
      const slug = formData.Title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData({ ...formData, Slug: slug });
      formData.Slug = slug;
    }

    try {
      setSaving(true);
      
      // Prepare data for backend
      const submitData = {
        ...formData,
        // Ensure excerpt is generated if not provided
        excerpt: formData.excerpt || (formData['Meta-tags']?.substring(0, 250) || ''),
      };

      if (isEdit && id) {
        await blogService.updateBlog(id, submitData);
        toast.success('Blog updated successfully');
      } else {
        await blogService.createBlog(submitData);
        toast.success('Blog created successfully');
        navigate('/admin/blogs');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

const handleStatusChange = async (status: string) => {
  if (!id) return;
  
  try {
    // Ensure status is valid
    const validStatus = status || 'draft';
    await blogService.updateBlogStatus(id, validStatus);
    toast.success(`Blog ${validStatus} successfully`);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      Status: validStatus.charAt(0).toUpperCase() + validStatus.slice(1) as any
    }));
    
    // Set published_at if publishing
    if (validStatus.toLowerCase() === 'published' && !formData.published_at) {
      setFormData(prev => ({
        ...prev,
        published_at: new Date().toISOString()
      }));
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to update status');
  }
};

  const addCategory = () => {
    if (newCategory.trim()) {
      setFormData({
        ...formData,
        Category: newCategory.trim()
      });
      setNewCategory('');
    }
  };

  const removeCategory = () => {
    setFormData({
      ...formData,
      Category: null
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.Tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        Tags: [...formData.Tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

const removeTag = (tag: string) => {
  setFormData(prev => ({
    ...prev,
    Tags: prev.Tags ? prev.Tags.filter(t => t !== tag) : [] // Add null check
  }));
};

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // Create FormData - use a different variable name
    const uploadFormData = new FormData(); // Changed from 'formData' to 'uploadFormData'
    uploadFormData.append('image', file);

    // Upload to backend
    const response = await api.post('/admin/blogs/upload-image', uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      // Now correctly update the component's formData state
      setFormData(prev => ({
        ...prev,  // Use previous state to preserve all other fields
        image_url: response.data.data.image_url
      }));
      toast.success('Image uploaded successfully');
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to upload image');
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 animate-spin text-blue-600">⏳</div>
        <span className="ml-2 text-gray-600">Loading blog...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update your blog content and settings' : 'Write and publish a new blog post'}
          </p>
        </div>
        
        {isEdit && id && (
          <div className="flex space-x-2">
<select
  value={formData.Status ? formData.Status.toLowerCase() : 'draft'}
  onChange={(e) => handleStatusChange(e.target.value)}
  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>
  <option value="draft">Draft</option>
  <option value="review">Mark for Review</option>
  <option value="published">Publish Now</option>
  <option value="archived">Archive</option>
</select>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.Title}
                onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter blog title..."
                required
              />
            </div>

            {/* Slug */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">/blogs/</span>
                <input
                  type="text"
                  value={formData.Slug}
                  onChange={(e) => setFormData({ ...formData, Slug: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="blog-url-slug"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                URL-friendly version of the title. Use lowercase, hyphens, no spaces.
              </p>
            </div>

            {/* Meta Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description (SEO)
              </label>
              <textarea
                value={formData['Meta-tags']}
                onChange={(e) => setFormData({ ...formData, 'Meta-tags': e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description for search engines (150-160 characters recommended)"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{formData['Meta-tags']?.length || 0} characters</span>
                <span>Recommended: 150-160</span>
              </div>
            </div>

            {/* HTML Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Content *
                </label>
                <span className="text-sm text-gray-500">
                  {formData.Html?.length || 0} characters
                </span>
              </div>
              <textarea
                value={formData.Html}
                onChange={(e) => setFormData({ ...formData, Html: e.target.value })}
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Enter HTML content here..."
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Use HTML tags for formatting. The content will be rendered as-is.
              </p>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Featured Image */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Featured Image
  </label>
  {formData.image_url ? (
    <div className="space-y-3">
      <img
        src={getImageUrl(formData.image_url)}
        alt="Featured"
        className="w-full h-48 object-cover rounded-lg"
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.src = getPlaceholderImage("Image not found");
        }}
      />
      <button
        type="button"
        onClick={() => setFormData({ ...formData, image_url: null })}
        className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100"
      >
        Remove Image
      </button>
    </div>
  ) : (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <div className="text-gray-400 text-3xl mb-2">🖼️</div>
      <p className="text-sm text-gray-600 mb-3">No image selected</p>
      <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 inline-block">
        <span>Upload Image</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>
    </div>
  )}
</div>

            {/* Author & Featured */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Author name"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Mark as Featured Post
                  </label>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Add category..."
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.Category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {formData.Category}
                    <button
                      type="button"
                      onClick={removeCategory}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {!formData.Category && (
                  <p className="text-sm text-gray-500 italic">No category selected</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Add tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                >
                  Add
                </button>
              </div>
<div className="flex flex-wrap gap-2">
  {formData.Tags && formData.Tags.map((tag) => ( // Add null check here
    <span
      key={tag}
      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
    >
      {tag}
      <button
        type="button"
        onClick={() => removeTag(tag)}
        className="ml-2 text-gray-600 hover:text-gray-800"
      >
        ×
      </button>
    </span>
  ))}
  {(!formData.Tags || formData.Tags.length === 0) && ( // Update this check too
    <p className="text-sm text-gray-500 italic">No tags added</p>
  )}
</div>
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEdit ? 'Update Blog Post' : 'Create Blog Post'}</span>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                {isEdit ? 'Save changes to update the blog post' : 'Create and save as draft'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BlogEditor;