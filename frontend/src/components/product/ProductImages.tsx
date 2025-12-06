import React, { useState, useEffect } from 'react';
import { ProductData, Variant } from './productTypes';
import { 
  getImageUrl, 
  getPlaceholderImage, 
  getImageAltText 
} from '../utils/imageUtils'; // Import from imageUtils

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

  // Get all images - using imageUtils
  const getAllImages = () => {
    
    const imagesList: Array<{
      url: string;
      altText: string;
      type: string;
    }> = [];

      if (selectedVariant?.images?.thumbnail?.url?.startsWith('blob:')) {
    console.error('❌ CRITICAL: Variant thumbnail is a blob URL in database!', {
      variant: selectedVariant.name,
      url: selectedVariant.images.thumbnail.url
    });
  }
  
  if (selectedVariant?.images?.gallery?.some(img => img.url?.startsWith('blob:'))) {
    const blobCount = selectedVariant.images.gallery.filter(img => 
      img.url?.startsWith('blob:')
    ).length;
    console.error(`❌ CRITICAL: ${blobCount} blob URLs in variant gallery!`);
  }

    // 1. Add variant images FIRST (so they appear first)
    if (selectedVariant?.images) {
      // Variant thumbnail
      if (selectedVariant.images.thumbnail) {
        const variantThumbnailUrl = getImageUrl(selectedVariant.images.thumbnail);
        // Only add if it's not a blob URL (blob URLs are temporary previews)
        if (!variantThumbnailUrl.startsWith('blob:')) {
          imagesList.push({
            url: variantThumbnailUrl,
            altText: getImageAltText(selectedVariant.images.thumbnail, 
              `${productData.name} - ${selectedVariant.name}`),
            type: 'variant-thumbnail'
          });
        }
      }

      // Variant gallery images
      if (selectedVariant.images.gallery) {
        selectedVariant.images.gallery.forEach((img, index) => {
          const galleryUrl = getImageUrl(img);
          if (galleryUrl && !galleryUrl.startsWith('blob:')) {
            imagesList.push({
              url: galleryUrl,
              altText: getImageAltText(img, 
                `${productData.name} - ${selectedVariant.name} gallery ${index + 1}`),
              type: `variant-gallery-${index + 1}`
            });
          }
        });
      }
    }

    // 2. Add base product images
    if (productData.images) {
      // Base product thumbnail
      if (productData.images.thumbnail) {
        const baseThumbnailUrl = getImageUrl(productData.images.thumbnail);
        if (baseThumbnailUrl && !baseThumbnailUrl.startsWith('blob:')) {
          imagesList.push({
            url: baseThumbnailUrl,
            altText: getImageAltText(productData.images.thumbnail, productData.name),
            type: 'base-thumbnail'
          });
        }
      }

      // Base product hover image
      if (productData.images.hoverImage) {
        const hoverImageUrl = getImageUrl(productData.images.hoverImage);
        if (hoverImageUrl && !hoverImageUrl.startsWith('blob:')) {
          imagesList.push({
            url: hoverImageUrl,
            altText: getImageAltText(productData.images.hoverImage, 
              `${productData.name} hover image`),
            type: 'hover'
          });
        }
      }

      // Base product gallery images
      if (productData.images.gallery) {
        productData.images.gallery.forEach((img, index) => {
          const galleryUrl = getImageUrl(img);
          if (galleryUrl && !galleryUrl.startsWith('blob:')) {
            imagesList.push({
              url: galleryUrl,
              altText: getImageAltText(img, 
                `${productData.name} gallery ${index + 1}`),
              type: `base-gallery-${index + 1}`
            });
          }
        });
      }
    }

    // 3. Add manufacturer images (if any)
    if (productData.manufacturerImages) {
      productData.manufacturerImages.forEach((img, index) => {
        const manufacturerUrl = getImageUrl(img);
        if (manufacturerUrl && !manufacturerUrl.startsWith('blob:')) {
          imagesList.push({
            url: manufacturerUrl,
            altText: getImageAltText(img, 
              `${productData.name} manufacturer image ${index + 1}`),
            type: `manufacturer-${index + 1}`
          });
        }
      });
    }

    // 4. If no images, add placeholder
    if (imagesList.length === 0) {
      imagesList.push({
        url: getPlaceholderImage('No Product Images', 400, 400),
        altText: 'Product image not available',
        type: 'placeholder'
      });
    }

    // Log for debugging
    console.log('Generated images list:', imagesList.map(img => ({
      url: img.url.substring(0, 100) + '...',
      type: img.type
    })));

    return imagesList;
  };

  useEffect(() => {
    const loadImages = () => {
      setLoading(true);
      const loadedImages = getAllImages();
      setImages(loadedImages);
      // Reset to first image when images change
      setSelectedImage(0);
      setLoading(false);
    };
    
    loadImages();
  }, [productData, selectedVariant]);

  const currentImage = images[selectedImage] || images[0];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    const target = e.currentTarget;
    target.src = getPlaceholderImage('Image Failed to Load', 400, 400);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };
  
  const handleMainImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onClick={handleMainImageClick}
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
                    e.currentTarget.src = getPlaceholderImage('Thumbnail Error', 80, 80);
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