import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '../video/VideoPlayer';
import { useSectionVideoController } from '../utils/useSectionVideoController';

// --- Interfaces ---
interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
}

interface Section {
  _id: string;
  title: string;
  description: string;
  layoutType: 'card' | 'slider' | 'grid' | 'masonry' | 'full-video' | 'reels';
  autoplayMode?: 'none' | 'single' | 'all';
  defaultAutoplayIndex?: number;
  backgroundColor: string;
  textColor: string;
  maxWidth: string;
  padding: { top: number; bottom: number; left: number; right: number };
  gridConfig: { columns: number; gap: number };
  videos: Video[];
}

interface SectionRendererProps {
  section: Section;
  className?: string;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section, className = '' }) => {
  const { register, play, pauseAll, toggle } = useSectionVideoController();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Animation Variants
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // --- 1. Autoplay Logic (Backend Driven) ---
  useEffect(() => {
    const shouldAutoplay = section.autoplayMode === 'single' || section.layoutType === 'full-video';
    const targetIndex = section.defaultAutoplayIndex ?? 0;

    if (shouldAutoplay && section.videos.length > 0) {
      const timer = setTimeout(() => {
        play(targetIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [section.layoutType, section.autoplayMode, section.defaultAutoplayIndex, play, section.videos.length]);


  // --- 2. Layout Renderers ---

  const renderFullVideo = () => {
    const video = section.videos[0];
    if (!video) return null;
    return (
      <div className="
        w-full 
        relative
        rounded-2xl overflow-hidden shadow-2xl bg-black
       
      ">
        <VideoPlayer
          ref={(el) => register(0, el)}
          src={video.url}
          poster={video.thumbnailUrl}
          onPlay={() => play(0)}
          className="w-full h-full"
          objectFit="contain" // Ensures the whole video is visible without cropping
        />
      </div>
    );
  };

  const renderSlider = () => {
    const handleSlideChange = (newIndex: number) => {
      setCurrentSlide(newIndex);
      if (section.autoplayMode !== 'none') {
        play(newIndex);
      } else {
        pauseAll();
      }
    };

    return (
      <div className="relative group">
        <div className="overflow-hidden rounded-xl">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {section.videos.map((video, idx) => (
              <div key={video._id || idx} className="w-full flex-shrink-0 relative aspect-video bg-black">
                <VideoPlayer
                  ref={(el) => register(idx, el)}
                  src={video.url}
                  poster={video.thumbnailUrl}
                  onPlay={() => play(idx)}
                  objectFit="contain"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation */}
        {section.videos.length > 1 && (
          <>
            <button 
              onClick={() => handleSlideChange((currentSlide - 1 + section.videos.length) % section.videos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur hover:bg-white/20 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              ←
            </button>
            <button 
              onClick={() => handleSlideChange((currentSlide + 1) % section.videos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur hover:bg-white/20 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              →
            </button>
          </>
        )}
      </div>
    );
  };

  const renderGrid = (isMasonry = false) => (
    <div 
      className={isMasonry ? "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6" : "grid gap-6"}
      style={!isMasonry ? { 
        gridTemplateColumns: `repeat(${section.gridConfig.columns}, 1fr)`,
        gap: section.gridConfig.gap 
      } : {}}
    >
      {section.videos.map((video, idx) => (
        <motion.div 
          key={video._id || idx}
          variants={variants}
          className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isMasonry ? 'break-inside-avoid' : ''}`}
        >
          <div className="aspect-video relative bg-black">
            <VideoPlayer
              ref={(el) => register(idx, el)}
              src={video.url}
              poster={video.thumbnailUrl}
              onPlay={() => play(idx)}
              onClick={() => toggle(idx)}
              objectFit="contain"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
            {video.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderReels = () => {
    return (
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-4 scrollbar-hide">
        {section.videos.map((video, idx) => (
          <div 
            key={video._id || idx} 
            className="flex-shrink-0 w-[280px] md:w-[320px] snap-center"
          >
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-lg">
              <VideoPlayer
                ref={(el) => register(idx, el)}
                src={video.url}
                poster={video.thumbnailUrl}
                objectFit="cover" // Reels usually look better covering the full vertical space
                onPlay={() => play(idx)}
                onClick={() => toggle(idx)}
                loop
              />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                <p className="text-white font-medium text-sm truncate">{video.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --- Main Render ---
  return (
    <section 
      className={`py-12 ${className}`}
      style={{ 
        backgroundColor: section.backgroundColor,
        color: section.textColor,
        paddingTop: section.padding.top,
        paddingBottom: section.padding.bottom
      }}
    >
      <div className="mx-auto px-4" style={{ maxWidth: section.maxWidth }}>
        {/* Header */}
        {(section.title || section.description) && (
          <div className="text-center mb-10">
            {section.title && <h2 className="text-3xl font-bold mb-2">{section.title}</h2>}
            {section.description && <p className="opacity-80 max-w-2xl mx-auto">{section.description}</p>}
          </div>
        )}

        {/* Layout Router */}
        <AnimatePresence mode="wait">
          <motion.div initial="hidden" animate="visible" exit="hidden" variants={variants}>
            {section.layoutType === 'full-video' && renderFullVideo()}
            {section.layoutType === 'slider' && renderSlider()}
            {(section.layoutType === 'grid' || section.layoutType === 'card') && renderGrid(false)}
            {section.layoutType === 'masonry' && renderGrid(true)}
            {section.layoutType === 'reels' && renderReels()}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default SectionRenderer;