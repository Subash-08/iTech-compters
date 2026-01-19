// components/admin/featured-brands/FeaturedBrandForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FeaturedBrand, FeaturedBrandFormData } from '../types/featuredBrand';
import { featuredBrandService } from '../services/featuredBrandService';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';
import { getImageUrl, createPreviewUrl, revokePreviewUrl } from '../../utils/imageUtils';

const FeaturedBrandForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string>('');
  const [logoFormatError, setLogoFormatError] = useState('');

  const [formData, setFormData] = useState<FeaturedBrandFormData>({
    name: '',
    description: '',
    websiteUrl: '',
    displayOrder: 0,
    isActive: true,
    logo: null,
    logoAltText: '',
    removeLogo: false
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchBrand();
    }
  }, [isEdit, id]);

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const response = await featuredBrandService.getFeaturedBrandById(id!);
      const brand: FeaturedBrand = response.data;
      
      setFormData({
        name: brand.name,
        description: brand.description || '',
        websiteUrl: brand.websiteUrl || '',
        displayOrder: brand.displayOrder,
        isActive: brand.isActive,
        logo: null,
        logoAltText: brand.logo?.altText || '',
        removeLogo: false
      });

      if (brand.logo?.url) {
        const imageUrl = getImageUrl(brand.logo.url);
        setPreviewImage(imageUrl);
        setOriginalLogoUrl(imageUrl);
      } else {
        setPreviewImage('/placeholder.png');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch featured brand';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.svg', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      setLogoFormatError('Invalid file type. Please upload JPEG, PNG, SVG, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setLogoFormatError('File size too large. Maximum size is 5MB.');
      return;
    }

    setLogoFormatError('');
    setFormData(prev => ({ ...prev, logo: file, removeLogo: false }));
    
    // Create preview
    const previewUrl = createPreviewUrl(file);
    setPreviewImage(previewUrl);
  };

  const handleRemoveLogo = () => {
    if (previewImage.startsWith('blob:')) {
      revokePreviewUrl(previewImage);
    }
    
    setFormData(prev => ({ ...prev, logo: null, removeLogo: true }));
    setPreviewImage('/placeholder.png');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      const errorMsg = 'Brand name is required';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate website URL format if provided
    if (formData.websiteUrl && !formData.websiteUrl.match(/^https?:\/\//)) {
      const errorMsg = 'Website URL must start with http:// or https://';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const submitData = new FormData();
      
      // Append all fields
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description || '');
      submitData.append('websiteUrl', formData.websiteUrl || '');
      submitData.append('displayOrder', formData.displayOrder.toString());
      submitData.append('isActive', formData.isActive.toString());
      submitData.append('logoAltText', formData.logoAltText || '');

      // Handle logo
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }

      if (formData.removeLogo) {
        submitData.append('removeLogo', 'true');
      }

      let result;
      if (isEdit) {
        result = await featuredBrandService.updateFeaturedBrand(id!, submitData);
        toast.success('Featured brand updated successfully!');
      } else {
        result = await featuredBrandService.createFeaturedBrand(submitData);
        toast.success('Featured brand created successfully!');
      }

      // Clean up blob URLs
      if (previewImage.startsWith('blob:')) {
        revokePreviewUrl(previewImage);
      }
      
      navigate('/admin/featured-brands');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${isEdit ? 'update' : 'create'} featured brand`;
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
            {isEdit ? 'Edit Featured Brand' : 'Create New Featured Brand'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            This brand will appear in the "Trusted by Leading Brands" section
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Logo Upload Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icons.Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Logo Requirements:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>Recommended size:</strong> 300x150 pixels (2:1 aspect ratio)</li>
                  <li><strong>Formats:</strong> PNG, JPG, SVG, WebP (SVG recommended for best quality)</li>
                  <li><strong>Maximum size:</strong> 5MB</li>
                  <li><strong>Background:</strong> White or transparent for best results</li>
                  <li><strong>Resolution:</strong> 72-150 DPI for optimal display</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Logo Upload Section */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Brand Logo</h3>
            
            <div className="flex items-start space-x-8">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                <div className="w-64 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {previewImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewImage}
                        alt="Brand logo preview"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Icons.Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No logo uploaded</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Preview (300x150px)
                </p>
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Logo *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp,image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {logoFormatError && (
                  <p className="text-sm text-red-600 mt-2">{logoFormatError}</p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Upload a high-quality logo with white or transparent background
                </p>

                {/* Logo Alt Text */}
                <div className="mt-6">
                  <label htmlFor="logoAltText" className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Alt Text (for accessibility)
                  </label>
                  <input
                    type="text"
                    id="logoAltText"
                    name="logoAltText"
                    value={formData.logoAltText}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., NVIDIA logo"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe the logo for screen readers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Information */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Brand Information</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Brand Name */}
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
                  placeholder="e.g., NVIDIA"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description about the brand"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description?.length || 0}/500 characters
                </p>
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                  pattern="https?://.*"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link will open in new tab when clicked
                </p>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Display Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Order */}
              <div>
                <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">
                  Display Order
                </label>
                <input
                  type="number"
                  id="displayOrder"
                  name="displayOrder"
                  min="0"
                  value={formData.displayOrder}
                  onChange={handleNumberInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first. Drag and drop in list view to reorder.
                </p>
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Active Status
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {formData.isActive ? 'Active (will appear on website)' : 'Inactive (hidden from website)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/featured-brands')}
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

export default FeaturedBrandForm;