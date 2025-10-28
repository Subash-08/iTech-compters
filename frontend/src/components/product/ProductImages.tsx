// src/components/product/ProductImages.tsx
import React, { useState, useEffect } from 'react';
import { ProductData, Variant } from './productTypes';

interface ProductImagesProps {
  productData: ProductData;
  selectedVariant: Variant | null;
}

const ProductImages: React.FC<ProductImagesProps> = ({ productData, selectedVariant }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Get all available images - update when variant changes
  const getAllImages = () => {
    const images: string[] = [];
    
    // Add variant images first
    if (selectedVariant?.images) {
      if (selectedVariant.images.thumbnail?.url) {
        images.push(selectedVariant.images.thumbnail.url);
      }
      if (selectedVariant.images.gallery) {
        selectedVariant.images.gallery.forEach(img => {
          if (img.url) images.push(img.url);
        });
      }
    }
    
    // Add product base images as fallback
    if (images.length === 0 && productData.images) {
      if (productData.images.thumbnail?.url) {
        images.push(productData.images.thumbnail.url);
      }
      if (productData.images.gallery) {
        productData.images.gallery.forEach(img => {
          if (img.url) images.push(img.url);
        });
      }
      if (productData.images.hoverImage?.url) {
        images.push(productData.images.hoverImage.url);
      }
    }
    
    // Add placeholder if no images found
    if (images.length === 0) {
      images.push('/placeholder-image.jpg');
    }
    
    return images;
  };

  const images = getAllImages();
  const currentImage = images[selectedImage];

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
    setImageError(false);
  }, [selectedVariant]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center h-96">
        {!imageError && currentImage ? (
          <img
            src={currentImage}
            alt={productData.name}
            className="max-h-full max-w-full object-contain"
            onError={handleImageError}
          />
        ) : (
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-2">📷</div>
            <div>Image not available</div>
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                selectedImage === index ? 'border-blue-500' : 'border-gray-200'
              }`}
              onClick={() => {
                setSelectedImage(index);
                setImageError(false);
              }}
            >
              <img
                src={image}
                alt={`${productData.name} view ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-thumbnail.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;