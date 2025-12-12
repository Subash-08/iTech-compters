import React, { useState, useEffect, useRef } from 'react';
import { ProductData, Variant } from './productTypes';
import { 
  getImageUrl, 
  getPlaceholderImage, 
  getImageAltText 
} from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

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
    isVariantImage: boolean;
  }>>([]);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayDuration = 5000; // 5 seconds

  // Get variant-specific images only
  const getVariantImages = () => {
    const imagesList: Array<{
      url: string;
      altText: string;
      type: string;
      isVariantImage: boolean;
    }> = [];

    // 🔒 FIX: Show ONLY selected variant images when variant exists
    if (selectedVariant?.images) {
      // 1. Variant thumbnail
      if (selectedVariant.images.thumbnail) {
        const variantThumbnailUrl = getImageUrl(selectedVariant.images.thumbnail);
        if (variantThumbnailUrl && !variantThumbnailUrl.startsWith('blob:')) {
          imagesList.push({
            url: variantThumbnailUrl,
            altText: getImageAltText(
              selectedVariant.images.thumbnail,
              `${productData.name} - ${selectedVariant.name} thumbnail`
            ),
            type: 'variant-thumbnail',
            isVariantImage: true
          });
        }
      }

      // 2. Variant gallery images
      if (selectedVariant.images.gallery && selectedVariant.images.gallery.length > 0) {
        selectedVariant.images.gallery.forEach((img, index) => {
          const galleryUrl = getImageUrl(img);
          if (galleryUrl && !galleryUrl.startsWith('blob:')) {
            imagesList.push({
              url: galleryUrl,
              altText: getImageAltText(
                img,
                `${productData.name} - ${selectedVariant.name} image ${index + 1}`
              ),
              type: `variant-gallery-${index + 1}`,
              isVariantImage: true
            });
          }
        });
      }
    }

    // 🔒 FIX: Fallback to base product images ONLY if variant has no images
    if (imagesList.length === 0 && productData.images) {
      if (productData.images.thumbnail) {
        const baseThumbnailUrl = getImageUrl(productData.images.thumbnail);
        if (baseThumbnailUrl && !baseThumbnailUrl.startsWith('blob:')) {
          imagesList.push({
            url: baseThumbnailUrl,
            altText: getImageAltText(productData.images.thumbnail, productData.name),
            type: 'base-thumbnail',
            isVariantImage: false
          });
        }
      }

      // Base product gallery images
      if (productData.images.gallery && productData.images.gallery.length > 0) {
        productData.images.gallery.forEach((img, index) => {
          const galleryUrl = getImageUrl(img);
          if (galleryUrl && !galleryUrl.startsWith('blob:')) {
            imagesList.push({
              url: galleryUrl,
              altText: getImageAltText(img, `${productData.name} image ${index + 1}`),
              type: `base-gallery-${index + 1}`,
              isVariantImage: false
            });
          }
        });
      }
    }

    // Add placeholder if no images at all
    if (imagesList.length === 0) {
      imagesList.push({
        url: getPlaceholderImage('No Product Images Available', 800, 800),
        altText: 'Product image not available',
        type: 'placeholder',
        isVariantImage: false
      });
    }
    return imagesList;
  };

  useEffect(() => {
    const loadImages = () => {
      setLoading(true);
      const loadedImages = getVariantImages();
      setImages(loadedImages);
      setSelectedImage(0);
      setImageError(false);
      setLoading(false);
    };
    
    loadImages();
  }, [productData, selectedVariant]);

  // Auto-slideshow effect
  useEffect(() => {
    if (images.length <= 1 || !isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % images.length);
    }, autoplayDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images.length, isPlaying]);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
    resetAutoplay();
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
    resetAutoplay();
  };

  const resetAutoplay = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => setIsPlaying(true), 3000); // Resume after 3 seconds pause
  };

  const currentImage = images[selectedImage] || images[0];

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Thumbnail Skeleton */}
        <div className="hidden lg:flex flex-col space-y-3 w-20">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        {/* Main Image Skeleton */}
        <div className="flex-1">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-[500px] animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="h-10 w-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading images...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Vertical Thumbnail Gallery - Amazon Style */}
      {images.length > 1 && (
        <div className="hidden lg:flex flex-col space-y-3 w-20 flex-shrink-0">
          {images.map((image, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-20 h-20 rounded-lg overflow-hidden border transition-all duration-200 ${
                selectedImage === index
                  ? 'border-blue-500 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => {
                setSelectedImage(index);
                resetAutoplay();
              }}
              title={image.altText}
            >
              <img
                src={image.url}
                alt={image.altText}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.currentTarget.src = getPlaceholderImage('Thumbnail Error', 80, 80);
                }}
              />
              
              {/* Selected indicator */}
              {selectedImage === index && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
              )}

              {/* Loading indicator */}
              {selectedImage === index && imageLoaded && (
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: autoplayDuration / 1000, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-1 bg-blue-500"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Right: Main Image Viewer with Slideshow Controls */}
      <div className="flex-1">
        {/* Main Image Container */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="relative h-[500px] flex items-center justify-center bg-white">
            {/* Main Image with Slide Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center"
              >
                <img
                  src={currentImage.url}
                  alt={currentImage.altText}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    setImageError(true);
                    e.currentTarget.src = getPlaceholderImage('Image Failed to Load', 800, 800);
                  }}
                  onLoad={() => {
                    setImageError(false);
                    setImageLoaded(true);
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="h-12 w-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading image...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {imageError && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Image failed to load</p>
                  <p className="text-gray-500 text-sm">Please try another image</p>
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl group"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl group"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Auto-play Control */}
            {/* {images.length > 1 && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 transition-all duration-200 hover:shadow-xl group"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Pause</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Play</span>
                  </>
                )}
              </button>
            )} */}

            {/* Image Counter - Top Right */}
            {/* {images.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/70 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
                {selectedImage + 1} / {images.length}
              </div>
            )} */}
          </div>

          {/* Progress Dots - Bottom Center */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(index);
                    resetAutoplay();
                  }}
                  className="focus:outline-none"
                  aria-label={`Go to image ${index + 1}`}
                >
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    selectedImage === index 
                      ? 'bg-blue-500 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Horizontal Thumbnail Gallery (Mobile) */}
        {images.length > 1 && (
          <div className="mt-4 lg:hidden">
            <div className="flex space-x-3 overflow-x-auto pb-4 px-1">
              {images.map((image, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border transition-all relative ${
                    selectedImage === index
                      ? 'border-blue-500 shadow-sm'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    setSelectedImage(index);
                    resetAutoplay();
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.altText}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getPlaceholderImage('Thumbnail Error', 80, 80);
                    }}
                  />
                  
                  {/* Selected indicator for mobile */}
                  {selectedImage === index && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
                  )}

                  {/* Progress bar for mobile */}
                  {selectedImage === index && imageLoaded && (
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: autoplayDuration / 1000, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-1 bg-blue-500"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImages;