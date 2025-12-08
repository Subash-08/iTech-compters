// VariantItem.tsx
import React, { useState } from 'react';
import { ProductVariant, IdentifyingAttribute, ImageData } from '../../types/product';
import { baseURL } from '../../../config/config';

interface VariantItemProps {
  variant: ProductVariant;
  index: number;
  onVariantChange: (updatedVariant: ProductVariant) => void;
  onRemove: () => void;
  baseThumbnail?: ImageData;
}

const VariantItem: React.FC<VariantItemProps> = ({
  variant,
  index,
  onVariantChange,
  onRemove,
  baseThumbnail
}) => {
  const [newAttribute, setNewAttribute] = useState({ key: '', label: '', value: '' });
  const [newGalleryImage, setNewGalleryImage] = useState({ url: '', altText: '' });

  const handleVariantChange = (field: string, value: any) => {
    onVariantChange({
      ...variant,
      [field]: value
    });
  };

  const handleNestedChange = (parentField: string, field: string, value: any) => {
    onVariantChange({
      ...variant,
      [parentField]: {
        ...(variant[parentField as keyof ProductVariant] as any || {}),
        [field]: value
      }
    });
  };

   // 🆕 ADD THIS FUNCTION
  const getImageUrl = (imageObj: any) => {
    if (!imageObj?.url) return '';
      
    const url = imageObj.url;
    
    // If it's already a full URL or blob URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || baseURL;
    
    // Handle cases where it is just a filename (no slashes)
    if (!url.includes('/')) {
       if (url.startsWith('products-')) {
          return `${API_BASE_URL}/uploads/products/${url}`;
       }
       return `${API_BASE_URL}/uploads/products/${url}`;
    }
    
    // Handle paths that already start with /uploads/
    if (url.startsWith('/uploads/')) {
      return `${API_BASE_URL}${url}`;
    }
    
    // Fallback for other relative paths
    return `${API_BASE_URL}/${url.replace(/^\//, '')}`;
  };

  // 🆕 Get thumbnail URL for preview
  const getThumbnailUrl = () => {
    if (variant.images?.thumbnail?.url) {
      return getImageUrl(variant.images.thumbnail);
    }
    if (baseThumbnail?.url) {
      return getImageUrl(baseThumbnail);
    }
    return '';
  };

  // 🆕 Get gallery image URL
  const getGalleryImageUrl = (galleryImage: ImageData) => {
    return getImageUrl(galleryImage);
  };


  const handleGalleryChange = (galleryIndex: number, field: string, value: string) => {
    const updatedGallery = [...(variant.images.gallery || [])];
    updatedGallery[galleryIndex] = {
      ...updatedGallery[galleryIndex],
      [field]: value
    };
    
    handleNestedChange('images', 'gallery', updatedGallery);
  };

  const addGalleryImage = () => {
    if (!newGalleryImage.url.trim()) return;
    
    const updatedGallery = [...(variant.images.gallery || [])];
    updatedGallery.push({
      url: newGalleryImage.url,
      altText: newGalleryImage.altText || `Variant ${variant.name || index + 1} gallery image`
    });
    
    handleNestedChange('images', 'gallery', updatedGallery);
    setNewGalleryImage({ url: '', altText: '' });
  };

  const removeGalleryImage = (galleryIndex: number) => {
    const updatedGallery = (variant.images.gallery || []).filter((_, i) => i !== galleryIndex);
    handleNestedChange('images', 'gallery', updatedGallery);
  };

  const addAttribute = () => {
    if (!newAttribute.key || !newAttribute.value) return;
    
    const attribute: IdentifyingAttribute = {
      key: newAttribute.key,
      label: newAttribute.label || newAttribute.key,
      value: newAttribute.value,
      displayValue: newAttribute.value.charAt(0).toUpperCase() + newAttribute.value.slice(1),
      hexCode: getColorHexCode(newAttribute.value),
      isColor: newAttribute.key.toLowerCase().includes('color')
    };
    
    const updatedAttributes = [...(variant.identifyingAttributes || []), attribute];
    handleVariantChange('identifyingAttributes', updatedAttributes);
    setNewAttribute({ key: '', label: '', value: '' });
  };

  const removeAttribute = (attrIndex: number) => {
    const updatedAttributes = (variant.identifyingAttributes || []).filter((_, i) => i !== attrIndex);
    handleVariantChange('identifyingAttributes', updatedAttributes);
  };
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Update variant with both file and preview
    onVariantChange({
      ...variant,
      images: {
        ...variant.images,
        thumbnail: {
          url: previewUrl,
          altText: variant.images?.thumbnail?.altText || file.name
        }
      },
      _thumbnailFile: file // Store the actual file for FormData
    });
  }
};

