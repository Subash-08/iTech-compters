import React from 'react';
import { useEffect } from 'react';
import { ProductFormData, Brand, Category } from '../../types/product';

interface BasicInfoSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  brands: Brand[] | null;
  categories: Category[] | null;
  isEditMode?: boolean;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  updateFormData,
  brands,
  categories,
  isEditMode = false
}) => {
  const handleInputChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
  };

  const handleArrayChange = (field: string, value: string[]) => {
    updateFormData({ [field]: value });
  };

  // Check if product has variants (to disable certain fields)
  const hasVariants = formData.variantConfiguration.hasVariants && formData.variants.length > 0;

  // Safe array access with fallbacks and better loading states
  const safeBrands = Array.isArray(brands) ? brands : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Get display names for selected items in edit mode
  const getSelectedBrandName = () => {
    if (!formData.brand) return '';
    const brand = safeBrands.find(b => b._id === formData.brand);
    return brand ? brand.name : 'Loading...';
  };

  useEffect(() => {
  }, [formData, formData.status]); // Specifically track status changes

  const getSelectedCategoryNames = () => {
    if (!formData.categories.length) return [];
    return formData.categories.map(catId => {
      const category = safeCategories.find(c => c._id === catId);
      return category ? category.name : 'Loading...';
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        {isEditMode && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Editing Mode
          </span>
        )}
      </div>

      {/* Variant Warning */}
      {hasVariants && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-yellow-800">Product Has Variants</span>
              <p className="text-sm text-yellow-700 mt-1">
                Pricing and inventory are managed at the variant level. Base product pricing fields are disabled.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product name"
            required
          />
          {isEditMode && formData.name && (
            <p className="text-xs text-green-600 mt-1">
              Current: {formData.name}
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand <span className="text-red-500">*</span>
          </label>
          {safeBrands.length === 0 ? (
            <div className="space-y-2">
              <select
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              >
                <option>Loading brands...</option>
              </select>
              <p className="text-xs text-yellow-600">
                {isEditMode ? 'Loading current brand...' : 'No brands available. Please add brands first.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a brand</option>
                {safeBrands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {isEditMode && formData.brand && (
                <p className="text-xs text-blue-600">
                  Current: {getSelectedBrandName()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories <span className="text-red-500">*</span>
          </label>
          {safeCategories.length === 0 ? (
            <div className="space-y-2">
              <select
                multiple
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 h-32"
              >
                <option>Loading categories...</option>
              </select>
              <p className="text-xs text-yellow-600">
                {isEditMode ? 'Loading current categories...' : 'No categories available. Please add categories first.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                multiple
                value={formData.categories}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  handleInputChange('categories', selected);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                required
              >
                {safeCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple categories
                </p>
                {isEditMode && formData.categories.length > 0 && (
                  <p className="text-xs text-blue-600">
                    {formData.categories.length} categories selected
                  </p>
                )}
              </div>
              {isEditMode && formData.categories.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">Current Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedCategoryNames().map((name, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HSN Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HSN Code
          </label>
          <input
            type="text"
            value={formData.hsn || ''}
            onChange={(e) => handleInputChange('hsn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter HSN code for tax purposes"
          />
          <p className="text-xs text-gray-500 mt-1">
            Harmonized System Nomenclature code for tax calculation
          </p>
          {isEditMode && formData.hsn && (
            <p className="text-xs text-green-600 mt-1">
              Current: {formData.hsn}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product description"
            required
          />
          {isEditMode && formData.description && (
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length} characters
            </p>
          )}
        </div>

        {/* Definition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Definition
          </label>
          <input
            type="text"
            value={formData.definition || ''}
            onChange={(e) => handleInputChange('definition', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief product definition (appears in search results)"
          />
          {isEditMode && formData.definition && (
            <p className="text-xs text-green-600 mt-1">
              Current: {formData.definition}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
            onChange={(e) => handleArrayChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter tags separated by commas (e.g., electronics, laptop, apple)"
          />
          {isEditMode && Array.isArray(formData.tags) && formData.tags.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 mb-1">Current Tags:</p>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={formData.condition}
              onChange={(e) => handleInputChange('condition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="New">New</option>
              <option value="Used">Used</option>
              <option value="Refurbished">Refurbished</option>
            </select>
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">
                Current: {formData.condition}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                handleInputChange('status', newStatus);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="OutOfStock">Out of Stock</option>
              <option value="Archived">Archived</option>
              <option value="Discontinued">Discontinued</option>
            </select>
            
            {isEditMode && (
              <div className="mt-2 space-y-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-yellow-800">Debug Info:</p>
                  <span className="text-xs text-yellow-600">Status Field</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="font-medium">Current Value:</span> 
                    <span className={`ml-1 ${formData.status === 'Published' ? 'text-green-600' : 'text-blue-600'}`}>
                      {formData.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Select Value:</span> 
                    <span className="ml-1 text-gray-600">{formData.status}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded border border-yellow-300"
                >
                  Check Current Status
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={formData.label || ''}
              onChange={(e) => handleInputChange('label', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Best Seller, New Arrival, Limited Edition"
            />
            {isEditMode && formData.label && (
              <p className="text-xs text-green-600 mt-1">
                Current: {formData.label}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Product is active
              </label>
            </div>
            {isEditMode && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                formData.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>

        {/* Edit Mode Summary */}
        {isEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Editing Product</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>
                <span className="font-medium">Name:</span> {formData.name || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Brand:</span> {getSelectedBrandName() || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Categories:</span> {formData.categories.length}
              </div>
              <div>
                <span className="font-medium">Status:</span> {formData.status}
              </div>
              <div>
                <span className="font-medium">HSN:</span> {formData.hsn || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Variants:</span> {hasVariants ? `${formData.variants.length} active` : 'No variants'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicInfoSection;