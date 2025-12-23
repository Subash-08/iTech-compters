// src/components/hero/HeroSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { heroSectionService, HeroSection as HeroSectionType } from '../admin/services/heroSectionService';
import { baseURL } from '../config/config';

const image_baseURL = import.meta.env.VITE_API_URL || baseURL;

// ----------------------------------------------------------------------
// ✅ FIX 1: Honest Image URL Helper
// Removed fake query params. If you add Cloudinary later, re-add logic here.
// ----------------------------------------------------------------------
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // Return the raw URL. 
  // NOTE: Only add ?w=1600 if your backend/CDN explicitly supports dynamic resizing.
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads')) return `${image_baseURL}${imagePath}`;
  return `${image_baseURL}/${imagePath}`;
};

// ----------------------------------------------------------------------
// Simple Skeleton (Tailwind animate-pulse)
// ----------------------------------------------------------------------
const HeroSkeleton: React.FC = () => {
  return (
    <div className="relative w-full mx-auto p-3 md:p-4 lg:p-6 max-w-[1600px]">
      <div className="flex flex-col md:flex-row w-full h-[500px] md:h-[450px] lg:h-[500px] gap-3 md:gap-4 lg:gap-6">
        <div className="w-full md:w-2/3 lg:w-3/4 h-full rounded-lg bg-gray-200 animate-pulse" />
        <div className="flex flex-col w-full md:w-1/3 lg:w-1/4 gap-4 md:gap-6">
          <div className="flex-1 rounded-lg bg-gray-200 animate-pulse" />
          <div className="flex-1 rounded-lg bg-gray-200 animate-pulse delay-75" />
        </div>
      </div>
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
  const { autoPlay, autoPlaySpeed, slides } = heroSection;
  const hasMultipleSlides = slides.length > 1;
  
  // ✅ FIX 5: UX Improvement - Pause on Hover
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Stop if disabled, single slide, or user is hovering
    if (!autoPlay || !hasMultipleSlides || isPaused) return;
    
    const interval = setInterval(() => {
      onNavigate('next');
    }, autoPlaySpeed || 5000);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlaySpeed, hasMultipleSlides, onNavigate, isPaused]);

  return (
    <div 
      className="group relative w-full h-full rounded-lg overflow-hidden bg-gray-50 shadow-sm border border-gray-100/50 hover:shadow-xl transition-shadow duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const isNext = index === (currentSlideIndex + 1) % slides.length;
          
          // Render only active (visible) and next (preload)
          if (!isActive && !isNext) return null;

          const imageUrl = getImageUrl(slide.image);

          // ✅ FIX 2: Accessibility & DOM Hygiene
          // If active -> Render clickable Link
          // If next (hidden) -> Render inert div (Preload only)
          const Wrapper = isActive ? Link : 'div';
          
          const commonClasses = `
            absolute inset-0 w-full h-full
            transition-opacity duration-[800ms] cubic-bezier(0.2, 0.8, 0.2, 1)
            ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}
          `;

          // Props specific to Link
          const linkProps = isActive ? { 
            to: slide.buttonLink || '#',
            'aria-label': slide.title,
            tabIndex: 0 
          } : {
            'aria-hidden': true // Hide from screen readers if preloading
          };

          return (
            <Wrapper
              key={slide._id}
              className={commonClasses}
              {...linkProps}
            >
              <div className="w-full h-full overflow-hidden relative">
                {slide.image ? (
                  <img
                    src={imageUrl}
                    alt={isActive ? slide.title : ''} // Remove alt for hidden preload
                    
                    // LCP Optimization for Active Slide Only
                    fetchPriority={isActive && priority ? "high" : "auto"}
                    loading={isActive && priority ? "eager" : "lazy"}
                    decoding="async"
                    
                    // Explicit dimensions for CLS
                    width={1247} 
                    height={589}
                    
                    className={`
                      w-full h-full object-cover transform transition-transform duration-[300ms]
                      ${isActive ? 'scale-100 group-hover:scale-100' : 'scale-100'}
                    `}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 duration-500 group-hover:opacity-40" />
              </div>
            </Wrapper>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {heroSection.showNavigation && hasMultipleSlides && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); onNavigate('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 hover:bg-white/30"
            aria-label="Previous Slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onNavigate('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 hover:bg-white/30"
            aria-label="Next Slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {heroSection.showPagination && hasMultipleSlides && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.preventDefault(); onGoToSlide(index); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlideIndex ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Controller
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
          // ✅ FIX 4: Optimize Memory - Slice BEFORE storing in state
          // Even if backend sends 100 items, we only keep the 3 we use.
          const activeSections = response.data
            .filter(section => section.isActive)
            .slice(0, 3);
            
          setHeroSections(activeSections);
          setCurrentSlideIndices(new Array(activeSections.length).fill(0));
        }
      } catch (err) {
        console.error("Failed to load hero", err);
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

  if (loading) return <HeroSkeleton />;
  if (!heroSections.length) return null;

  return (
    <section className="relative w-full max-w-[1600px] mx-auto pt-4 animate-fade-in-up">
      <div className="flex flex-col md:flex-row w-full h-[500px] md:h-[450px] lg:h-[500px] gap-2 md:gap-4 px-2">
        
        {/* Main Hero (Left - LCP Candidate) */}
        {heroSections[0] && (
          <div className="w-full md:w-2/3 lg:w-3/4 h-full md:h-auto">
            <HeroSectionItem
              heroSection={heroSections[0]}
              currentSlideIndex={currentSlideIndices[0] || 0}
              onNavigate={(dir) => navigateSlide(0, dir)}
              onGoToSlide={(idx) => goToSlide(0, idx)}
              priority={true} 
            />
          </div>
        )}

        {/* Secondary Heroes (Right) */}
        <div className="flex flex-col w-full md:w-1/3 lg:w-1/4 gap-4 md:gap-6">
          {heroSections[1] && (
            <div className="flex-1 h-1/2">
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
            <div className="flex-1 h-1/2">
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