const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length > 0) {
    const newGalleryImages = files.map(file => ({
      url: URL.createObjectURL(file),
      altText: file.name,
      _fileUpload: file // Store actual file
    }));

    // Store files separately
    const currentFiles = variant._galleryFiles || [];
    
    // Update variant
    onVariantChange({
      ...variant,
      images: {
        ...variant.images,
        gallery: [
          ...(variant.images.gallery || []),
          ...newGalleryImages
        ]
      },
      _galleryFiles: [...currentFiles, ...files]
    });
  }
};

  const getColorHexCode = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'red': '#dc2626', 'blue': '#2563eb', 'green': '#16a34a', 'yellow': '#ca8a04',
      'black': '#000000', 'white': '#ffffff', 'gray': '#6b7280', 'purple': '#9333ea',
      'pink': '#db2777', 'orange': '#ea580c', 'space black': '#1D1D1F', 'silver': '#E2E2E2',
      'space gray': '#535353', 'gold': '#ffd700', 'rose gold': '#b76e79'
    };
    return colorMap[colorName.toLowerCase()] || '#6b7280';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {variant.name || `Variant ${index + 1}`}
            </h4>
            {variant._id && (
              <p className="text-xs text-gray-500">ID: {variant._id}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`variant-active-${index}`}
              checked={variant.isActive !== false}
              onChange={(e) => handleVariantChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`variant-active-${index}`} className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variant Name *
          </label>
          <input
            type="text"
            value={variant.name || ''}
            onChange={(e) => handleVariantChange('name', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., MacBook Pro 16-inch - Space Black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU *
          </label>
          <input
            type="text"
            value={variant.sku || ''}
            onChange={(e) => handleVariantChange('sku', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., MBP16-SPACE-BLACK"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barcode *
          </label>
          <input
            type="text"
            value={variant.barcode || ''}
            onChange={(e) => handleVariantChange('barcode', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 194253058802"
            required
          />
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price ($)
          </label>
          <input
            type="number"
            value={variant.price || ''}
            onChange={(e) => handleVariantChange('price', parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="2499"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offer Price ($)
          </label>
          <input
            type="number"
            value={variant.offerPrice || ''}
            onChange={(e) => handleVariantChange('offerPrice', parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="2399"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity
          </label>
          <input
            type="number"
            value={variant.stockQuantity || ''}
            onChange={(e) => handleVariantChange('stockQuantity', parseInt(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="100"
            min="0"
          />
        </div>

        <div className="flex items-end">
          <div className="w-full">
            <div className="text-sm font-medium text-gray-700 mb-2">Status</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              variant.isActive && (variant.stockQuantity || 0) > 0
                ? 'bg-green-100 text-green-800'
                : variant.isActive
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {variant.isActive ? ((variant.stockQuantity || 0) > 0 ? 'In Stock' : 'Out of Stock') : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Identifying Attributes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Identifying Attributes
        </label>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newAttribute.key}
            onChange={(e) => setNewAttribute(prev => ({ ...prev, key: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Attribute key (e.g., color)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            value={newAttribute.label}
            onChange={(e) => setNewAttribute(prev => ({ ...prev, label: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Display label (e.g., Color)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            value={newAttribute.value}
            onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Value (e.g., space-black)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={addAttribute}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Add
          </button>
        </div>

        {(variant.identifyingAttributes && variant.identifyingAttributes.length > 0) ? (
          <div className="flex flex-wrap gap-2">
            {variant.identifyingAttributes.map((attr, attrIndex) => (
              <div key={attrIndex} className="flex items-center bg-blue-100 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-800">{attr.label}:</span>
                <span className="ml-1 text-blue-700">{attr.value}</span>
                {attr.hexCode && (
                  <div 
                    className="ml-2 w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: attr.hexCode }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeAttribute(attrIndex)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-3 border-2 border-dashed border-gray-300 rounded-lg">
            No attributes added. Add attributes to identify this variant.
          </p>
        )}
      </div>

      {/* Variant Images */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Variant Images</label>
        
        {/* Thumbnail */}
<div className="bg-gray-50 p-4 rounded-lg">
  <h5 className="text-sm font-medium text-gray-700 mb-3">Thumbnail Image</h5>
    {/* Thumbnail Preview */}
  {getThumbnailUrl() && (
    <div className="mb-3">
      <label className="block text-xs text-gray-600 mb-1">Preview</label>
      <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
        <img
          src={getThumbnailUrl()}
          alt="Thumbnail preview"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAzMkMzMy42NTQ4IDMyIDM1IDMzLjM0NTIgMzUgMzVDMzUgMzYuNjU0OCAzMy42NTQ4IDM4IDMyIDM4QzMwLjM0NTIgMzggMjkgMzYuNjU0OCAyOSAzNUMyOSAzMy4zNDUyIDMwLjM0NTIgMzIgMzIgMzJaIiBmaWxsPSIjOEE4QThBIi8+CjxwYXRoIGQ9Ik00MiAyNEM0MiAyMi44OTU0IDQxLjEwNDYgMjIgNDAgMjJMMzIgMjJDMzAuODk1NCAyMiAzMCAyMi44OTU0IDMwIDI0TDMwIDM2QzMwIDM3LjEwNDYgMzAuODk1NCAzOCAzMiAzOEw0MCAzOEM0MS4wNDU2IDM4IDQyIDM3LjEwNDYgNDIgMzZMNDIgMjRaIiBmaWxsPSIjOEE4QThBIi8+Cjwvc3ZnPgo=';
          }}
        />
      </div>
    </div>
  )}
  {/* File Upload Option */}
  <div className="mb-3">
    <label className="block text-xs text-gray-600 mb-1">Upload Thumbnail</label>
    <input
      type="file"
      accept="image/*"
      onChange={handleThumbnailFileChange}
      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  </div>
  
  {/* Or URL Input */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-xs text-gray-600 mb-1">Or Enter URL</label>
      <input
        type="text"
        value={variant.images?.thumbnail?.url || ''}
        onChange={(e) => handleNestedChange('images', 'thumbnail', {
          ...variant.images?.thumbnail,
          url: e.target.value
        })}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        placeholder="https://example.com/image.jpg"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 mb-1">Alt Text</label>
      <input
        type="text"
        value={variant.images?.thumbnail?.altText || ''}
        onChange={(e) => handleNestedChange('images', 'thumbnail', {
          ...variant.images?.thumbnail,
          altText: e.target.value
        })}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        placeholder="Product variant image"
      />
    </div>
  </div>
  
  {/* File upload for gallery */}
  <div className="mt-4">
    <label className="block text-xs text-gray-600 mb-1">Upload Gallery Images</label>
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={handleGalleryFileChange}
      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
    />
  </div>
</div>

        {/* Gallery Images */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">Gallery Images</h5>
            <span className="text-xs text-gray-500">
              {(variant.images.gallery || []).length} images
            </span>
          </div>

          {/* Add New Gallery Image */}
          <div className="bg-white p-3 rounded border border-gray-200 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                <input
                  type="text"
                  value={newGalleryImage.url}
                  onChange={(e) => setNewGalleryImage(prev => ({ ...prev, url: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="https://example.com/gallery-image.jpg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={newGalleryImage.altText}
                  onChange={(e) => setNewGalleryImage(prev => ({ ...prev, altText: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Description of the image"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addGalleryImage}
              disabled={!newGalleryImage.url.trim()}
              className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Gallery Image
            </button>
          </div>

          {/* Gallery Images List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {(variant.images.gallery && variant.images.gallery.length > 0) ? (
              variant.images.gallery.map((galleryImage, galleryIndex) => (
                <div key={galleryIndex} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                 {galleryImage.url ? (
                  <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={getGalleryImageUrl(galleryImage)}  // 🆕 Use getGalleryImageUrl
                      alt="Gallery preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAzMkMzMy42NTQ4IDMyIDM1IDMzLjM0NTIgMzUgMzVDMzUgMzYuNjU0OCAzMy42NTQ4IDM4IDMyIDM4QzMwLjM0NTIgMzggMjkgMzYuNjU0OCAyOSAzNUMyOSAzMy4zNDUyIDMwLjM0NTIgMzIgMzIgMzJaIiBmaWxsPSIjOEE4QThBIi8+CjxwYXRoIGQ9Ik00MiAyNEM0MiAyMi44OTU0IDQxLjEwNDYgMjIgNDAgMjJMMzIgMjJDMzAuODk1NCAyMiAzMCAyMi44OTU0IDMwIDI0TDMwIDM2QzMwIDM3LjEwNDYgMzAuODk1NCAzOCAzMiAzOEw0MCAzOEM0MS4xMDQ2IDM4IDQyIDM3LjEwNDYgNDIgMzZMNDIgMjRaIiBmaWxsPSIjOEE4QThBIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                      </div>
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Image Inputs */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={galleryImage.url}
                        onChange={(e) => handleGalleryChange(galleryIndex, 'url', e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Alt Text</label>
                      <input
                        type="text"
                        value={galleryImage.altText}
                        onChange={(e) => handleGalleryChange(galleryIndex, 'altText', e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Description of the image"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(galleryIndex)}
                    className="px-3 py-1 text-red-600 hover:text-red-700 text-sm border border-red-300 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm text-gray-500">No gallery images added</p>
                <p className="text-xs text-gray-400 mt-1">Add images using the form above</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantItem;