// src/components/hero/HeroSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { heroSectionService, HeroSection as HeroSectionType } from '../admin/services/heroSectionService';
import { baseURL } from '../config/config';

// Get base URL from environment or config
const image_baseURL = import.meta.env.VITE_API_URL || baseURL;

// ----------------------------------------------------------------------
// 1. Premium Loading Skeleton
// Uses a shimmering gradient with refined border radius
// ----------------------------------------------------------------------
const HeroSkeleton: React.FC = () => {
  return (
    <div className="relative w-full mx-auto p-3 md:p-4 lg:p-6" style={{ maxWidth: '1600px' }}>
      
      {/* Main Layout Container */}
      <div className="flex flex-col md:flex-row w-full h-[500px] md:h-[450px] lg:h-[500px] gap-3 md:gap-4 lg:gap-6">
        
        {/* Left Large Skeleton */}
        <div className="w-full md:w-2/3 lg:w-3/4 h-full relative overflow-hidden rounded-2xl bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
        </div>
        
        {/* Right Split Skeleton */}
        <div className="flex flex-col w-full md:w-1/3 lg:w-1/4 gap-4 md:gap-6">
          <div className="flex-1 rounded-2xl bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" 
                 style={{ backgroundSize: '200% 100%', animationDelay: '0.1s' }} />
          </div>
          <div className="flex-1 rounded-2xl bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" 
                 style={{ backgroundSize: '200% 100%', animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get full image URL
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads')) return `${image_baseURL}${imagePath}`;
  return `${image_baseURL}/${imagePath}`;
};

// ----------------------------------------------------------------------
// 2. Modern Hero Item Component
// Handles the "Apple-like" motion, full-card linking, and glassmorphism
// ----------------------------------------------------------------------
interface HeroSectionItemProps {
  heroSection: HeroSectionType;
  currentSlideIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onGoToSlide: (index: number) => void;
}

const HeroSectionItem: React.FC<HeroSectionItemProps> = ({
  heroSection,
  currentSlideIndex,
  onNavigate,
  onGoToSlide
}) => {
  
  // Auto-play functionality
  useEffect(() => {
    if (!heroSection?.autoPlay || !heroSection.slides.length) return;
    const interval = setInterval(() => {
      onNavigate('next');
    }, heroSection.autoPlaySpeed);
    return () => clearInterval(interval);
  }, [heroSection, currentSlideIndex, onNavigate]);

  const hasMultipleSlides = heroSection.slides.length > 1;

  return (
    <div className="group relative w-full h-full rounded-2xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100/50 hover:shadow-xl transition-shadow duration-500">
      
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {heroSection.slides.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          
          return (
            <Link
              key={slide._id}
              to={slide.buttonLink || '#'}
              className={`
                absolute inset-0 block w-full h-full cursor-pointer
                transition-all duration-[800ms] cubic-bezier(0.2, 0.8, 0.2, 1)
                ${isActive ? 'opacity-100 z-10 translate-x-0' : 'opacity-0 z-0'}
              `}
              aria-label={slide.title}
            >
              {/* Image Container with Zoom Effect */}
              <div className="w-full h-full overflow-hidden relative">
                {slide.image ? (
                  <img
                    src={getImageUrl(slide.image)}
                    alt={slide.title}
                    className={`
                      w-full h-full object-cover transform transition-transform duration-[1200ms] cubic-bezier(0.2, 0.8, 0.2, 1)
                      ${isActive ? 'scale-100 group-hover:scale-105' : 'scale-105'}
                    `}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                )}

                {/* Subtle Gradient Overlay (Instead of full black) for text readability if needed later, 
                    currently just adds depth to the image edges */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 duration-500 group-hover:opacity-40" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* UI: Minimal Badge (Top Left) */}
      {/* <div className="absolute top-4 left-4 z-20">
        <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-sm">
          <span className="text-[10px] md:text-xs font-semibold tracking-wider text-white uppercase antialiased">
            {heroSection.name}
          </span>
        </div>
      </div> */}

      {/* Navigation: Glassmorphic Arrows (Only visible on hover) */}
      {heroSection.showNavigation && hasMultipleSlides && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); onNavigate('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 
                       w-10 h-10 rounded-full flex items-center justify-center 
                       bg-white/10 backdrop-blur-md border border-white/20 text-white 
                       opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0
                       transition-all duration-500 ease-out hover:bg-white/30 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.preventDefault(); onNavigate('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 
                       w-10 h-10 rounded-full flex items-center justify-center 
                       bg-white/10 backdrop-blur-md border border-white/20 text-white 
                       opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0
                       transition-all duration-500 ease-out hover:bg-white/30 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Pagination: Refined Dots */}
      {heroSection.showPagination && hasMultipleSlides && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {heroSection.slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.preventDefault(); onGoToSlide(index); }}
              className={`
                h-1.5 rounded-full transition-all duration-500 ease-out
                ${index === currentSlideIndex 
                  ? 'w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                  : 'w-1.5 bg-white/40 hover:bg-white/70'}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. Main Hero Section Controller
// Manages state and layout grid
// ----------------------------------------------------------------------
const HeroSection: React.FC = () => {
  const [heroSections, setHeroSections] = useState<HeroSectionType[]>([]);
  const [currentSlideIndices, setCurrentSlideIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadActiveHeroSections();
  }, []);

  const loadActiveHeroSections = async () => {
    try {
      setLoading(true);
      const response = await heroSectionService.getActiveHeroSections();
      if (response.success && response.data.length > 0) {
        const activeSections = response.data.filter(section => section.isActive);
        setHeroSections(activeSections);
        setCurrentSlideIndices(new Array(activeSections.length).fill(0));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hero sections');
    } finally {
      setLoading(false);
    }
  };

  const navigateSlide = useCallback((heroSectionIndex: number, direction: 'prev' | 'next') => {
    setCurrentSlideIndices(prev => {
      const newIndices = [...prev];
      const currentIndex = newIndices[heroSectionIndex];
      const slidesLength = heroSections[heroSectionIndex]?.slides.length || 0;
      
      if (direction === 'next') {
        newIndices[heroSectionIndex] = currentIndex === slidesLength - 1 ? 0 : currentIndex + 1;
      } else {
        newIndices[heroSectionIndex] = currentIndex === 0 ? slidesLength - 1 : currentIndex - 1;
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

  if (loading) return <HeroSkeleton />;

  if (error || heroSections.length === 0) {
    return null; // Return null to collapse section instead of showing ugly error box in production
  }

  const displaySections = heroSections.slice(0, 3);

  return (
    <section className="relative w-full max-w-[1600px] mx-auto pt-4 fade-in-up">
      {/* Layout Grid 
        Uses gap-4 for mobile, gap-6 for desktop for a breathable layout.
        Maintains the specific aspect ratios required by the logic.
      */}
      <div className="flex flex-col md:flex-row w-full h-[500px] md:h-[450px] lg:h-[500px] gap-2 md:gap-4">
        
        {/* Primary Hero (Left Side) */}
        {displaySections[0] && (
          <div className="w-full md:w-2/3 lg:w-3/4 h-full md:h-auto">
            <HeroSectionItem
              heroSection={displaySections[0]}
              currentSlideIndex={currentSlideIndices[0] || 0}
              onNavigate={(direction) => navigateSlide(0, direction)}
              onGoToSlide={(slideIndex) => goToSlide(0, slideIndex)}
            />
          </div>
        )}

        {/* Secondary Heroes (Right Side) */}
        <div className="flex flex-col w-full md:w-1/3 lg:w-1/4 gap-4 md:gap-6">
          
          {/* Top Right */}
          {displaySections[1] && (
            <div className="flex-1 h-1/2">
              <HeroSectionItem
                heroSection={displaySections[1]}
                currentSlideIndex={currentSlideIndices[1] || 0}
                onNavigate={(direction) => navigateSlide(1, direction)}
                onGoToSlide={(slideIndex) => goToSlide(1, slideIndex)}
              />
            </div>
          )}

          {/* Bottom Right */}
          {displaySections[2] && (
            <div className="flex-1 h-1/2">
              <HeroSectionItem
                heroSection={displaySections[2]}
                currentSlideIndex={currentSlideIndices[2] || 0}
                onNavigate={(direction) => navigateSlide(2, direction)}
                onGoToSlide={(slideIndex) => goToSlide(2, slideIndex)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Optional: Add a custom style tag for the shimmer animation if not in tailwind.config */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;