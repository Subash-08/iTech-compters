// src/components/sections/SectionRenderer.tsx (UPDATED)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from '../video/VideoCard';
import VideoPlayer from '../video/VideoPlayer';
import { baseURL } from '../config/config';

// Define proper interfaces
interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  settings: {
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    controls: boolean;
    playsInline: boolean;
  };
}

interface Section {
  _id: string;
  title: string;
  description: string;
  layoutType: 'card' | 'slider' | 'grid' | 'masonry' | 'full-video' | 'reels'; // Added 'reels'
  backgroundColor: string;
  textColor: string;
  maxWidth: string;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  gridConfig: {
    columns: number;
    gap: number;
  };
  sliderConfig: {
    autoplay: boolean;
    delay: number;
    loop: boolean;
    showNavigation: boolean;
    showPagination: boolean;
  };
  videos: Video[];
  order?: number;
  visible?: boolean;
}

interface SectionRendererProps {
  section: Section;
  className?: string;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section, className = '' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeReel, setActiveReel] = useState(0); // For reels layout
  const sliderRef = useRef<HTMLDivElement>(null);
  const reelsContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const autoplayRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Auto slide for slider layout
  useEffect(() => {
    if (section.layoutType === 'slider' && section.sliderConfig.autoplay && section.videos.length > 1) {
      autoplayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % section.videos.length);
      }, section.sliderConfig.delay);
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [section.layoutType, section.sliderConfig, section.videos.length]);

  // Intersection Observer for reels layout
  useEffect(() => {
    if (section.layoutType !== 'reels') return;

    const options = {
      root: reelsContainerRef.current,
      rootMargin: '0px',
      threshold: 0.7 // When 70% of video is visible
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          setActiveReel(index);
          
          // Play the video
          const video = videoRefs.current[index];
          if (video) {
            video.play().catch(console.error);
          }
        } else {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          // Pause non-visible videos
          const video = videoRefs.current[index];
          if (video && index !== activeReel) {
            video.pause();
          }
        }
      });
    }, options);

    // Observe all reel containers
    const reelContainers = reelsContainerRef.current?.querySelectorAll('.reel-container');
    reelContainers?.forEach(container => {
      observerRef.current?.observe(container);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [section.layoutType, section.videos.length, activeReel]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % section.videos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + section.videos.length) % section.videos.length);
  };

  // Helper function to get full URL
  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${baseURL}${url}`;
  };

  // Handle video ready for reels
  const handleVideoReady = (index: number, element: HTMLVideoElement) => {
    videoRefs.current[index] = element;
    
    // Only autoplay the first video initially
    if (index === 0 && section.layoutType === 'reels') {
      element.play().catch(console.error);
    }
  };

  // Render based on layout type
  const renderLayout = () => {
    const videos = section.videos || [];

    switch (section.layoutType) {
      case 'full-video':
        return renderFullVideo(videos[0]);
      case 'slider':
        return renderSlider(videos);
      case 'grid':
        return renderGrid(videos);
      case 'masonry':
        return renderMasonry(videos);
      case 'reels': // Add reels case
        return renderReels(videos);
      case 'card':
      default:
        return renderCard(videos);
    }
  };

// ========== REELS LAYOUT RENDERER (Updated for Side-by-Side Cards) ==========
const renderReels = (videos: Video[]) => {
  return (
    <div className="relative">
      <div 
        ref={reelsContainerRef}
        className="reels-scroll-container mx-auto h-[80vh] overflow-y-auto scroll-smooth px-4"
        style={{
          scrollbarWidth: 'thin',
          msOverflowStyle: 'none',
        }}
      >
        {/* Hide scrollbar for Chrome/Safari */}
        <style jsx>{`
          .reels-scroll-container::-webkit-scrollbar {
            width: 6px;
          }
          .reels-scroll-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .reels-scroll-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
          }
          .reels-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {videos.map((video, index) => (
            <div
              key={video._id || index}
              data-index={index}
              className="reel-container bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Video Container */}
              <div className="relative overflow-hidden bg-black">
                <VideoPlayer
                  src={getFullUrl(video.url)}
                  poster={getFullUrl(video.thumbnailUrl)}
                  autoplay={false}
                  loop={false}
                  muted={true}
                  controls={false}
                  playsInline={true}
                  className="w-full h-auto aspect-[3/4] object-cover transform group-hover:scale-105 transition-transform duration-300"
                  onReady={(element) => handleVideoReady(index, element)}
                  onPlay={() => setActiveReel(index)}
                  intersectionThreshold={0.3}
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => {
                      const video = videoRefs.current[index];
                      if (video) {
                        video.paused ? video.play() : video.pause();
                      }
                    }}
                    className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300"
                  >
                    <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Video Duration Badge */}
                {/* <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {video.duration || '0:30'}
                </div> */}
              </div>
              
              {/* Video Info */}
              {/* <div className="p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {video.title || `Video ${index + 1}`}
                </h3>
                
                {video.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {video.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const video = videoRefs.current[index];
                        if (video) {
                          video.muted = !video.muted;
                        }
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      title="Toggle mute"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l-3 3m0 0l-3 3m3-3v12" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        const video = videoRefs.current[index];
                        if (video) {
                          video.loop = !video.loop;
                        }
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      title="Toggle loop"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  
                  <span className="text-xs text-gray-400">
                    #{index + 1}
                  </span>
                </div>
              </div> */}
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll Stats */}
      <div className="text-center mt-4 text-sm text-gray-600">
        <p className="font-medium">
          Showing {videos.length} videos in vertical layout
        </p>
        <p className="text-xs mt-1">
          Click play button to control video playback
        </p>
      </div>
    </div>
  );
};

  const renderFullVideo = (video: Video | undefined) => {
    if (!video) return null;

    return (
      <motion.div
        variants={itemVariants}
        className="relative"
      >
        <VideoPlayer
          src={getFullUrl(video.url)}
          poster={getFullUrl(video.thumbnailUrl)}
          autoplay={video.settings?.autoplay || true}
          loop={video.settings?.loop || true}
          muted={video.settings?.muted || true}
          controls={video.settings?.controls || false}
          className="h-[70vh] max-h-[900px] overflow-hidden shadow-2xl"
        />
        {/* Overlay content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12">
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            {video.title}
          </motion.h2>
          {video.description && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg md:text-xl text-white/90 max-w-2xl"
            >
              {video.description}
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  };

  const renderSlider = (videos: Video[]) => {
    return (
      <div className="relative">
        <div
          ref={sliderRef}
          className="overflow-hidden rounded-2xl"
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
              width: `${videos.length * 100}%`
            }}
          >
            {videos.map((video, index) => (
              <div
                key={video._id || index}
                className="w-full flex-shrink-0"
              >
                <motion.div
                  variants={itemVariants}
                  className="h-[500px] md:h-[600px]"
                >
                  <VideoPlayer
                    src={getFullUrl(video.url)}
                    poster={getFullUrl(video.thumbnailUrl)}
                    autoplay={currentSlide === index && section.sliderConfig.autoplay}
                    loop={video.settings?.loop || true}
                    muted={video.settings?.muted || true}
                    controls={video.settings?.controls || false}
                    className="w-full h-full"
                  />
                  {/* Slide info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-white/80 text-sm md:text-base">
                        {video.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        {section.sliderConfig.showNavigation && videos.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Pagination dots */}
        {section.sliderConfig.showPagination && videos.length > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide === index
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGrid = (videos: Video[]) => {
    return (
      <div
        className="grid gap-4 md:gap-6"
        style={{
          gridTemplateColumns: `repeat(${section.gridConfig.columns}, 1fr)`,
          gap: `${section.gridConfig.gap}px`
        }}
      >
        {videos.map((video, index) => (
          <motion.div
            key={video._id || index}
            variants={itemVariants}
          >
            <VideoCard
              video={video}
              layout="grid"
              autoplay={video.settings?.autoplay || true}
              muted={video.settings?.muted || true}
              getFullUrl={getFullUrl}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  const renderMasonry = (videos: Video[]) => {
    return (
      <div
        className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
        style={{ columnGap: `${section.gridConfig.gap}px` }}
      >
        {videos.map((video, index) => (
          <motion.div
            key={video._id || index}
            variants={itemVariants}
            className="break-inside-avoid"
          >
            <VideoCard
              video={video}
              layout="masonry"
              autoplay={video.settings?.autoplay || true}
              muted={video.settings?.muted || true}
              getFullUrl={getFullUrl}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  const renderCard = (videos: Video[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <motion.div
            key={video._id || index}
            variants={itemVariants}
          >
            <VideoCard
              video={video}
              layout="card"
              autoplay={video.settings?.autoplay || true}
              muted={video.settings?.muted || true}
              getFullUrl={getFullUrl}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <section
      className={`py-12 md:py-16 ${className}`}
      style={{
        backgroundColor: section.backgroundColor,
        color: section.textColor,
        paddingTop: `${section.padding.top}px`,
        paddingBottom: `${section.padding.bottom}px`,
        paddingLeft: `${section.padding.left}px`,
        paddingRight: `${section.padding.right}px`
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: section.maxWidth }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Video Content */}
        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {renderLayout()}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default SectionRenderer;