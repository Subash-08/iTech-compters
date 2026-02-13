import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProductData, Variant } from './productTypes';
import {
  getImageUrl,
  getPlaceholderImage,
  getImageAltText
} from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import GalleryModal from './GalleryModal';

interface ProductImagesProps {
  productData: ProductData;
  selectedVariant: Variant | null;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  altText: string;
  thumbnailUrl?: string;
  duration?: number;
}

const ProductImages: React.FC<ProductImagesProps> = ({ productData, selectedVariant }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'images' | 'videos'>('images');
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayDuration = 5000; // 5 seconds

  // Memoized media merging logic
  const { allImages, allVideos, combinedMedia } = useMemo(() => {
    const imagesList: MediaItem[] = [];
    const videosList: MediaItem[] = [];

    // Get images (variant overrides base)
    if (selectedVariant?.images) {
      // Variant thumbnail
      if (selectedVariant.images.thumbnail) {
        const url = getImageUrl(selectedVariant.images.thumbnail);
        if (url && !url.startsWith('blob:')) {
          imagesList.push({
            type: 'image',
            url,
            altText: getImageAltText(
              selectedVariant.images.thumbnail,
              `${productData.name} - ${selectedVariant.name} thumbnail`
            )
          });
        }
      }

      // Variant gallery
      if (selectedVariant.images.gallery?.length) {
        selectedVariant.images.gallery.forEach((img, index) => {
          const url = getImageUrl(img);
          if (url && !url.startsWith('blob:')) {
            imagesList.push({
              type: 'image',
              url,
              altText: getImageAltText(
                img,
                `${productData.name} - ${selectedVariant.name} image ${index + 1}`
              )
            });
          }
        });
      }
    }

    // Fallback to base images if no variant images
    if (imagesList.length === 0 && productData.images) {
      if (productData.images.thumbnail) {
        const url = getImageUrl(productData.images.thumbnail);
        if (url && !url.startsWith('blob:')) {
          imagesList.push({
            type: 'image',
            url,
            altText: getImageAltText(productData.images.thumbnail, productData.name)
          });
        }
      }

      if (productData.images.gallery?.length) {
        productData.images.gallery.forEach((img, index) => {
          const url = getImageUrl(img);
          if (url && !url.startsWith('blob:')) {
            imagesList.push({
              type: 'image',
              url,
              altText: getImageAltText(img, `${productData.name} image ${index + 1}`)
            });
          }
        });
      }
    }

    // Add videos (only for base product, not variant)
    if (!selectedVariant && productData.videos?.length) {
      productData.videos.forEach((video: any, index: number) => {
        videosList.push({
          type: 'video',
          url: video.url,
          altText: `${productData.name} video ${index + 1}`,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration
        });
      });
    }

    // Combined media (images first, then videos)
    const combined = [...imagesList, ...videosList];

    return {
      allImages: imagesList,
      allVideos: videosList,
      combinedMedia: combined.length > 0 ? combined : [{
        type: 'image' as const,
        url: getPlaceholderImage('No Product Images Available', 800, 800),
        altText: 'Product image not available'
      }]
    };
  }, [productData, selectedVariant]);

  // Determine display items (+N overlay logic)
  const { displayItems, hasOverlay, totalCount, remainingCount } = useMemo(() => {
    const total = combinedMedia.length;

    if (total <= 5) {
      return {
        displayItems: combinedMedia,
        hasOverlay: false,
        totalCount: total,
        remainingCount: 0
      };
    }

    // Show first 4, +N on 5th
    return {
      displayItems: combinedMedia.slice(0, 4),
      hasOverlay: true,
      totalCount: total,
      remainingCount: total - 4
    };
  }, [combinedMedia]);

  useEffect(() => {
    setLoading(true);
    setSelectedImage(0);
    setIsPlaying(true);
    setImageError(false);
    setLoading(false);
  }, [productData, selectedVariant]);

  // Auto-slideshow effect
  useEffect(() => {
    if (
      combinedMedia.length <= 1 ||
      !isPlaying ||
      combinedMedia[selectedImage]?.type === 'video'
    ) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % combinedMedia.length);
    }, autoplayDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [combinedMedia.length, isPlaying, selectedImage]);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % combinedMedia.length);
    resetAutoplay();
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + combinedMedia.length) % combinedMedia.length);
    resetAutoplay();
  };

  const resetAutoplay = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => setIsPlaying(true), 3000);
  };

  const handleThumbnailClick = (index: number) => {
    if (hasOverlay && index === 4) {
      // Clicked +N overlay - open modal
      openModal('images', 0);
    } else {
      setSelectedImage(index);
      resetAutoplay();
    }
  };

  const handleMainImageClick = () => {
    const item = displayItems[selectedImage];
    if (item.type === 'image') {
      const indexInImages = allImages.findIndex(img => img.url === item.url);
      openModal('images', indexInImages >= 0 ? indexInImages : 0);
    } else {
      const indexInVideos = allVideos.findIndex(vid => vid.url === item.url);
      openModal('videos', indexInVideos >= 0 ? indexInVideos : 0);
    }
  };

  const openModal = (tab: 'images' | 'videos', index: number) => {
    setModalInitialTab(tab);
    setModalInitialIndex(index);
    setIsModalOpen(true);
  };

  const currentItem = displayItems[selectedImage] || displayItems[0];

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
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Vertical Thumbnail Gallery */}
        {displayItems.length > 1 && (
          <div className="hidden lg:flex flex-col space-y-3 w-20 flex-shrink-0 max-h-[550px] overflow pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {displayItems.map((item, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-20 h-20 rounded-lg overflow-hidden border transition-all duration-200 ${selectedImage === index
                  ? 'border-blue-500 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
                onClick={() => handleThumbnailClick(index)}
                title={item.altText}
              >
                <img
                  src={item.type === 'video' ? item.thumbnailUrl : item.url}
                  alt={item.altText}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderImage('Thumbnail Error', 80, 80);
                  }}
                />

                {/* Play icon overlay for videos */}
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6 4l10 6-10 6V4z" />
                    </svg>
                  </div>
                )}

                {/* Selected indicator */}
                {selectedImage === index && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
                )}

                {/* Progress bar */}
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

            {/* +N Overlay Thumbnail */}
            {hasOverlay && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 hover:border-gray-400 transition-all duration-200 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center cursor-pointer"
                onClick={() => openModal('images', 0)}
                title={`View all ${totalCount} media items`}
              >
                <div className="text-center text-white">
                  <div className="text-xl font-bold">+{remainingCount}</div>
                  <div className="text-xs">more</div>
                </div>
              </motion.button>
            )}

            {/* +N Videos Tile (if videos exist) */}
            {allVideos.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-purple-400 hover:border-purple-500 transition-all duration-200 bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center cursor-pointer shadow-lg shadow-purple-500/30"
                onClick={() => openModal('videos', 0)}
                title={`View ${allVideos.length} video${allVideos.length > 1 ? 's' : ''}`}
              >
                <div className="text-center text-white">
                  <svg className="w-8 h-8 mx-auto mb-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 4l10 6-10 6V4z" />
                  </svg>
                  <div className="text-xs font-semibold">{allVideos.length} video{allVideos.length > 1 ? 's' : ''}</div>
                </div>
              </motion.button>
            )}
          </div>
        )}

        {/* Right: Main Image Viewer */}
        <div className="flex-1">
          <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="relative h-[500px] flex items-center justify-center bg-white">
              {/* Main Media with Slide Animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={handleMainImageClick}
                >
                  {/* Show from combinedMedia to include all images and videos */}
                  {combinedMedia[selectedImage]?.type === 'video' ? (
                    <video
                      src={combinedMedia[selectedImage].url}
                      controls
                      className="max-h-full max-w-full object-contain"
                      onPlay={() => setIsPlaying(false)}
                    />
                  ) : (
                    <img
                      src={combinedMedia[selectedImage]?.url || getPlaceholderImage('Image not available', 800, 800)}
                      alt={combinedMedia[selectedImage]?.altText || 'Product image'}
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
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {combinedMedia.length > 1 && (
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
            </div>

            {/* Progress Dots */}
            {displayItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
                {displayItems.slice(0, hasOverlay ? 4 : displayItems.length).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className="focus:outline-none"
                    aria-label={`Go to item ${index + 1}`}
                  >
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedImage === index
                      ? 'bg-blue-500 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                      }`} />
                  </button>
                ))}
                {hasOverlay && (
                  <button
                    onClick={() => openModal('images', 0)}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium ml-2"
                  >
                    +{remainingCount}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Horizontal Thumbnail Gallery (Mobile) */}
          {displayItems.length > 1 && (
            <div className="mt-4 lg:hidden">
              <div className="flex space-x-3 overflow-x-auto pb-4 px-1">
                {displayItems.map((item, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border transition-all relative ${selectedImage === index
                      ? 'border-blue-500 shadow-sm'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                    onClick={() => handleThumbnailClick(index)}
                  >
                    <img
                      src={item.type === 'video' ? item.thumbnailUrl : item.url}
                      alt={item.altText}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getPlaceholderImage('Thumbnail Error', 80, 80);
                      }}
                    />

                    {/* Play icon for videos */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6 4l10 6-10 6V4z" />
                        </svg>
                      </div>
                    )}

                    {/* Selected indicator */}
                    {selectedImage === index && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
                    )}
                  </motion.button>
                ))}

                {/* +N Overlay for mobile */}
                {hasOverlay && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-300 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                    onClick={() => openModal('images', 0)}
                  >
                    <div className="text-center text-white">
                      <div className="text-lg font-bold">+{remainingCount}</div>
                      <div className="text-xs">more</div>
                    </div>
                  </motion.button>
                )}

                {/* +N Videos for mobile */}
                {allVideos.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-purple-400 bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center shadow-lg shadow-purple-500/30"
                    onClick={() => openModal('videos', 0)}
                  >
                    <div className="text-center text-white">
                      <svg className="w-7 h-7 mx-auto mb-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 4l10 6-10 6V4z" />
                      </svg>
                      <div className="text-xs font-semibold">{allVideos.length}</div>
                    </div>
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={allImages}
        videos={allVideos}
        initialTab={modalInitialTab}
        initialIndex={modalInitialIndex}
      />
    </>
  );
};

export default ProductImages;