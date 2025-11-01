// src/components/hero/HeroSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { heroSectionService, HeroSection as HeroSectionType } from '../admin/services/heroSectionService';
import { baseURL } from '../config/config';

// Get base URL from environment or config
const image_baseURL = import.meta.env.VITE_API_URL || baseURL;

// Loading skeleton component
const HeroSkeleton: React.FC = () => {
  return (
    <div className="w-full h-[500px] md:h-[450px] lg:h-[500px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-xl">
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <div className="h-8 bg-gray-300 rounded-lg mb-4 w-3/4"></div>
          <div className="h-6 bg-gray-300 rounded-lg mb-6 w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded-lg mb-8 w-full"></div>
          <div className="h-12 bg-gray-300 rounded-lg w-40"></div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get full image URL
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('/uploads')) {
    return `${image_baseURL}${imagePath}`;
  }
  
  return `${image_baseURL}/${imagePath}`;
};

// Individual hero section component
interface HeroSectionItemProps {
  heroSection: HeroSectionType;
  layoutType: 'left-full' | 'right-top' | 'right-bottom';
  currentSlideIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onGoToSlide: (index: number) => void;
}

const HeroSectionItem: React.FC<HeroSectionItemProps> = ({
  heroSection,
  layoutType,
  currentSlideIndex,
  onNavigate,
  onGoToSlide
}) => {
  // Get layout configuration
  const getLayoutConfig = () => {
    switch (layoutType) {
      case 'left-full':
        return {
          container: "w-full h-full rounded-lg overflow-hidden",
          content: "justify-start items-start md:items-center pt-6 md:pt-8 lg:pt-12 pl-4 md:pl-6 lg:pl-12",
          alignment: "items-start md:items-left text-left",
          titleSize: "text-xl md:text-2xl lg:text-4xl xl:text-5xl",
          descriptionSize: "text-xs md:text-sm lg:text-base xl:text-lg",
          buttonSize: "px-3 py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3 text-xs md:text-sm lg:text-base",
          maxWidth: "max-w-[200px] md:max-w-xs lg:max-w-md"
        };
      case 'right-top':
        return {
          container: "w-full h-full rounded-lg overflow-hidden",
          content: "justify-start items-start pt-4 md:pt-6 lg:pt-8 pl-3 md:pl-4 lg:pl-6 xl:pl-8",
          alignment: "items-start text-left",
          titleSize: "text-lg md:text-xl lg:text-2xl xl:text-3xl",
          descriptionSize: "text-xs md:text-sm lg:text-base",
          buttonSize: "px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 text-xs md:text-sm",
          maxWidth: "max-w-[150px] md:max-w-[180px] lg:max-w-xs"
        };
      case 'right-bottom':
        return {
          container: "w-full h-full rounded-lg overflow-hidden",
          content: "justify-start items-start pt-4 md:pt-6 lg:pt-8 pl-3 md:pl-4 lg:pl-6 xl:pl-8",
          alignment: "items-start text-left",
          titleSize: "text-lg md:text-xl lg:text-2xl xl:text-3xl",
          descriptionSize: "text-xs md:text-sm lg:text-base",
          buttonSize: "px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 text-xs md:text-sm",
          maxWidth: "max-w-[150px] md:max-w-[180px] lg:max-w-xs"
        };
      default:
        return {
          container: "w-full h-full rounded-lg overflow-hidden",
          content: "justify-center items-center",
          alignment: "items-center text-center",
          titleSize: "text-xl md:text-2xl lg:text-3xl",
          descriptionSize: "text-xs md:text-sm lg:text-base",
          buttonSize: "px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm",
          maxWidth: "max-w-[200px] md:max-w-xs"
        };
    }
  };

  const layout = getLayoutConfig();
  const currentSlide = heroSection.slides[currentSlideIndex] || heroSection.slides[0];

  // Auto-play functionality for this hero section
  useEffect(() => {
    if (!heroSection?.autoPlay || !heroSection.slides.length) return;

    const interval = setInterval(() => {
      onNavigate('next');
    }, heroSection.autoPlaySpeed);

    return () => clearInterval(interval);
  }, [heroSection, currentSlideIndex, onNavigate]);

  return (
    <div className={`relative ${layout.container} bg-gray-100 shadow-lg`}>
      
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {heroSection.slides.map((slide, index) => (
          <div
            key={slide._id}
            className={`
              absolute inset-0 transition-all duration-700 ease-out transform
              ${index === currentSlideIndex 
                ? 'translate-x-0 opacity-100 scale-100' 
                : index < currentSlideIndex 
                  ? '-translate-x-full opacity-0 scale-95' 
                  : 'translate-x-full opacity-0 scale-95'
              }
            `}
            style={{
              transition: 'all 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              willChange: 'transform, opacity'
            }}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              {slide.image && (
                <>
                  <img
                    src={getImageUrl(slide.image)}
                    alt={slide.title}
                    className="w-full h-full object-cover transform transition-transform duration-1000"
                    style={{
                      transform: index === currentSlideIndex ? 'scale(1.05)' : 'scale(1)'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                </>
              )}
              
              {/* Fallback Background */}
              {!slide.image && (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
              )}
            </div>

            {/* Content Container */}
            <div className={`relative z-20 w-full h-full flex ${layout.content}`}>
              <div className={`flex flex-col ${layout.alignment} space-y-1 md:space-y-2 lg:space-y-3 ${layout.maxWidth}`}>
                
                {/* Title */}
                <h1 
                  className={`${layout.titleSize} font-bold leading-tight transition-all duration-1000 delay-300`}
                  style={{ 
                    color: slide.textColor || '#ffffff',
                    transform: index === currentSlideIndex ? 'translateY(0)' : 'translateY(20px)',
                    opacity: index === currentSlideIndex ? 1 : 0
                  }}
                >
                  {slide.title}
                </h1>

                {/* Description */}
                {slide.description && (
                  <p 
                    className={`${layout.descriptionSize} font-light max-w-full transition-all duration-1000 delay-500`}
                    style={{ 
                      color: slide.textColor || '#ffffff',
                      transform: index === currentSlideIndex ? 'translateY(0)' : 'translateY(20px)',
                      opacity: index === currentSlideIndex ? 1 : 0
                    }}
                  >
                    {slide.description}
                  </p>
                )}

                {/* Button */}
                {slide.buttonText && (
                  <div className="transition-all duration-1000 delay-700"
                    style={{
                      transform: index === currentSlideIndex ? 'translateY(0)' : 'translateY(20px)',
                      opacity: index === currentSlideIndex ? 1 : 0
                    }}
                  >
                    <Link
                      to={slide.buttonLink || '#'}
                      className={`inline-flex items-center ${layout.buttonSize} font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent`}
                      style={{
                        backgroundColor: slide.textColor || '#ffffff',
                        color: slide.backgroundColor || '#1a365d',
                      }}
                    >
                      {slide.buttonText}
                      <svg className="w-3 h-3 md:w-3 md:h-3 lg:w-4 lg:h-4 ml-1 md:ml-1 lg:ml-2 transform group-hover:translate-x-0.5 lg:group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {heroSection.showNavigation && heroSection.slides.length > 1 && (
        <>
          <button
            onClick={() => onNavigate('prev')}
            className="absolute left-1 md:left-2 lg:left-3 top-1/2 transform -translate-y-1/2 z-30 w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
          >
            <svg className="w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => onNavigate('next')}
            className="absolute right-1 md:right-2 lg:right-3 top-1/2 transform -translate-y-1/2 z-30 w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
          >
            <svg className="w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {heroSection.showPagination && heroSection.slides.length > 1 && (
        <div className="absolute bottom-1 md:bottom-2 lg:bottom-3 left-1/2 transform -translate-x-1/2 z-30 flex space-x-1 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1 md:px-2 md:py-1 lg:px-3 lg:py-2">
          {heroSection.slides.map((_, index) => (
            <button
              key={index}
              onClick={() => onGoToSlide(index)}
              className={`w-1.5 h-1.5 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 rounded-full transition-all ${
                index === currentSlideIndex ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Hero Section Name Badge */}
      <div className="absolute top-1 md:top-2 lg:top-3 left-1 md:left-2 lg:left-3 z-30 bg-black/30 backdrop-blur-md rounded-lg md:rounded-lg lg:rounded-xl px-2 py-1 md:px-2 md:py-1 lg:px-3 lg:py-2 border border-white/20">
        <div className="text-white text-xs md:text-xs lg:text-sm font-medium">{heroSection.name}</div>
      </div>
    </div>
  );
};

// Main Hero Section Component
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
        // Initialize slide indices for each hero section
        setCurrentSlideIndices(new Array(activeSections.length).fill(0));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hero sections');
      console.error('Hero sections load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation for individual hero sections
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

  if (loading) {
    return <HeroSkeleton />;
  }

  if (error || heroSections.length === 0) {
    return (
      <div className="w-full h-[500px] md:h-[450px] lg:h-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center rounded-2xl m-4">
        <div className="text-center">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Content Coming Soon</h3>
          <p className="text-sm md:text-base text-gray-600 mb-4">{error || 'No active hero sections found'}</p>
          <button 
            onClick={loadActiveHeroSections}
            className="px-4 py-2 md:px-6 md:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm md:text-base"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have exactly 3 hero sections for the layout
  const displaySections = heroSections.slice(0, 3);

  return (
    <div className="relative w-full mx-auto p-3 md:p-4 lg:p-6" style={{ maxWidth: '1600px' }}>
      
      {/* Main Layout Container */}
      <div className="flex flex-col md:flex-row w-full h-[500px] md:h-[450px] lg:h-[500px] gap-3 md:gap-4 lg:gap-6">
        
        {/* Left Side - First Hero Section */}
        {displaySections[0] && (
          <div className="w-full md:w-2/3 lg:w-3/4 h-full md:h-auto">
            <HeroSectionItem
              heroSection={displaySections[0]}
              layoutType="left-full"
              currentSlideIndex={currentSlideIndices[0] || 0}
              onNavigate={(direction) => navigateSlide(0, direction)}
              onGoToSlide={(slideIndex) => goToSlide(0, slideIndex)}
            />
          </div>
        )}

        {/* Right Side Container - Visible on tablet and desktop */}
        <div className="flex flex-col w-full md:w-1/3 lg:w-1/4 gap-3 md:gap-4 lg:gap-6">
          
          {/* Top Right - Second Hero Section */}
          {displaySections[1] && (
            <div className="flex-1 h-1/2">
              <HeroSectionItem
                heroSection={displaySections[1]}
                layoutType="right-top"
                currentSlideIndex={currentSlideIndices[1] || 0}
                onNavigate={(direction) => navigateSlide(1, direction)}
                onGoToSlide={(slideIndex) => goToSlide(1, slideIndex)}
              />
            </div>
          )}

          {/* Bottom Right - Third Hero Section */}
          {displaySections[2] && (
            <div className="flex-1 h-1/2">
              <HeroSectionItem
                heroSection={displaySections[2]}
                layoutType="right-bottom"
                currentSlideIndex={currentSlideIndices[2] || 0}
                onNavigate={(direction) => navigateSlide(2, direction)}
                onGoToSlide={(slideIndex) => goToSlide(2, slideIndex)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;