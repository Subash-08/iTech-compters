// src/components/sections/SectionRenderer.tsx (FIXED)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from '../video/VideoCard';
import VideoPlayer from '../video/VideoPlayer';

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
  layoutType: 'card' | 'slider' | 'grid' | 'masonry' | 'full-video';
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout>();

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % section.videos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + section.videos.length) % section.videos.length);
  };

  // Helper function to get full URL
  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    // Add your backend URL here
    const backendUrl = 'http://localhost:5000';
    return `${backendUrl}${url}`;
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
      case 'card':
      default:
        return renderCard(videos);
    }
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
          className="h-[70vh] max-h-[800px] rounded-2xl overflow-hidden shadow-2xl"
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