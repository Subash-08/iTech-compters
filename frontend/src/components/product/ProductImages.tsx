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
    const images: Array<{url: string, altText: string, type: string}> = [];
    
    // Add variant images first (highest priority)
    if (selectedVariant?.images) {
      if (selectedVariant.images.thumbnail?.url) {
        images.push({
          url: selectedVariant.images.thumbnail.url,
          altText: selectedVariant.images.thumbnail.altText || `${productData.name} - ${selectedVariant.name}`,
          type: 'variant-thumbnail'
        });
      }
      if (selectedVariant.images.gallery) {
        selectedVariant.images.gallery.forEach(img => {
          if (img.url) {
            images.push({
              url: img.url,
              altText: img.altText || `${productData.name} - ${selectedVariant.name}`,
              type: 'variant-gallery'
            });
          }
        });
      }
    }
    
    // Add product base images as fallback
    if (productData.images) {
      if (productData.images.thumbnail?.url) {
        images.push({
          url: productData.images.thumbnail.url,
          altText: productData.images.thumbnail.altText || productData.name,
          type: 'product-thumbnail'
        });
      }
      if (productData.images.gallery) {
        productData.images.gallery.forEach(img => {
          if (img.url) {
            images.push({
              url: img.url,
              altText: img.altText || productData.name,
              type: 'product-gallery'
            });
          }
        });
      }
      if (productData.images.hoverImage?.url) {
        images.push({
          url: productData.images.hoverImage.url,
          altText: productData.images.hoverImage.altText || productData.name,
          type: 'product-hover'
        });
      }
    }
    
    // Add placeholder if no images found
    if (images.length === 0) {
      images.push({
        url: '/placeholder-image.jpg',
        altText: 'Product image not available',
        type: 'placeholder'
      });
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
            src={currentImage.url}
            alt={currentImage.altText}
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
                src={image.url}
                alt={image.altText}
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