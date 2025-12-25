import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Brand, BrandFormData } from '../types/brand';
import { brandService } from '../services/brandService';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';
import {
  getBaseURL,
  getImageUrl,
  getPlaceholderImage,
  getImageAltText,
  getImagePathForStorage,
  validateImageFile,
  uploadImage,
  createPreviewUrl,
  revokePreviewUrl
} from '../../utils/imageUtils';

const BrandForm: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const isEdit = Boolean(slug);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string>('');

  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    status: 'active',
    deactivationReason: null,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    logoAltText: ''
  });

  const [showDeactivationReason, setShowDeactivationReason] = useState(false);

  useEffect(() => {
    if (isEdit && slug) {
      fetchBrand();
    }
  }, [isEdit, slug]);

  useEffect(() => {
    // Show deactivation reason field when status is set to inactive
    setShowDeactivationReason(formData.status === 'inactive');
  }, [formData.status]);

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const response = await brandService.getBrand(slug!);
      const brand: Brand = response.brand;
      
      setFormData({
        name: brand.name,
        description: brand.description || '',
        status: brand.status,
        deactivationReason: brand.deactivationReason || null,
        metaTitle: brand.metaTitle || '',
        metaDescription: brand.metaDescription || '',
        metaKeywords: brand.metaKeywords?.join(', ') || '',
        logoAltText: brand.logo?.altText || ''
      });

      if (brand.logo) {
        // Use getImageUrl to handle both local and live environments
        const imageUrl = getImageUrl(brand.logo);
        setPreviewImage(imageUrl);
        setOriginalLogoUrl(imageUrl);
        
        // Test if the image loads
        const testImage = new Image();
        testImage.onload = () => console.log('');
        testImage.onerror = () => {
          console.error('Preview image failed to load');
          // Fallback to placeholder if image fails to load
          setPreviewImage(getPlaceholderImage('Brand Logo'));
        };
        testImage.src = imageUrl;
      } else {
        setPreviewImage(getPlaceholderImage('Brand Logo'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch brand';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use validateImageFile for consistent validation
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid image file');
        toast.error(validation.error || 'Invalid image file');
        return;
      }

      setFormData(prev => ({ ...prev, logo: file }));
      setError('');
      
      // Create preview using createPreviewUrl
      const previewUrl = createPreviewUrl(file);
      setPreviewImage(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    // Revoke preview URL if it's a blob
    if (previewImage.startsWith('blob:')) {
      revokePreviewUrl(previewImage);
    }
    
    setFormData(prev => ({ ...prev, logo: null, removeLogo: true }));
    setPreviewImage(getPlaceholderImage('Brand Logo'));
  };

// BrandForm.tsx - Update the handleSubmit function
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate required fields
  if (!formData.name.trim()) {
    const errorMsg = 'Brand name is required';
    setError(errorMsg);
    toast.error(errorMsg);
    return;
  }

  try {
    setLoading(true);
    setError('');

    const submitData = new FormData();
    
    // Append all fields - make sure field names match backend expectations
    submitData.append('name', formData.name.trim());
    submitData.append('description', formData.description || '');
    submitData.append('status', formData.status);
    
    // SEO fields
    submitData.append('metaTitle', formData.metaTitle || '');
    submitData.append('metaDescription', formData.metaDescription || '');
    submitData.append('metaKeywords', formData.metaKeywords || '');
    submitData.append('logoAltText', formData.logoAltText || '');

    // Handle logo upload or removal
    if (formData.logo) {
      // Try to upload to brands endpoint, if fails try products as fallback
      let uploadResult = await uploadImage(formData.logo, 'brands');
      
      // If brands upload fails, try products as fallback
      if (!uploadResult.success) {
        console.warn('Brands upload failed, trying products endpoint:', uploadResult.error);
        uploadResult = await uploadImage(formData.logo, 'products');
      }
      
      if (uploadResult.success && uploadResult.url) {
        submitData.append('logoUrl', uploadResult.url);
        submitData.append('logoAltText', formData.logoAltText || '');
      } else {
        // If still fails, just append the file directly and let backend handle it
        console.warn('Upload failed, attaching file directly:', uploadResult.error);
        submitData.append('logo', formData.logo);
      }
    }

    if (formData.removeLogo) {
      submitData.append('removeLogo', 'true');
    }

    // Deactivation reason (only when deactivating)
    if (formData.status === 'inactive' && formData.deactivationReason) {
      submitData.append('deactivationReason', formData.deactivationReason);
    }

    let result;
    if (isEdit) {
      result = await brandService.updateBrand(slug!, submitData);
      toast.success('Brand updated successfully!');
    } else {
      result = await brandService.createBrand(submitData);
      toast.success('Brand created successfully!');
    }

    // Clean up blob URLs if any
    if (previewImage.startsWith('blob:')) {
      revokePreviewUrl(previewImage);
    }
    
    navigate('/admin/brands');
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || `Failed to ${isEdit ? 'update' : 'create'} brand`;
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewImage.startsWith('blob:')) {
        revokePreviewUrl(previewImage);
      }
    };
  }, [previewImage]);

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icons.Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Brand' : 'Create New Brand'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information Section */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Logo
                </label>
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    {previewImage ? (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt={formData.logoAltText || "Brand logo preview"}
                          className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = getPlaceholderImage('Brand Logo');
                          }}
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
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      JPEG, PNG, WebP, GIF up to 10MB. Recommended: 200x200px
                    </p>
                    
                    {/* Logo Alt Text */}
                    {(previewImage || formData.logoAltText) && (
                      <div className="mt-4">
                        <label htmlFor="logoAltText" className="block text-sm font-medium text-gray-700 mb-1">
                          Logo Alt Text
                        </label>
                        <input
                          type="text"
                          id="logoAltText"
                          name="logoAltText"
                          value={formData.logoAltText}
                          onChange={handleInputChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe the logo for accessibility"
                          maxLength={100}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Brand Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter brand name"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter brand description"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Status</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Deactivation Reason (only shown when status is inactive) */}
              {showDeactivationReason && (
                <div>
                  <label htmlFor="deactivationReason" className="block text-sm font-medium text-gray-700">
                    Deactivation Reason
                  </label>
                  <select
                    id="deactivationReason"
                    name="deactivationReason"
                    value={formData.deactivationReason || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="restructuring">Restructuring</option>
                    <option value="low-performance">Low Performance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* SEO Section */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">SEO Settings</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Meta Title */}
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
                  Meta Title
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Meta title for search engines"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  rows={2}
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Meta description for search engines"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>

              {/* Meta Keywords */}
              <div>
                <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  id="metaKeywords"
                  name="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate keywords with commas
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/brands')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {loading && <Icons.Loader className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? 'Update Brand' : 'Create Brand'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandForm;