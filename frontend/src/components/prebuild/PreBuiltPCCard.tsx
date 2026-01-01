// components/prebuilt/PreBuiltPCCard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PreBuiltPC } from '../../redux/types/preBuiltPCTypes';
import { baseURL } from '../config/config';
import PreBuiltPCAddToCartButton from './PreBuiltPCAddToCartButton';
import PreBuiltPCAddToWishlistButton from './PreBuiltPCAddToWishlistButton';

// Utility to resolve image URLs
const getImageUrl = (url: string): string => {
  if (!url) return 'https://placehold.co/300x300?text=No+Image';
  if (url.startsWith('http')) return url;
  const baseUrl = baseURL;
  return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
};

interface PreBuiltPCCardProps {
  pc?: PreBuiltPC;
  className?: string;
}

const PreBuiltPCCard: React.FC<PreBuiltPCCardProps> = ({ pc, className = '' }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [currentImgSrc, setCurrentImgSrc] = useState<string>('');

  // Initial setup for image
  useEffect(() => {
    if (pc?.images && pc.images.length > 0) {
      setCurrentImgSrc(getImageUrl(pc.images[0]?.url));
    } else {
      setCurrentImgSrc('https://placehold.co/300x300?text=No+Image');
    }
    setHasImageError(false);
  }, [pc]);

  if (!pc) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse ${className}`}>
        <div className="h-64 bg-gray-100"></div>
        <div className="p-5 space-y-3">
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          <div className="h-6 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Safe data extraction
  const safePC = {
    _id: pc._id || 'unknown',
    name: pc.name || 'Pre-built PC',
    slug: pc.slug || pc._id || 'unknown',
    basePrice: pc.basePrice || pc.totalPrice || 0,
    offerPrice: pc.offerPrice || pc.discountPrice || pc.totalPrice || pc.basePrice || 0,
    discountPercentage: pc.discountPercentage || 0,
    images: pc.images || [],
    category: pc.category || 'Gaming PC',
    stockQuantity: pc.stockQuantity || 0,
    averageRating: pc.averageRating || 0,
  };

  // Pricing Logic
  const basePrice = safePC.basePrice;
  const offerPrice = safePC.offerPrice;
  const discountPercentage = safePC.discountPercentage > 0 
    ? safePC.discountPercentage 
    : (offerPrice < basePrice ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0);
  const discount = discountPercentage;
  const inStock = safePC.stockQuantity > 0;

  const productUrl = `/prebuilt-pcs/${safePC.slug}`;

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div 
      className={`group relative flex flex-col h-full bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50 ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      
      {/* --- Image Section (Aspect 4:3 for Tech) --- */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden p-6">
        
        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
              -{discount}%
            </span>
          )}
          {!inStock && (
            <span className="inline-block bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist - Top Right */}
        <div className="absolute top-3 right-3 z-20">
          <PreBuiltPCAddToWishlistButton 
            pcId={safePC._id}
            pcData={safePC}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            size="sm"
          />
        </div>

        {/* Image Display */}
        <Link to={productUrl} className="block w-full h-full relative z-10">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={currentImgSrc}
              alt={safePC.name}
              className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (!hasImageError) {
                   setHasImageError(true);
                   setCurrentImgSrc('https://placehold.co/300x300?text=No+Image');
                   setImageLoaded(true);
                }
              }}
            />
          </div>
        </Link>
      </div>

      {/* --- Details Section --- */}
      <div className="flex flex-col flex-1 p-5">
        
        {/* Category / Brand Label */}
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 truncate">
          {safePC.category}
        </div>

        {/* Title */}
        <Link to={productUrl} className="block group/title mb-1">
          <h3 className="text-[15px] font-medium text-gray-900 leading-[1.35] line-clamp-2 min-h-[2.5rem] group-hover/title:text-blue-600 transition-colors">
            {safePC.name}
          </h3>
        </Link>


        {/* --- Footer (Price Top, Button Bottom) --- */}
        <div className="mt-auto pt-2 border-t border-dashed border-gray-100">
          
          {/* Price Block */}
          <div className="mb-3">
             <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(offerPrice)}
                </span>
                {discount > 0 && basePrice > offerPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(basePrice)}
                  </span>
                )}
             </div>
             {inStock && (
                <div className="text-[10px] text-green-600 font-medium mt-0.5">
                   In Stock
                </div>
             )}
          </div>

          {/* Button Block - Full Width & Below Price */}
          <PreBuiltPCAddToCartButton
            pcId={safePC._id}
            product={safePC}
            disabled={!inStock}
            className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm flex items-center justify-center gap-2 ${
              inStock 
                ? 'bg-black text-white hover:bg-gray-800 hover:shadow-md' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {inStock ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Add to Cart</span>
              </>
            ) : 'Sold Out'}
          </PreBuiltPCAddToCartButton>
          
        </div>

      </div>
    </div>
  );
};

export default PreBuiltPCCard;