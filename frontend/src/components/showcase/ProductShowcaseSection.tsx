import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ShowcaseSection } from './showcaseSection';
// ✅ FIX: Reverted to your working import path
import ProductCard from './ProductCard'; 
import CountdownTimer from './CountdownTimer';

interface ProductShowcaseSectionProps {
  section: ShowcaseSection;
  className?: string;
  // ✅ ADDED: style prop is required for the fade-in animation to work
  style?: React.CSSProperties; 
}

const ProductShowcaseSection: React.FC<ProductShowcaseSectionProps> = ({
  section,
  className = '',
  style
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const {
    _id,
    title,
    subtitle,
    type,
    products,
    timerConfig,
    showViewAll,
    viewAllLink
  } = section;

  // Smooth scroll handler
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * 0.8;
      const newScrollLeft = direction === 'left' 
        ? carouselRef.current.scrollLeft - scrollAmount 
        : carouselRef.current.scrollLeft + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Safety check
  if (!products || products.length === 0) return null;

  return (
    // ✅ Applied style here so the Container's stagger animation works
    <section className={`py-8 ${className}`} style={style}>
      
      {/* --- Header --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div className="space-y-2">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
            <div className="flex justify-center items-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {title}
              </h2>
              {timerConfig.hasTimer && timerConfig.endDate && (
                <div className="m-2">
                  <CountdownTimer
                    endDate={timerConfig.endDate}
                    timerText={timerConfig.timerText}
                    className="text-black px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider"
                  />
                </div>
              )}
            </div>
          </div>
          
          {subtitle && (
            <p className="text-gray-500 text-sm lg:text-base max-w-2xl pl-5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          {showViewAll && (
            <Link 
              to={viewAllLink || `/products`}
              className="group flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-300"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
          
          {/* Carousel Navigation */}
          {type === 'carousel' && products.length > 4 && (
            <div className="hidden lg:flex items-center gap-2">
              <button 
                onClick={() => scrollCarousel('left')}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors duration-300 active:scale-95 flex items-center justify-center"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => scrollCarousel('right')}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors duration-300 active:scale-95 flex items-center justify-center"
                aria-label="Next products"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Content Grid/Carousel --- */}
      <div className="relative">
        {type === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.slice(0, 8).map((product) => (
              <div key={product._id}>
                {/* ✅ Added cardStyle="modern" because your working version had it */}
                <ProductCard
                  product={product}
                  // @ts-ignore
                  cardStyle="modern"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Carousel Layout */
          <div className="relative">
            <div
              ref={carouselRef}
              /* ✅ UPDATED CLASSNAMES:
                 1. Removed 'scrollbar-hide' (unless you have the plugin installed, this does nothing).
                 2. Added '[&::-webkit-scrollbar]:hidden' for Chrome/Safari/Edge.
                 3. Added '[-ms-overflow-style:none]' for IE/Edge.
                 4. Added '[scrollbar-width:none]' for Firefox.
              */
              className="flex gap-4 lg:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {products.map((product) => (
                <div 
                  key={product._id} 
                  className="min-w-[240px] md:min-w-[260px] lg:min-w-[280px] snap-start"
                >
                  <ProductCard 
                    product={product} 
                    // @ts-ignore
                    cardStyle="modern"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(ProductShowcaseSection);