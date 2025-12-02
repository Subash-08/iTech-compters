import React, { useState, useEffect } from 'react';
import { ProductData, Variant } from './productTypes';

interface ProductImagesProps {
  productData: ProductData;
  selectedVariant: Variant | null;
}

const ProductImages: React.FC<ProductImagesProps> = ({ productData, selectedVariant }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<Array<{
    url: string;
    altText: string;
    type: string;
  }>>([]);

  // Get image URL
  const getImageUrl = (url: string | undefined): string => {
    if (!url || url.startsWith('blob:')) {
      return getPlaceholderImage();
    }

    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Extract just the filename from any path
    let filename = url;
    if (url.includes('/')) {
      filename = url.split('/').pop() || url;
    }
    
    // Files are in /uploads/products/ directory
    return `${baseUrl}/uploads/products/${filename}`;
  };

  // Create placeholder image
  const getPlaceholderImage = () => {
    const placeholderSVG = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="#f3f4f6"/>
        <rect x="100" y="100" width="200" height="200" fill="#e5e7eb"/>
        <path d="M150 200 L200 150 L250 200 L200 250 Z" fill="#9ca3af"/>
        <circle cx="200" cy="200" r="20" fill="#6b7280"/>
        <text x="200" y="220" text-anchor="middle" font-family="Arial" font-size="14" fill="#4b5563">Image Loading</text>
      </svg>
    `)}`;
    return placeholderSVG;
  };

  // Get all images
  const getAllImages = () => {
    const imagesList: Array<{
      url: string;
      altText: string;
      type: string;
    }> = [];

    // Add product images (omitted for brevity)
    if (productData.images) {
      if (productData.images.thumbnail?.url) {
        imagesList.push({
          url: getImageUrl(productData.images.thumbnail.url),
          altText: productData.images.thumbnail.altText || productData.name,
          type: 'thumbnail'
        });
      }
      if (productData.images.hoverImage?.url) {
        imagesList.push({
          url: getImageUrl(productData.images.hoverImage.url),
          altText: productData.images.hoverImage.altText || `${productData.name} hover`,
          type: 'hover'
        });
      }
      if (productData.images.gallery) {
        productData.images.gallery.forEach((img, index) => {
          if (img.url && !img.url.startsWith('blob:')) {
            imagesList.push({
              url: getImageUrl(img.url),
              altText: img.altText || `${productData.name} gallery ${index + 1}`,
              type: `gallery-${index + 1}`
            });
          }
        });
      }
    }

    // Add variant images (omitted for brevity)
    if (selectedVariant?.images) {
      if (selectedVariant.images.thumbnail?.url) {
        imagesList.unshift({
          url: getImageUrl(selectedVariant.images.thumbnail.url),
          altText: selectedVariant.images.thumbnail.altText || `${productData.name} - ${selectedVariant.name}`,
          type: 'variant-thumbnail'
        });
      }
      if (selectedVariant.images.gallery) {
        selectedVariant.images.gallery.forEach((img, index) => {
          if (img.url && !img.url.startsWith('blob:')) {
            imagesList.unshift({
              url: getImageUrl(img.url),
              altText: img.altText || `${productData.name} - ${selectedVariant.name} gallery ${index + 1}`,
              type: `variant-gallery-${index + 1}`
            });
          }
        });
      }
    }

    // If no images, add placeholder
    if (imagesList.length === 0) {
      imagesList.push({
        url: getPlaceholderImage(),
        altText: 'Product image not available',
        type: 'placeholder'
      });
    }

    return imagesList;
  };

  useEffect(() => {
    const loadImages = () => {
      setLoading(true);
      const loadedImages = getAllImages();
      setImages(loadedImages);
      setLoading(false);
    };
    
    loadImages();
  }, [productData, selectedVariant]);

  const currentImage = images[selectedImage] || images[0];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    const target = e.currentTarget;
    target.src = getPlaceholderImage();
  };

  const handleImageLoad = () => {
    setImageError(false);
  };
  
  // 💡 NEW HANDLER: Prevent click action on the main image
  const handleMainImageClick = (e: React.MouseEvent) => {
      // Prevents the click from activating any surrounding <a> tags or default browser actions
      e.preventDefault(); 
      // Stops the click event from traveling up to parent elements
      e.stopPropagation();
      // Optional: You can add logic here if you want to explicitly open a lightbox/modal
      // console.log('Image click prevented from opening new tab.');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center h-96 min-h-[24rem]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading images...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center h-96 min-h-[24rem]">
        {/* 🎯 WRAPPED IMAGE WITH onClick HANDLER TO PREVENT DEFAULT ACTION */}
        <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={handleMainImageClick} // 👈 Added click handler here
        >
          {currentImage ? (
            <img
              src={currentImage.url}
              alt={currentImage.altText}
              className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
                imageError ? 'opacity-50' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-lg font-medium">No images available</div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Gallery ({images.length} images)
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden relative transition-all ${
                  selectedImage === index 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedImage(index);
                  setImageError(false);
                }}
                title={image.altText}
              >
                <img
                  src={image.url}
                  alt={image.altText}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderImage();
                  }}
                />
                {selectedImage === index && (
                  <div className="absolute inset-0 bg-blue-500/20"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImages;