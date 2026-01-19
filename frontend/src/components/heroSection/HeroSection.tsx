// src/components/hero/HeroSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { heroSectionService, HeroSection as HeroSectionType } from '../admin/services/heroSectionService';
import { baseURL } from '../config/config';

const image_baseURL = import.meta.env.VITE_API_URL || baseURL;

// ----------------------------------------------------------------------
// Helper: Get Image URL
// ----------------------------------------------------------------------
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads')) return `${image_baseURL}${imagePath}`;
  return `${image_baseURL}/${imagePath}`;
};

// ----------------------------------------------------------------------
// Skeleton Loader (Updated to match 66% / 33% split)
// ----------------------------------------------------------------------
const HeroSkeleton: React.FC = () => {
  return (
    <div className="relative w-full mx-auto p-4 max-w-[1600px] animate-pulse">
      {/* ✅ FIX: Changed grid-cols-4 to grid-cols-3 for wider right side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {/* Main Hero Skeleton */}
        {/* ✅ FIX: Changed col-span-3 to col-span-2 */}
        <div className="lg:col-span-2 w-full aspect-video bg-gray-200 rounded-lg" />
        
        {/* Side Banners Skeleton */}
        <div className="lg:col-span-1 flex flex-col gap-4 w-full h-full hidden lg:flex">
          <div className="flex-1 bg-gray-200 rounded-lg" />
          <div className="flex-1 bg-gray-200 rounded-lg" />
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
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
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
          
          if (!isActive && !isNext) return null;

          const imageUrl = getImageUrl(slide.image);
          const Wrapper = isActive ? Link : 'div';
          
          const commonClasses = `
            absolute inset-0 w-full h-full
            transition-opacity duration-[800ms] cubic-bezier(0.2, 0.8, 0.2, 1)
            ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}
          `;

          const linkProps = isActive ? { 
            to: slide.buttonLink || '#',
            'aria-label': slide.title,
            tabIndex: 0 
          } : {
            'aria-hidden': true 
          };

          return (
            <Wrapper key={slide._id} className={commonClasses} {...linkProps}>
              <div className="w-full h-full overflow-hidden relative">
                {slide.image ? (
                  <img
                    src={imageUrl}
                    alt={isActive ? slide.title : ''}
                    fetchPriority={isActive && priority ? "high" : "auto"}
                    loading={isActive && priority ? "eager" : "lazy"}
                    decoding="async"
                    width={1247} 
                    height={589}
                    className={`
                      w-full h-full object-cover object-center transform transition-transform duration-[300ms]
                      ${isActive ? 'scale-100 group-hover:scale-100' : 'scale-100'}
                    `}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
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
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onNavigate('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 hover:bg-white/30"
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
          const activeSections = response.data.filter(section => section.isActive).slice(0, 3);
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
 <section className="relative w-full max-w-[1600px] mx-auto pt-4 px-2 animate-fade-in-up">
  
  <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 w-full">
    
    {/* === MAIN HERO (LEFT) === */}
    {/* Always visible */}
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

    {/* === SIDE BANNERS (RIGHT) === */}
    {/* ✅ FIX: Added 'hidden' (default) and 'lg:flex' (desktop only) */}
    {/* This completely removes them from the DOM on mobile & tablet */}
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