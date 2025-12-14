// components/common/ImageOptimizer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { getImageUrl, getPlaceholderImage, getBaseURL } from './imageUtils';

interface ImageOptimizerProps {
  src: any; // Can be string, object, or undefined
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  priority?: boolean;
  fallbackText?: string;
  onError?: () => void;
}

const ImageOptimizer: React.FC<ImageOptimizerProps> = React.memo(({
  src,
  alt = '',
  className = '',
  width,
  height,
  lazy = true,
  priority = false,
  fallbackText = 'Image',
  onError
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  // Memoize the optimized image URL
  const optimizedSrc = useMemo(() => {
    if (!src) return getPlaceholderImage(fallbackText, width || 300, height || 300);
    
    try {
      const url = getImageUrl(src);
      
      // Check if the URL is from a different environment
      const isProduction = typeof window !== 'undefined' && 
        !window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1');
      
      const isLocal = typeof window !== 'undefined' && 
        (window.location.hostname.includes('localhost') || 
         window.location.hostname.includes('127.0.0.1'));
      
      // Fix URL mismatches between environments
      if (url.includes('localhost:5000') && isProduction) {
        // Replace localhost with production URL
        const path = url.replace(/^https?:\/\/[^/]+/, '');
        return `${getBaseURL()}${path}`;
      }
      
      // Add WebP optimization if supported
      if (url.includes('/uploads/') && !url.includes('.webp') && typeof window !== 'undefined') {
        const supportsWebP = window['hasWebPSupport'] !== false;
        if (supportsWebP) {
          // For local dev, use original
          if (isLocal) return url;
          
          // For production, you could use a CDN or image optimization service
          // Example: return `https://cdn.yoursite.com/${url}?format=webp&width=${width}`;
          return url;
        }
      }
      
      return url;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return getPlaceholderImage(fallbackText, width || 300, height || 300);
    }
  }, [src, width, height, fallbackText]);

  // Detect WebP support
  useEffect(() => {
    if (typeof window !== 'undefined' && window['hasWebPSupport'] === undefined) {
      const webP = new Image();
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      webP.onload = webP.onerror = function() {
        window['hasWebPSupport'] = webP.height === 2;
      };
    }
  }, []);

  useEffect(() => {
    setCurrentSrc(optimizedSrc);
    setLoaded(false);
    setHasError(false);
  }, [optimizedSrc]);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    if (currentSrc !== getPlaceholderImage(fallbackText, width || 300, height || 300)) {
      setCurrentSrc(getPlaceholderImage(fallbackText, width || 300, height || 300));
    }
    onError?.();
  };

  // Skeleton component
  const Skeleton = () => (
    <div 
      className={`absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%'
      }}
    />
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!loaded && !hasError && <Skeleton />}
      
      {/* Actual Image */}
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : (lazy ? 'lazy' : 'eager')}
        decoding={priority ? 'sync' : 'async'}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } w-full h-full object-cover ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        srcSet={width ? `
          ${currentSrc}?width=${Math.floor(width * 0.5)} 0.5x,
          ${currentSrc}?width=${width} 1x,
          ${currentSrc}?width=${Math.floor(width * 1.5)} 1.5x,
          ${currentSrc}?width=${Math.floor(width * 2)} 2x
        ` : undefined}
      />
      
      {/* Loading spinner overlay */}
      {!loaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

ImageOptimizer.displayName = 'ImageOptimizer';

export default ImageOptimizer;