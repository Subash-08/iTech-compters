import React, { useState, useRef } from 'react';
import { ProductFormData, ImageData } from '../../types/product';

interface ImagesSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditing?: boolean;
}

const ImagesSection: React.FC<ImagesSectionProps> = ({
  formData,
  updateFormData,
  isEditing = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (imageType: 'thumbnail' | 'hoverImage', field: string, value: string) => {
    const updatedImages = { ...formData.images };
    if (!updatedImages[imageType]) {
      updatedImages[imageType] = { url: '', altText: '' };
    }
    updatedImages[imageType] = { ...updatedImages[imageType]!, [field]: value };
    updateFormData({ images: updatedImages });
  };

  const handleGalleryImageChange = (index: number, field: string, value: string) => {
    const updatedGallery = [...formData.images.gallery];
    updatedGallery[index] = { ...updatedGallery[index], [field]: value };
    updateFormData({ 
      images: { ...formData.images, gallery: updatedGallery }
    });
  };

  const addGalleryImage = () => {
    const newImage: ImageData = { url: '', altText: '' };
    updateFormData({
      images: {
        ...formData.images,
        gallery: [...formData.images.gallery, newImage]
      }
    });
  };

  const removeGalleryImage = (index: number) => {
    const updatedGallery = formData.images.gallery.filter((_, i) => i !== index);
    updateFormData({
      images: { ...formData.images, gallery: updatedGallery }
    });
  };

  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    const updatedGallery = [...formData.images.gallery];
    const [movedImage] = updatedGallery.splice(fromIndex, 1);
    updatedGallery.splice(toIndex, 0, movedImage);
    updateFormData({
      images: { ...formData.images, gallery: updatedGallery }
    });
  };

  // Simulate file upload to server
  const uploadImageToServer = async (file: File): Promise<{ url: string; altText: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In real implementation, this would be your actual upload logic
        const objectUrl = URL.createObjectURL(file);
        const altText = file.name.split('.')[0];
        resolve({ url: objectUrl, altText });
      }, 1000);
    });
  };

  const handleFileUpload = async (files: FileList, imageType: 'thumbnail' | 'hoverImage' | 'gallery') => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadedImage = await uploadImageToServer(file);
        
        if (imageType === 'gallery') {
          const newImage: ImageData = uploadedImage;
          updateFormData({
            images: {
              ...formData.images,
              gallery: [...formData.images.gallery, newImage]
            }
          });
        } else {
          handleImageChange(imageType, 'url', uploadedImage.url);
          handleImageChange(imageType, 'altText', uploadedImage.altText);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, imageType: 'thumbnail' | 'hoverImage' | 'gallery') => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files, imageType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleImageReorder = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < formData.images.gallery.length) {
      moveGalleryImage(index, newIndex);
    }
  };

  const setAsThumbnail = (imageUrl: string, altText: string) => {
    handleImageChange('thumbnail', 'url', imageUrl);
    handleImageChange('thumbnail', 'altText', altText);
  };

  const setAsHoverImage = (imageUrl: string, altText: string) => {
    handleImageChange('hoverImage', 'url', imageUrl);
    handleImageChange('hoverImage', 'altText', altText);
  };

  const clearImage = (imageType: 'thumbnail' | 'hoverImage') => {
    if (imageType === 'thumbnail') {
      updateFormData({
        images: {
          ...formData.images,
          thumbnail: { url: '', altText: '' }
        }
      });
    } else {
      const { hoverImage, ...restImages } = formData.images;
      updateFormData({
        images: restImages
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>

      {/* Edit Mode Notice */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-blue-800">Edit Mode</span>
              <p className="text-sm text-blue-700 mt-1">
                You can update existing images or add new ones. Drag to reorder gallery images.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Image */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail Image <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-3">
            This will be the main image displayed in product listings.
            {isEditing && ' Current thumbnail:'}
          </p>
          
          <div className="flex items-start space-x-6">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              {formData.images.thumbnail.url ? (
                <div className="relative">
                  <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={formData.images.thumbnail.url}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => clearImage('thumbnail')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <span className="text-sm text-gray-500">No image</span>
                </div>
              )}
            </div>

            {/* Image Inputs */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.images.thumbnail.url}
                  onChange={(e) => handleImageChange('thumbnail', 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.images.thumbnail.altText}
                  onChange={(e) => handleImageChange('thumbnail', 'altText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description of the image"
                  required
                />
              </div>

              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } ${uploading ? 'opacity-50' : ''}`}
                onDrop={(e) => handleDrop(e, 'thumbnail')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="thumbnail-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'thumbnail')}
                  disabled={uploading}
                />
                <label htmlFor="thumbnail-upload" className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        <span className="text-blue-600 hover:text-blue-500">Upload a file</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hover Image {!isEditing && '(Optional)'}
          </label>
          <p className="text-sm text-gray-500 mb-3">
            {isEditing 
              ? 'Optional image that appears when hovering over the product thumbnail.'
              : 'Optional image that appears when customers hover over the product thumbnail.'
            }
          </p>
          
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {formData.images.hoverImage?.url ? (
                <div className="relative">
                  <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={formData.images.hoverImage.url}
                      alt="Hover image preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => clearImage('hoverImage')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <span className="text-sm text-gray-500">No image</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.images.hoverImage?.url || ''}
                  onChange={(e) => handleImageChange('hoverImage', 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/hover-image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={formData.images.hoverImage?.altText || ''}
                  onChange={(e) => handleImageChange('hoverImage', 'altText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description of the hover image"
                />
              </div>

              {isEditing && formData.images.gallery.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Set from Gallery
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const [url, altText] = e.target.value.split('|');
                        setAsHoverImage(url, altText);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select from gallery...</option>
                    {formData.images.gallery.map((image, index) => (
                      <option key={index} value={`${image.url}|${image.altText}`}>
                        {image.altText || `Gallery Image ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gallery Images {!isEditing && '(Optional)'}
              </label>
              <p className="text-sm text-gray-500">
                {isEditing 
                  ? 'Additional images for the product gallery. Drag to reorder.'
                  : 'Additional images that will be displayed in the product gallery.'
                }
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={addGalleryImage}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                disabled={uploading}
              >
                Add Image
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.images.gallery.map((image, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg bg-white"
                draggable={isEditing}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', index.toString());
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  moveGalleryImage(fromIndex, index);
                }}
              >
                {/* Image Preview with Reorder Controls */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    {image.url ? (
                      <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt="Gallery preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                    {isEditing && formData.images.gallery.length > 1 && (
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1">
                        <button
                          type="button"
                          onClick={() => handleImageReorder(index, 'up')}
                          disabled={index === 0}
                          className="w-6 h-6 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleImageReorder(index, 'down')}
                          disabled={index === formData.images.gallery.length - 1}
                          className="w-6 h-6 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={image.url}
                      onChange={(e) => handleGalleryImageChange(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/gallery-image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alt Text
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={image.altText}
                        onChange={(e) => handleGalleryImageChange(index, 'altText', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description of the image"
                      />
                      <div className="flex flex-col space-y-1">
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="px-3 py-1 text-red-600 hover:text-red-700 text-sm border border-red-300 rounded hover:bg-red-50"
                        >
                          Remove
                        </button>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => setAsThumbnail(image.url, image.altText)}
                            className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm border border-blue-300 rounded hover:bg-blue-50"
                          >
                            Set as Thumbnail
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {formData.images.gallery.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600">No gallery images added yet</p>
                <button
                  type="button"
                  onClick={addGalleryImage}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                >
                  Add your first gallery image
                </button>
              </div>
            )}
          </div>

          {/* Gallery Stats */}
          {isEditing && formData.images.gallery.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <p>
                {formData.images.gallery.length} gallery image{formData.images.gallery.length !== 1 ? 's' : ''} • 
                Drag to reorder • Click "Set as Thumbnail" to use any image as the main product image
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagesSection;