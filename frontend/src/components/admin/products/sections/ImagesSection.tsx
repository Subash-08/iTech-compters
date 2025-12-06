import React, { useState, useRef, useEffect } from 'react';
import { ProductFormData, ImageData } from '../../types/product';
import { baseURL } from '../../../config/config';

interface ImagesSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditing?: boolean;
  onFilesChange?: (files: {
    thumbnail?: File;
    hoverImage?: File;
    gallery: File[];
    manufacturer: File[];
  }) => void;
  uploadedFiles?: {
    thumbnail?: File;
    hoverImage?: File;
    gallery: File[];
    manufacturer: File[];
  };
}

const ImagesSection: React.FC<ImagesSectionProps> = ({
  formData,
  updateFormData,
  isEditing = false,
  onFilesChange,
  uploadedFiles = { gallery: [], manufacturer: [] }
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeUploadType, setActiveUploadType] = useState<'thumbnail' | 'gallery' | 'manufacturer' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🆕 Improved image URL resolver
  const getImageUrl = (imageObj: any) => {
    if (!imageObj?.url) return '/placeholder-image.jpg';
      
    const url = imageObj.url;
    
    // 1. If it's already a full URL or blob URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }

    // Use environment variable or fallback to localhost
    const API_BASE_URL = import.meta.env.VITE_API_URL || baseURL;
    
    // 2. Handle cases where it is just a filename (no slashes)
    if (!url.includes('/')) {
       // Heuristic: If filename starts with known prefixes, route to that folder
       if (url.startsWith('products-')) {
          return `${API_BASE_URL}/uploads/products/${url}`;
       }
       if (url.startsWith('brands-')) {
          return `${API_BASE_URL}/uploads/brands/${url}`;
       }
       // Default fallback to products if unsure
       return `${API_BASE_URL}/uploads/products/${url}`;
    }
    
    // 3. Handle paths that already start with /uploads/
    if (url.startsWith('/uploads/')) {
      // 🔴 SMART FIX: Check if the subfolder is missing based on filename prefix
      const filename = url.split('/').pop();
      
      // If file is "products-xyz.jpg" but path doesn't contain "/products/"
      if (filename && filename.startsWith('products-') && !url.includes('/products/')) {
         return `${API_BASE_URL}/uploads/products/${filename}`;
      }
      // If file is "brands-xyz.jpg" but path doesn't contain "/brands/"
      if (filename && filename.startsWith('brands-') && !url.includes('/brands/')) {
         return `${API_BASE_URL}/uploads/brands/${filename}`;
      }

      return `${API_BASE_URL}${url}`;
    }
    
    // 4. Fallback for other relative paths
    return `${API_BASE_URL}/${url.replace(/^\//, '')}`;
  };

  // 🆕 Get preview URL with uploaded files priority
  const getImagePreviewUrl = (imageType: 'thumbnail' | 'hoverImage', imageData: ImageData | undefined) => {
    // Priority 1: Uploaded files (immediate preview)
    if (imageType === 'thumbnail' && uploadedFiles.thumbnail) {
      return URL.createObjectURL(uploadedFiles.thumbnail);
    }
    if (imageType === 'hoverImage' && uploadedFiles.hoverImage) {
      return URL.createObjectURL(uploadedFiles.hoverImage);
    }
    
    // Priority 2: Existing image URL (processed through getImageUrl)
    if (imageData?.url) {
      return getImageUrl(imageData);
    }
    
    // No image
    return '';
  };

  // 🆕 Update files in parent component
  const updateFiles = (newFiles: Partial<typeof uploadedFiles>) => {
    const updatedFiles = { ...uploadedFiles, ...newFiles };
    onFilesChange?.(updatedFiles);
  };

  const handleImageChange = (imageType: 'thumbnail' | 'hoverImage', field: string, value: string) => {
    const updatedImages = { ...formData.images };
    if (!updatedImages[imageType]) {
      updatedImages[imageType] = { url: '', altText: '' };
    }
    updatedImages[imageType] = { ...updatedImages[imageType]!, [field]: value };
    updateFormData({ images: updatedImages });
  };

  const handleGalleryImageChange = (index: number, field: string, value: string) => {
    if ((field === 'url' || field === 'altText') && !value.trim()) {
      return;
    }
    
    const updatedGallery = [...formData.images.gallery];
    updatedGallery[index] = { ...updatedGallery[index], [field]: value };
    updateFormData({ 
      images: { ...formData.images, gallery: updatedGallery }
    });
  };

  const handleManufacturerImageChange = (index: number, field: string, value: string) => {
    const updatedManufacturerImages = [...(formData.manufacturerImages || [])];
    updatedManufacturerImages[index] = { ...updatedManufacturerImages[index], [field]: value };
    updateFormData({ manufacturerImages: updatedManufacturerImages });
  };

  const addGalleryImage = () => {
    const newImage: ImageData = { 
      url: '', 
      altText: '',
      sectionTitle: ''
    };
    updateFormData({
      images: {
        ...formData.images,
        gallery: [...formData.images.gallery, newImage]
      }
    });
  };

  const addManufacturerImage = () => {
    const newImage: ImageData = { url: '', altText: '', sectionTitle: '' };
    updateFormData({
      manufacturerImages: [...(formData.manufacturerImages || []), newImage]
    });
  };

  const removeGalleryImage = (index: number) => {
    const updatedGallery = formData.images.gallery.filter((_, i) => i !== index);
    updateFormData({
      images: { ...formData.images, gallery: updatedGallery }
    });
  };

  const removeManufacturerImage = (index: number) => {
    const updatedManufacturerImages = (formData.manufacturerImages || []).filter((_, i) => i !== index);
    updateFormData({ manufacturerImages: updatedManufacturerImages });
  };

  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    const updatedGallery = [...formData.images.gallery];
    const [movedImage] = updatedGallery.splice(fromIndex, 1);
    updatedGallery.splice(toIndex, 0, movedImage);
    updateFormData({
      images: { ...formData.images, gallery: updatedGallery }
    });
  };

  const moveManufacturerImage = (fromIndex: number, toIndex: number) => {
    const updatedManufacturerImages = [...(formData.manufacturerImages || [])];
    const [movedImage] = updatedManufacturerImages.splice(fromIndex, 1);
    updatedManufacturerImages.splice(toIndex, 0, movedImage);
    updateFormData({ manufacturerImages: updatedManufacturerImages });
  };

  // 🆕 Simplified file upload function
  const handleFileUpload = async (files: FileList, imageType: 'thumbnail' | 'hoverImage' | 'gallery' | 'manufacturer') => {
    setUploading(true);
    setActiveUploadType(imageType);
    try {
      const fileArray = Array.from(files);
      
      // 🆕 Update files state in parent
      if (imageType === 'thumbnail') {
        updateFiles({ thumbnail: fileArray[0] });
      } else if (imageType === 'hoverImage') {
        updateFiles({ hoverImage: fileArray[0] });
      } else if (imageType === 'gallery') {
        updateFiles({ gallery: [...uploadedFiles.gallery, ...fileArray] });
      } else if (imageType === 'manufacturer') {
        updateFiles({ manufacturer: [...uploadedFiles.manufacturer, ...fileArray] });
      }

      // 🆕 Create temporary preview URLs for immediate display
      for (const file of fileArray) {
        const tempUrl = URL.createObjectURL(file);
        const altText = file.name.split('.')[0];
        
        if (imageType === 'gallery') {
          const newImage: ImageData = {
            url: tempUrl,
            altText,
            sectionTitle: ''
          };
          updateFormData({
            images: {
              ...formData.images,
              gallery: [...formData.images.gallery, newImage]
            }
          });
        } else if (imageType === 'manufacturer') {
          const newImage: ImageData = {
            url: tempUrl,
            altText,
            sectionTitle: ''
          };
          updateFormData({
            manufacturerImages: [...(formData.manufacturerImages || []), newImage]
          });
        } else {
          // 🆕 FIX: For thumbnail and hoverImage, create proper preview
          const updatedImages = { ...formData.images };
          
          if (imageType === 'thumbnail') {
            updatedImages.thumbnail = {
              url: tempUrl,
              altText,
              sectionTitle: ''
            };
          } else if (imageType === 'hoverImage') {
            updatedImages.hoverImage = {
              url: tempUrl,
              altText,
              sectionTitle: ''
            };
          }
          
          updateFormData({ images: updatedImages });
        }
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
      setActiveUploadType(null);
    }
  };

  // 🆕 Add function to remove files
  const removeUploadedFile = (imageType: 'thumbnail' | 'hoverImage' | 'gallery' | 'manufacturer', index?: number) => {
    if (imageType === 'thumbnail') {
      updateFiles({ thumbnail: undefined });
    } else if (imageType === 'hoverImage') {
      updateFiles({ hoverImage: undefined });
    } else if (imageType === 'gallery' && index !== undefined) {
      const newGallery = [...uploadedFiles.gallery];
      newGallery.splice(index, 1);
      updateFiles({ gallery: newGallery });
    } else if (imageType === 'manufacturer' && index !== undefined) {
      const newManufacturer = [...uploadedFiles.manufacturer];
      newManufacturer.splice(index, 1);
      updateFiles({ manufacturer: newManufacturer });
    }
  };

  // 🆕 Enhanced remove functions that also remove uploaded files
  const enhancedRemoveGalleryImage = (index: number) => {
    removeGalleryImage(index);
    removeUploadedFile('gallery', index);
  };

  const enhancedRemoveManufacturerImage = (index: number) => {
    removeManufacturerImage(index);
    removeUploadedFile('manufacturer', index);
  };

  const enhancedClearImage = (imageType: 'thumbnail' | 'hoverImage') => {
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
    removeUploadedFile(imageType);
  };

  const handleDrop = (e: React.DragEvent, imageType: 'thumbnail' | 'hoverImage' | 'gallery' | 'manufacturer') => {
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

  const handleImageReorder = (index: number, direction: 'up' | 'down', type: 'gallery' | 'manufacturer') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (type === 'gallery') {
      if (newIndex >= 0 && newIndex < formData.images.gallery.length) {
        moveGalleryImage(index, newIndex);
      }
    } else {
      if (newIndex >= 0 && newIndex < (formData.manufacturerImages || []).length) {
        moveManufacturerImage(index, newIndex);
      }
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

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any blob URLs
      if (formData.images.thumbnail?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(formData.images.thumbnail.url);
      }
      if (formData.images.hoverImage?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(formData.images.hoverImage.url);
      }
      formData.images.gallery.forEach(image => {
        if (image.url?.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
      (formData.manufacturerImages || []).forEach(image => {
        if (image.url?.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, []);

  // File upload component
  const FileUploadArea = ({ 
    type, 
    label 
  }: { 
    type: 'thumbnail' | 'hoverImage' | 'gallery' | 'manufacturer'; 
    label: string 
  }) => (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        dragOver && activeUploadType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${uploading && activeUploadType === type ? 'opacity-50' : ''}`}
      onDrop={(e) => handleDrop(e, type)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        id={`${type}-upload`}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files, type)}
        disabled={uploading}
        multiple={type === 'gallery' || type === 'manufacturer'}
      />
      <label htmlFor={`${type}-upload`} className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
        {uploading && activeUploadType === type ? (
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
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xs text-blue-600 mt-1">
              {type === 'gallery' || type === 'manufacturer' ? 'Multiple files supported' : 'Single file only'}
            </p>
          </>
        )}
      </label>
    </div>
  );

  // Image list component
  const ImageList = ({
    images,
    type,
    onImageChange,
    onRemove,
    onReorder,
    onSetAsThumbnail
  }: {
    images: ImageData[];
    type: 'gallery' | 'manufacturer';
    onImageChange: (index: number, field: string, value: string) => void;
    onRemove: (index: number) => void;
    onReorder: (index: number, direction: 'up' | 'down') => void;
    onSetAsThumbnail?: (url: string, altText: string) => void;
  }) => (
    <div className="space-y-4">
      {images.map((image, index) => {
        const previewUrl = getImageUrl(image);
        
        return (
          <div 
            key={index} 
            className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg bg-white"
            draggable={isEditing}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', index.toString());
              e.dataTransfer.setData('type', type);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
              const fromType = e.dataTransfer.getData('type');
              if (fromType === type) {
                if (type === 'gallery') {
                  moveGalleryImage(fromIndex, index);
                } else {
                  moveManufacturerImage(fromIndex, index);
                }
              }
            }}
          >
            {/* Image Preview with Reorder Controls */}
            <div className="flex-shrink-0">
              <div className="relative">
                {previewUrl ? (
                  <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Image preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEM0Mi4yMDkxIDQwIDQ0IDQxLjc5MDkgNDQgNDRDNDQgNDYuMjA5MSA0Mi4yMDkxIDQ4IDQwIDQ4QzM3Ljc5MDkgNDggMzYgNDYuMjA5MSAzNiA0NEMzNiA0MS43OTA5IDM3Ljc5MDkgNDAgNDAgNDBaIiBmaWxsPSIjOEE4QThBIi8+CjxwYXRoIGQ9Ik01MiAzNkM1MiAzNC44OTU0IDUxLjEwNDYgMzQgNTAgMzRMMzAgMzRDMjguODk1NCAzNCAyOCAzNC44OTU0IDI4IDM2TDI4IDUyQzI4IDUzLjEwNDYgMjguODk1NCA1NCAzMCA1NEw1MCA1NEM1MS4xMDQ2IDU0IDUyIDUzLjEwNDYgNTIgNTJMNjIgNDJMNjIgNTJDNjIgNTMuMTA0NiA2Mi44OTU0IDU0IDY0IDU0QzY1LjEwNDYgNTQgNjYgNTMuMTA0NiA2NiA1Mkw2NiAzNkM2NiAzNC44OTU0IDY1LjEwNDYgMzQgNjQgMzRMNTIgMzRaIiBmaWxsPSIjOEE4QThBIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <span className="text-xs text-gray-500">No image</span>
                  </div>
                )}
                {isEditing && images.length > 1 && (
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => onReorder(index, 'up')}
                      disabled={index === 0}
                      className="w-6 h-6 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorder(index, 'down')}
                      disabled={index === images.length - 1}
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
                  Image URL <span className="text-gray-400 text-xs">(Optional if uploading file)</span>
                </label>
                <input
                  type="text"
                  value={image.url}
                  onChange={(e) => onImageChange(index, 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg or upload file above"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={image.altText}
                  onChange={(e) => onImageChange(index, 'altText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description of the image"
                  required
                />
              </div>

              {type === 'manufacturer' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={image.sectionTitle || ''}
                    onChange={(e) => onImageChange(index, 'sectionTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Product Features, Technical Specifications, Usage Guide"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Title for this section in A+ content (e.g., "Key Features", "Technical Specs")
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="px-3 py-1 text-red-600 hover:text-red-700 text-sm border border-red-300 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                  {isEditing && onSetAsThumbnail && (
                    <button
                      type="button"
                      onClick={() => onSetAsThumbnail(image.url, image.altText)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Set as Thumbnail
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {images.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600">No {type} images added yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Add images by uploading files or providing URLs
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
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
                You can update existing images or add new ones. Use either file upload OR provide URL - both are not required.
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
            This will be the main image displayed in product listings. Use either file upload OR provide URL.
          </p>
          
          <div className="flex items-start space-x-6">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              {getImagePreviewUrl('thumbnail', formData.images.thumbnail) ? (
                <div className="relative">
                  <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={getImagePreviewUrl('thumbnail', formData.images.thumbnail)}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA2NEM2Ni4yMDkxIDY0IDY4IDY1Ljc5MDkgNjggNjhDNjggNzAuMjA5MSA2Ni4yMDkxIDcyIDY0IDcyQzYxLjc5MDkgNzIgNjAgNzAuMjA5MSA2MCA2OEM2MCA2NS43OTA5IDYxLjc5MDkgNjQgNjQgNjRaIiBmaWxsPSIjOEE4QThBIi8+CjxwYXRoIGQ9Ik04NCA1NkM4NCA1NC44OTU0IDgzLjEwNDYgNTQgODIgNTRMNjYgNTRDNjQuODk1NCA1NCA2NCA1NC44OTU0IDY0IDU2TDY0IDgyQzY0IDgzLjEwNDYgNjQuODk1NCA4NCA2NiA4NEw4MiA4NEM4My4xMDQ2IDg0IDg0IDgzLjEwNDYgODQgODJMODQgNTZaIiBmaWxsPSIjOEE4QThBIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                  {/* Show uploaded file info */}
                  {uploadedFiles.thumbnail && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1">
                      Uploaded: {uploadedFiles.thumbnail.name}
                    </div>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => enhancedClearImage('thumbnail')}
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
                  Image URL <span className="text-gray-400 text-xs">(Optional if uploading file)</span>
                </label>
                <input
                  type="text"
                  value={formData.images.thumbnail.url}
                  onChange={(e) => handleImageChange('thumbnail', 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg or upload file below"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Upload File
                </label>
                <FileUploadArea type="thumbnail" label="PNG, JPG, GIF up to 10MB" />
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
            Optional image that appears when hovering over the product thumbnail.
          </p>
          
          <div className="flex items-start space-x-6">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              {getImagePreviewUrl('hoverImage', formData.images.hoverImage) ? (
                <div className="relative">
                  <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={getImagePreviewUrl('hoverImage', formData.images.hoverImage)}
                      alt="Hover image preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA2NEM2Ni4yMDkxIDY0IDY4IDY1Ljc5MDkgNjggNjhDNjggNzAuMjA5MSA2Ni4yMDkxIDcyIDY0IDcyQzYxLjc5MDkgNzIgNjAgNzAuMjA5MSA2MCA2OEM2MCA2NS43OTA5IDYxLjc5MDkgNjQgNjQgNjRaIiBmaWxsPSIjOEE4QThBIi8+CjxwYXRoIGQ9Ik04NCA1NkM4NCA1NC44OTU0IDgzLjEwNDYgNTQgODIgNTRMNjYgNTRDNjQuODk1NCA1NCA2NCA1NC44OTU0IDY0IDU2TDY0IDgyQzY0IDgzLjEwNDYgNjQuODk1NCA4NCA2NiA4NEw4MiA4NEM4My4xMDQ2IDg0IDg0IDgzLjEwNDYgODQgODJMODQgNTZaIiBmaWxsPSIjOEE4QThBIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                  {/* Show uploaded file info */}
                  {uploadedFiles.hoverImage && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1">
                      Uploaded: {uploadedFiles.hoverImage.name}
                    </div>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => enhancedClearImage('hoverImage')}
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
                  Image URL <span className="text-gray-400 text-xs">(Optional if uploading file)</span>
                </label>
                <input
                  type="text"
                  value={formData.images.hoverImage?.url || ''}
                  onChange={(e) => handleImageChange('hoverImage', 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/hover-image.jpg or upload file below"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Upload File
                </label>
                <FileUploadArea type="hoverImage" label="PNG, JPG, GIF up to 10MB" />
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
                Additional images that will be displayed in the product gallery. Use file upload OR provide URLs.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={addGalleryImage}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                disabled={uploading}
              >
                Add Image Row
              </button>
            </div>
          </div>

          <ImageList
            images={formData.images.gallery}
            type="gallery"
            onImageChange={handleGalleryImageChange}
            onRemove={enhancedRemoveGalleryImage}
            onReorder={(index, direction) => handleImageReorder(index, direction, 'gallery')}
            onSetAsThumbnail={setAsThumbnail}
          />

          {/* Gallery File Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Upload Multiple Files
            </label>
            <FileUploadArea type="gallery" label="PNG, JPG, GIF up to 10MB - Will be added to gallery" />
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

        {/* Manufacturer Images (A+ Content) */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Manufacturer Images (A+ Content) {!isEditing && '(Optional)'}
              </label>
              <p className="text-sm text-gray-500">
                High-quality images and content provided by the manufacturer for enhanced product displays.
                Use file upload OR provide URLs.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={addManufacturerImage}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                disabled={uploading}
              >
                Add Image Row
              </button>
            </div>
          </div>

          <ImageList
            images={formData.manufacturerImages || []}
            type="manufacturer"
            onImageChange={handleManufacturerImageChange}
            onRemove={enhancedRemoveManufacturerImage}
            onReorder={(index, direction) => handleImageReorder(index, direction, 'manufacturer')}
          />

          {/* Manufacturer Images File Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Upload Multiple Files
            </label>
            <FileUploadArea type="manufacturer" label="PNG, JPG, GIF up to 10MB - For A+ content images" />
          </div>

          {/* Manufacturer Images Stats */}
          {isEditing && formData.manufacturerImages && formData.manufacturerImages.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <p>
                {formData.manufacturerImages.length} manufacturer image{formData.manufacturerImages.length !== 1 ? 's' : ''} • 
                Drag to reorder • These images are used for enhanced product displays and A+ content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagesSection;