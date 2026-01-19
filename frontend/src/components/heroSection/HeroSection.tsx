// src/components/hero/HeroSection.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { heroSectionService, HeroSection as HeroSectionType } from '../admin/services/heroSectionService';
import { baseURL } from '../config/config';

const image_baseURL = import.meta.env.VITE_API_URL || baseURL;

// ----------------------------------------------------------------------
// Helper: Get Media URL
// ----------------------------------------------------------------------
const getMediaUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${image_baseURL}${path}`;
  return `${image_baseURL}/${path}`;
};

// ----------------------------------------------------------------------
// Skeleton Loader
// ----------------------------------------------------------------------
const HeroSkeleton: React.FC = () => {
  return (
    <div className="relative w-full mx-auto p-4 max-w-[1600px] animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 w-full">
        {/* Main Hero Skeleton */}
        <div className="lg:col-span-5 w-full aspect-video bg-gray-200 rounded-lg" />
        
        {/* Side Banners Skeleton */}
        <div className="hidden lg:flex lg:col-span-2 flex-col gap-4 w-full h-full">
          <div className="flex-1 bg-gray-200 rounded-lg" />
          <div className="flex-1 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Video Player Component
// ----------------------------------------------------------------------
interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  isActive,
  autoplay = true,
  muted = true,
  loop = true,
  controls = false,
  playsInline = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      // Try to play video when active
      const playVideo = async () => {
        try {
          if (autoplay) {
            await videoRef.current?.play();
          }
        } catch (error) {
          console.log('Autoplay prevented:', error);
        }
      };
      playVideo();
    } else {
      // Pause video when not active
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive, autoplay]);

  const fullVideoUrl = getMediaUrl(videoUrl);
  const fullThumbnailUrl = getMediaUrl(thumbnailUrl);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={fullVideoUrl}
        poster={fullThumbnailUrl}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline={playsInline}
        preload="auto"
        className="w-full h-full object-cover object-center"
        style={{ objectFit: 'cover' }}
        aria-label="Background video"
      />
      {/* Fallback if video fails to load */}
      {!fullVideoUrl && fullThumbnailUrl && (
        <img
          src={fullThumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover object-center"
        />
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Hero Item Component
// ----------------------------------------------------------------------
interface HeroSectionItemProps {
  heroSection: HeroSectionType;
  currentSlideIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onGoToSlide: (index: number) => void;
  priority?: boolean;
}

const HeroSectionItem: React.FC<HeroSectionItemProps> = ({
  heroSection,
  currentSlideIndex,
  onNavigate,
  onGoToSlide,
  priority = false
}) => {
  const { autoPlay, autoPlaySpeed, slides, showNavigation, showPagination } = heroSection;
  const hasMultipleSlides = slides.length > 1;
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoPlay || !hasMultipleSlides || isPaused) return;
    const interval = setInterval(() => {
      onNavigate('next');
    }, autoPlaySpeed || 5000);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlaySpeed, hasMultipleSlides, onNavigate, isPaused]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div 
      className="group relative w-full h-full rounded-lg overflow-hidden bg-gray-50 shadow-sm border border-gray-100/50 hover:shadow-xl transition-shadow duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full h-full">
        {currentSlide && (
          <div className="absolute inset-0 w-full h-full">
            {currentSlide.mediaType === 'video' ? (
              <VideoPlayer
                videoUrl={currentSlide.videoUrl || currentSlide.videoDetails?.url || ''}
                thumbnailUrl={currentSlide.thumbnailUrl || currentSlide.videoDetails?.thumbnailUrl || ''}
                isActive={true}
                autoplay={currentSlide.videoSettings?.autoplay ?? true}
                muted={currentSlide.videoSettings?.muted ?? true}
                loop={currentSlide.videoSettings?.loop ?? true}
                controls={currentSlide.videoSettings?.controls ?? false}
                playsInline={currentSlide.videoSettings?.playsInline ?? true}
              />
            ) : (
              currentSlide.image && (
                <img
                  src={getMediaUrl(currentSlide.image)}
                  alt={currentSlide.title}
                  fetchPriority={priority ? "high" : "auto"}
                  loading={priority ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-full object-cover object-center transform transition-transform duration-[300ms] scale-100 group-hover:scale-100"
                />
              )
            )}
            
            {/* Overlay Gradient (removed the dark overlay for cleaner look) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-30 duration-500 group-hover:opacity-20" />
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {showNavigation && hasMultipleSlides && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); onNavigate('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 hover:bg-white/30"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onNavigate('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 hover:bg-white/30"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {showPagination && hasMultipleSlides && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.preventDefault(); onGoToSlide(index); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlideIndex ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const HeroSection: React.FC = () => {
  const [heroSections, setHeroSections] = useState<HeroSectionType[]>([]);
  const [currentSlideIndices, setCurrentSlideIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveHeroSections = async () => {
      try {
        setLoading(true);
        const response = await heroSectionService.getActiveHeroSections();
        if (response.success && response.data.length > 0) {
          // Sort by order and take active sections
          const activeSections = response.data
            .filter((section: HeroSectionType) => section.isActive)
            .sort((a: HeroSectionType, b: HeroSectionType) => (a.order || 0) - (b.order || 0))
            .slice(0, 3);
          
          setHeroSections(activeSections);
          setCurrentSlideIndices(new Array(activeSections.length).fill(0));
        }
      } catch (err) {
        console.error("Failed to load hero sections:", err);
      } finally {
        setLoading(false);
      }
    };
    loadActiveHeroSections();
  }, []);

  const navigateSlide = useCallback((heroSectionIndex: number, direction: 'prev' | 'next') => {
    setCurrentSlideIndices(prev => {
      const newIndices = [...prev];
      const section = heroSections[heroSectionIndex];
      if (!section) return prev;
      
      const currentIndex = newIndices[heroSectionIndex];
      const length = section.slides.length;
      
      if (direction === 'next') {
        newIndices[heroSectionIndex] = (currentIndex + 1) % length;
      } else {
        newIndices[heroSectionIndex] = (currentIndex - 1 + length) % length;
      }
      return newIndices;
    });
  }, [heroSections]);

  const goToSlide = useCallback((heroSectionIndex: number, slideIndex: number) => {
    setCurrentSlideIndices(prev => {
      const newIndices = [...prev];
      newIndices[heroSectionIndex] = slideIndex;
      return newIndices;
    });
  }, []);

  // Show skeleton while loading
  if (loading) return <HeroSkeleton />;
  
  // Show nothing if no sections
  if (!heroSections.length) return null;

  return (
    <section className="relative w-full max-w-[1600px] mx-auto pt-4 px-2 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 w-full">
        {/* Main Hero (5 columns) */}
        {heroSections[0] && (
          <div className="lg:col-span-5 w-full aspect-video relative rounded-lg overflow-hidden shadow-sm">
            <HeroSectionItem
              heroSection={heroSections[0]}
              currentSlideIndex={currentSlideIndices[0] || 0}
              onNavigate={(dir) => navigateSlide(0, dir)}
              onGoToSlide={(idx) => goToSlide(0, idx)}
              priority={true}
            />
          </div>
        )}

        {/* Side Banners (2 columns, hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-2 flex-col gap-4 w-full h-full">
          {heroSections[1] && (
            <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-sm">
              <HeroSectionItem
                heroSection={heroSections[1]}
                currentSlideIndex={currentSlideIndices[1] || 0}
                onNavigate={(dir) => navigateSlide(1, dir)}
                onGoToSlide={(idx) => goToSlide(1, idx)}
                priority={false}
              />
            </div>
          )}

          {heroSections[2] && (
            <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-sm">
              <HeroSectionItem
                heroSection={heroSections[2]}
                currentSlideIndex={currentSlideIndices[2] || 0}
                onNavigate={(dir) => navigateSlide(2, dir)}
                onGoToSlide={(idx) => goToSlide(2, idx)}
                priority={false}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;