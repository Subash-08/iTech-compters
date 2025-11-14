// src/components/showcase/ProductShowcaseSection.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ShowcaseSection } from './showcaseSection';
import ProductCard from './ProductCard';
import CountdownTimer from './CountdownTimer';

interface ProductShowcaseSectionProps {
  section: ShowcaseSection;
  className?: string;
}

const ProductShowcaseSection: React.FC<ProductShowcaseSectionProps> = ({
  section,
  className = ''
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const {
    _id,
    title,
    subtitle,
    type,
    products,
    timerConfig,
    styleConfig,
    showViewAll,
    viewAllLink
  } = section;

  // Auto-advance carousel
  useEffect(() => {
    if (type !== 'carousel' || products.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.ceil(products.length / 4));
    }, 5000);

    return () => clearInterval(interval);
  }, [type, products.length]);

  const handlePrev = () => {
    if (type === 'carousel' && carouselRef.current) {
      carouselRef.current.scrollBy({ left: -carouselRef.current.offsetWidth, behavior: 'smooth' });
    }
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (type === 'carousel' && carouselRef.current) {
      carouselRef.current.scrollBy({ left: carouselRef.current.offsetWidth, behavior: 'smooth' });
    }
    setCurrentSlide(prev => Math.min(Math.ceil(products.length / 4) - 1, prev + 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (type !== 'carousel') return;
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - (carouselRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (type !== 'carousel') return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - (carouselRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const getSectionClasses = () => {
    const baseClasses = "relative overflow-hidden rounded-xl p-4 transition-all duration-300";
    
    const backgroundClasses = {
      modern: "bg-white shadow-sm border border-gray-100",
      minimal: "bg-white border border-gray-200",
      elegant: "bg-white shadow-sm border border-gray-100",
      bold: "bg-gray-900 text-white shadow-md",
      glass: "bg-white/80 backdrop-blur-sm border border-white/20",
      gradient: "bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm"
    };

    return `${baseClasses} ${backgroundClasses[styleConfig.cardStyle]} ${className}`;
  };

  // Get the actual view all link
  const getViewAllLink = () => {
    if (viewAllLink) return viewAllLink;
    return `/section/${_id}`; // Default link to section detail page
  };

  if (!products || products.length === 0) return null;

  return (
    <section className={getSectionClasses()} style={{ 
      backgroundColor: styleConfig.backgroundColor,
      color: styleConfig.textColor
    }}>
      {/* Header - Compact */}
      <div className="relative z-10 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          {/* Title and Timer Section */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900">
              {title}
            </h2>
            
            {/* Timer - Aligned with title */}
            {timerConfig.hasTimer && timerConfig.endDate && (
              <CountdownTimer
                endDate={timerConfig.endDate}
                timerText={timerConfig.timerText}
                className="bg-gradient-to-r from-grey-500 to-white-500 text-white px-2 py-1 rounded text-xs font-medium"
              />
            )}
          </div>

          {/* View All Button and Subtitle */}
          <div className="flex items-center gap-3">
            {/* Subtitle - Only show if there's space */}
            {subtitle && (
              <p className="text-gray-600 text-sm hidden sm:block max-w-xs truncate">
                {subtitle}
              </p>
            )}
            
            {/* View All Button */}
            {showViewAll && (
              <Link 
                to={getViewAllLink()}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Subtitle for mobile */}
        {subtitle && (
          <p className="text-gray-600 text-sm sm:hidden mb-2">
            {subtitle}
          </p>
        )}

        {/* Progress Bar for Carousel */}
        {type === 'carousel' && products.length > 4 && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 w-5'
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Products Grid/Carousel - Reduced height */}
      <div className="relative z-10">
        {type === 'grid' ? (
          // Grid Layout - Compact
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.slice(0, 8).map((product, index) => ( // Limit to 8 products for compact view
              <ProductCard
                key={product._id}
                product={product}
                cardStyle={styleConfig.cardStyle}
                animation={styleConfig.animation}
                onQuickView={(product) => console.log('Quick view:', product)}
                onAddToCart={(product) => console.log('Add to cart:', product)}
                onAddToWishlist={(product) => console.log('Add to wishlist:', product)}
              />
            ))}
          </div>
        ) : (
          // Carousel Layout - Compact
          <div className="relative">
            {/* Navigation Arrows - Smaller */}
            {products.length > 4 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white border border-gray-200"
                >
                  <ChevronLeft className="w-3 h-3 text-gray-700" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white border border-gray-200"
                >
                  <ChevronRight className="w-3 h-3 text-gray-700" />
                </button>
              </>
            )}

            {/* Carousel Container - Compact */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {products.slice(0, 8).map((product, index) => ( // Limit to 8 products
                <div
                  key={product._id}
                  className="flex-none w-64 snap-start" // More compact width
                >
                  <ProductCard
                    product={product}
                    cardStyle={styleConfig.cardStyle}
                    animation={styleConfig.animation}
                    onQuickView={(product) => console.log('Quick view:', product)}
                    onAddToCart={(product) => console.log('Add to cart:', product)}
                    onAddToWishlist={(product) => console.log('Add to wishlist:', product)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subtle Background Elements - Smaller */}
      <div className="absolute top-1 right-1 w-8 h-8 bg-blue-500/5 rounded-full blur-sm" />
      <div className="absolute bottom-1 left-1 w-6 h-6 bg-purple-500/5 rounded-full blur-sm" />
    </section>
  );
};

export default ProductShowcaseSection;