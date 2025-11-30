import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Reel {
  id: string;
  embedUrl: string;
  thumbnail?: string;
  height: number;
  title?: string;
  views?: string;
  likes?: string;
}

interface InstagramReelsProps {
  reels?: Reel[];
  autoPlay?: boolean;
  showThumbnails?: boolean;
  className?: string;
}

// Enhanced default reels data with more details
const defaultReels: Reel[] = [
  {
    id: 'DJb1baQTZFO',
    embedUrl: 'https://www.instagram.com/reel/DJb1baQTZFO/embed/captioned/?cr=1&v=14&wp=375&rd=https%3A%2F%2Fitechcomputers.shop&rp=%2F',
    height: 725,
    thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=300&h=500&fit=crop',
    title: 'Gaming Setup Tour',
    views: '15.2K',
    likes: '2.4K'
  },
  {
    id: 'DKR9Ul-TlEd',
    embedUrl: 'https://www.instagram.com/reel/DKR9Ul-TlEd/embed/captioned/?cr=1&v=14&wp=375&rd=https%3A%2F%2Fitechcomputers.shop&rp=%2F',
    height: 815,
    thumbnail: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&h=500&fit=crop',
    title: 'PC Building Process',
    views: '28.7K',
    likes: '3.8K'
  },
  {
    id: 'C_X-WJEyc5j',
    embedUrl: 'https://www.instagram.com/reel/C_X-WJEyc5j/embed/captioned/?cr=1&v=14&wp=375&rd=https%3A%2F%2Fitechcomputers.shop&rp=%2F',
    height: 833,
    thumbnail: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=300&h=500&fit=crop',
    title: 'RGB Lighting Setup',
    views: '42.1K',
    likes: '5.2K'
  },
  {
    id: 'C8o-DeTyOtQ',
    embedUrl: 'https://www.instagram.com/reel/C8o-DeTyOtQ/embed/captioned/?cr=1&v=14&wp=600&rd=https%3A%2F%2Fitechcomputers.shop&rp=%2F',
    height: 474,
    thumbnail: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=300&h=500&fit=crop',
    title: 'Keyboard Customization',
    views: '33.5K',
    likes: '4.1K'
  },
  {
    id: 'C9m7ibcSZb8',
    embedUrl: 'https://www.instagram.com/reel/C9m7ibcSZb8/embed/captioned/?cr=1&v=14&wp=600&rd=https%3A%2F%2Fitechcomputers.shop&rp=%2F',
    height: 869,
    thumbnail: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&h=500&fit=crop',
    title: 'Streaming Setup Reveal',
    views: '51.8K',
    likes: '6.7K'
  }
];

