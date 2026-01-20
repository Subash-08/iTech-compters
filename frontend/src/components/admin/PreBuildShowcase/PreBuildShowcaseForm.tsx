import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PreBuildShowcaseFormData } from '../types/preBuildShowcase';
import { preBuildShowcaseService } from '../services/preBuildShowcaseService';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';
import { getImageUrl, createPreviewUrl, revokePreviewUrl } from '../../utils/imageUtils';

const PreBuildShowcaseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  
  const [formData, setFormData] = useState<PreBuildShowcaseFormData>({
    category: '',
    title: '',
    price: '',
    buttonLink: '/prebuilt-pcs',
    isWide: true,
    isActive: true,
    order: 0,
    image: null,
    imageAltText: ''
  });

  // Recommended Resolutions based on layout selection
  const resolutionHint = formData.isWide 
    ? "Recommended Size: 1600x600px (Landscape/Ultra-Wide)" 
    : "Recommended Size: 600x800px (Portrait/Standard)";

  useEffect(() => {
    if (isEdit && id) {
      fetchItem();
    }
  }, [isEdit, id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await preBuildShowcaseService.getAdminShowcaseItems();
      // Find specific item since we didn't implement getById in backend for admin specifically
      // or use the getById endpoint if you implemented it. Here assuming list fetch.
      const item = response.data.find((i: any) => i._id === id);
      
      if (item) {
        setFormData({
          category: item.category,
          title: item.title,
          price: item.price,
          buttonLink: item.buttonLink,
          isWide: item.isWide,
          isActive: item.isActive,
          order: item.order,
          image: null, // File is null, we show preview
          imageAltText: item.image?.altText || ''
        });
        setPreviewImage(getImageUrl(item.image));
      }
    } catch (err) {
      toast.error('Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const previewUrl = createPreviewUrl(file);
      setPreviewImage(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('category', formData.category);
      submitData.append('title', formData.title);
      submitData.append('price', formData.price);
      submitData.append('buttonLink', formData.buttonLink);
      submitData.append('isWide', String(formData.isWide));
      submitData.append('isActive', String(formData.isActive));
      submitData.append('order', String(formData.order));
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (isEdit) {
        await preBuildShowcaseService.updateItem(id!, submitData);
        toast.success('Updated successfully');
      } else {
        await preBuildShowcaseService.createItem(submitData);
        toast.success('Created successfully');
      }
      navigate('/admin/pre-build-showcase');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewImage.startsWith('blob:')) revokePreviewUrl(previewImage);
    };
  }, [previewImage]);

  if (loading && isEdit && !formData.title) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Showcase Item' : 'Create New Showcase Item'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Image *
            </label>
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-48 h-28 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-48 h-28 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Icons.Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                  required={!isEdit}
                />
                <div className="mt-2 flex items-center gap-2 text-sm">
                   <Icons.Info className="w-4 h-4 text-blue-500" />
                   <span className="font-medium text-blue-700">{resolutionHint}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Formats: JPG, PNG, WebP.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                placeholder="e.g. Creative Power"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g. Content Creation"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Price Label *</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                placeholder="e.g. Starting ₹49999"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Button Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Button Link</label>
              <input
                type="text"
                name="buttonLink"
                value={formData.buttonLink}
                onChange={handleInputChange}
                placeholder="/prebuilt-pcs"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isWide"
                name="isWide"
                checked={formData.isWide}
                onChange={(e) => setFormData(prev => ({ ...prev, isWide: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isWide" className="text-sm font-medium text-gray-700">
                Wide Layout (Full Width / Col-Span-4)
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (Visible on website)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/pre-build-showcase')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <Icons.Loader className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? 'Update Item' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreBuildShowcaseForm;