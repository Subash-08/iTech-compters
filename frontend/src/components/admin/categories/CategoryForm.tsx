import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Category, CategoryFormData } from '../types/category';
import { categoryAPI } from '../services/categoryAPI';
import { Icons } from '../Icon';
import LoadingSpinner from '../common/LoadingSpinner';
import { baseURL } from '../../config/config';

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parentCategory: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    status: 'active'
  });

  // Fetch category data for editing
  useEffect(() => {
    if (isEdit && id) {
      fetchCategory();
    }
    fetchCategories();
  }, [isEdit, id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategory(id!);
      
      const category = response.category || response.data?.category;
      
      if (!category) {
        toast.error('Category not found');
        navigate('/admin/categories');
        return;
      }
      
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parentCategory: category.parentCategory?._id || category.parentCategory || '',
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        metaKeywords: category.metaKeywords || [],
        status: category.status || 'active',
        imageAltText: category.image?.altText || ''
      });

      // Set preview image if exists
      if (category.image?.url) {
        const baseUrl = process.env.REACT_APP_API_URL || baseURL;
        const fullImageUrl = category.image.url.startsWith('http') 
          ? category.image.url 
          : `${baseUrl}${category.image.url}`;
        setPreviewImage(fullImageUrl);
      }
      
      toast.success('Category loaded successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch category';
      toast.error(errorMessage);
      console.error('Error fetching category:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories({ limit: 1000 });
      const categoriesData = response.categories || response.data?.categories || [];
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null, removeImage: true }));
    setPreviewImage('');
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleMetaKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({ ...prev, metaKeywords: keywords }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      setSaving(false);
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      setSaving(false);
      return;
    }

    try {
      const submitData = new FormData();
      
      // Append all form fields
      submitData.append('name', formData.name.trim());
      submitData.append('slug', formData.slug.trim());
      submitData.append('description', formData.description || '');
      submitData.append('parentCategory', formData.parentCategory || '');
      submitData.append('metaTitle', formData.metaTitle || '');
      submitData.append('metaDescription', formData.metaDescription || '');
      submitData.append('metaKeywords', formData.metaKeywords.join(', ') || '');
      submitData.append('status', formData.status);

      // Append image data
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (formData.imageAltText) {
        submitData.append('imageAltText', formData.imageAltText);
      }

      if (formData.removeImage) {
        submitData.append('removeImage', 'true');
      }

      if (isEdit && id) {
        await categoryAPI.updateCategory(id, submitData);
        toast.success('Category updated successfully!');
      } else {
        await categoryAPI.createCategory(submitData);
        toast.success('Category created successfully!');
      }
      
      setTimeout(() => {
        navigate('/admin/categories');
      }, 1000);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${isEdit ? 'update' : 'create'} category`;
      toast.error(errorMessage);
      console.error('Form submission error:', err);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    if (!formData.name) {
      toast.info('Please enter a category name first');
      return;
    }
    const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug }));
    toast.info('Slug generated from category name');
  };

  const handleCancel = () => {
    if (formData.name || formData.description) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        navigate('/admin/categories');
      }
    } else {
      navigate('/admin/categories');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Category' : 'Create New Category'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isEdit 
                  ? 'Update your category information and SEO settings' 
                  : 'Add a new category to organize your products'
                }
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
              title="Cancel"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Category Image</h2>
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Category preview"
                      className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <Icons.X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Icons.Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, JPEG, WebP up to 5MB. Recommended: 300x300px
                </p>
                
                {/* Image Alt Text */}
                {(previewImage || formData.imageAltText) && (
                  <div className="mt-4">
                    <label htmlFor="imageAltText" className="block text-sm font-medium text-gray-700 mb-1">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      id="imageAltText"
                      name="imageAltText"
                      value={formData.imageAltText || ''}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the image for accessibility"
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="e.g., Electronics"
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      required
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., electronics"
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-1 border border-gray-300"
                      title="Generate slug from category name"
                    >
                      <Icons.RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Generate</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Describe this category..."
              />
            </div>

            <div>
              <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <select
                id="parentCategory"
                name="parentCategory"
                value={formData.parentCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="">No Parent (Top Level)</option>
                {categories
                  .filter(cat => !isEdit || cat._id !== id)
                  .map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            {isEdit && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* SEO Information */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Meta title for search engines"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Recommended: 50-60 characters
                    {formData.metaTitle && (
                      <span className={`ml-2 ${formData.metaTitle.length > 60 ? 'text-red-600' : 'text-green-600'}`}>
                        ({formData.metaTitle.length}/60)
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    rows={3}
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Meta description for search engines"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Recommended: 150-160 characters
                    {formData.metaDescription && (
                      <span className={`ml-2 ${formData.metaDescription.length > 160 ? 'text-red-600' : 'text-green-600'}`}>
                        ({formData.metaDescription.length}/160)
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    id="metaKeywords"
                    name="metaKeywords"
                    value={formData.metaKeywords.join(', ')}
                    onChange={handleMetaKeywordsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Separate keywords with commas • {formData.metaKeywords.length} keywords added
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
            >
              <Icons.X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Icons.Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Category' : 'Create Category'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;