const InstagramReels: React.FC<InstagramReelsProps> = ({
  reels = defaultReels,
  autoPlay = true,
  showThumbnails = true,
  className = ''
}) => {
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleReels, setVisibleReels] = useState<Set<number>>(new Set([0]));
  
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Handle touch/mouse start
  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setPrevTranslate(currentTranslate);
    if (wrapperRef.current) {
      wrapperRef.current.style.cursor = 'grabbing';
      wrapperRef.current.style.transition = 'none';
    }
  }, [currentTranslate]);

  // Handle touch/mouse move
  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - startY;
    const newTranslate = prevTranslate + deltaY;
    
    // Calculate bounds
    const maxTranslate = 0;
    const minTranslate = -(reels.length - 1) * getViewportHeight();
    
    // Apply bounds
    const boundedTranslate = Math.max(minTranslate, Math.min(maxTranslate, newTranslate));
    
    setCurrentTranslate(boundedTranslate);
    
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateY(${boundedTranslate}px)`;
    }
  }, [isDragging, startY, prevTranslate, reels.length]);

  // Handle touch/mouse end
  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (wrapperRef.current) {
      wrapperRef.current.style.cursor = 'grab';
      wrapperRef.current.style.transition = 'transform 0.3s ease-out';
    }
    
    // Snap to nearest reel
    const viewportHeight = getViewportHeight();
    const snappedIndex = Math.round(-currentTranslate / viewportHeight);
    const finalIndex = Math.max(0, Math.min(reels.length - 1, snappedIndex));
    
    setCurrentReelIndex(finalIndex);
    setCurrentTranslate(-finalIndex * viewportHeight);
    
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateY(${-finalIndex * viewportHeight}px)`;
    }

    // Update visible reels for autoplay
    const newVisible = new Set([finalIndex]);
    if (finalIndex > 0) newVisible.add(finalIndex - 1);
    if (finalIndex < reels.length - 1) newVisible.add(finalIndex + 1);
    setVisibleReels(newVisible);
  }, [isDragging, currentTranslate, reels.length]);

  // Get viewport height
  const getViewportHeight = () => {
    return containerRef.current?.clientHeight || window.innerHeight;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientY);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentReelIndex(prev => Math.min(prev + 1, reels.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCurrentReelIndex(prev => Math.max(prev - 1, 0));
    }
  };

  // Set up intersection observer for autoplay
  useEffect(() => {
    if (!autoPlay) return;

    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.7
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const index = parseInt(entry.target.getAttribute('data-reel-index') || '0');
        if (entry.isIntersecting) {
          setVisibleReels(prev => new Set(prev).add(index));
        } else {
          setVisibleReels(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }
      });
    }, options);

    const reelItems = wrapperRef.current?.querySelectorAll('.reel-item');
    reelItems?.forEach(item => observerRef.current?.observe(item));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [autoPlay, reels.length]);

  // Update translate when current index changes
  useEffect(() => {
    const viewportHeight = getViewportHeight();
    setCurrentTranslate(-currentReelIndex * viewportHeight);
    
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateY(${-currentReelIndex * viewportHeight}px)`;
    }
  }, [currentReelIndex]);

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Navigate to specific reel
  const navigateToReel = (index: number) => {
    setCurrentReelIndex(index);
  };

  const currentReel = reels[currentReelIndex];

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-blue-900 to-blue-900 min-h-screen ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Featured Reels
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover the latest tech setups, gaming rigs, and PC building tutorials from our community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          {/* Left Side - Reel Player */}
          <div className="lg:col-span-8">
            <div 
              className="relative w-full h-[90vh] rounded-3xl overflow-hidden bg-gray-800 shadow-2xl"
              ref={containerRef}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {/* Reels Container */}
              <div
                ref={wrapperRef}
                className="reels-wrapper w-full h-full transition-transform duration-300 ease-out cursor-grab"
                style={{ transform: `translateY(${currentTranslate}px)` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {reels.map((reel, index) => (
                  <div
                    key={reel.id}
                    data-reel-index={index}
                    className="reel-item w-full h-full flex items-center justify-center absolute top-0 left-0 p-4"
                  >
                    {/* Loading Skeleton */}
                    {isLoading && (
                      <div className="absolute inset-4 flex items-center justify-center bg-gray-700 rounded-2xl">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                          <p className="text-gray-300">Loading reel...</p>
                        </div>
                      </div>
                    )}

                    {/* Instagram Embed */}
                    {(autoPlay ? visibleReels.has(index) : index === currentReelIndex) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <iframe
                          src={reel.embedUrl}
                          className="w-full h-full max-w-2xl rounded-2xl shadow-2xl border-2 border-white/20"
                          allowTransparency={true}
                          allowFullScreen={true}
                          frameBorder="0"
                          scrolling="no"
                          onLoad={handleIframeLoad}
                          title={`Instagram Reel ${index + 1}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Indicator */}
              <div className="absolute top-6 right-6 z-20">
                <div className="bg-black/60 backdrop-blur-lg text-white px-4 py-2 rounded-full text-sm font-medium">
                  {currentReelIndex + 1} / {reels.length}
                </div>
              </div>

              {/* Navigation Instructions */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black/60 backdrop-blur-lg text-white px-6 py-3 rounded-full text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                      </svg>
                      <span>Swipe Up</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                      </svg>
                      <span>Swipe Down</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Right Side - Reel Info & Thumbnails */}
          <div className="lg:col-span-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl h-full">
              {/* Current Reel Info */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">{currentReel.title}</h2>
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="font-semibold">{currentReel.likes}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-gray-300 mb-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                    </svg>
                    <span>{currentReel.views} views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>Verified</span>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed">
                  Watch this amazing tech setup featuring the latest components and RGB lighting. Perfect for gaming and streaming.
                </p>
              </div>

              {/* Thumbnail Navigation */}
              {showThumbnails && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">More Reels</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {reels.map((reel, index) => (
                      <button
                        key={reel.id}
                        onClick={() => navigateToReel(index)}
                        className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group ${
                          index === currentReelIndex 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30' 
                            : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={reel.thumbnail}
                            alt={reel.title}
                            className={`w-16 h-16 rounded-xl object-cover transition-transform duration-300 ${
                              index === currentReelIndex ? 'ring-2 ring-cyan-400 scale-110' : 'group-hover:scale-105'
                            }`}
                          />
                          {index === currentReelIndex && (
                            <div className="absolute inset-0 bg-cyan-400/20 rounded-xl"></div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className={`font-medium truncate ${
                            index === currentReelIndex ? 'text-cyan-400' : 'text-white'
                          }`}>
                            {reel.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                            <span>{reel.views} views</span>
                            <span>{reel.likes} likes</span>
                          </div>
                        </div>
                        {index === currentReelIndex && (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-white/10">
                <button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105">
                  Follow
                </button>
                <button className="flex-1 bg-white/10 text-white py-3 px-6 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20">
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramReels;