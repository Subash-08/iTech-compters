// components/prebuilt/PreBuiltPCCard.tsx - ENHANCED VERSION
import React from 'react';
import { Link } from 'react-router-dom';
import { PreBuiltPC } from '../../redux/types/preBuiltPCTypes';
import AddToWishlistButton from '../product/AddToWishlistButton';
import AddToCartButton from '../product/AddToCartButton';
import { useAppSelector } from '../../redux/hooks';
import { selectIsAuthenticated } from '../../redux/selectors';
import { Star, Shield, Cpu, TrendingUp, Zap, Monitor } from 'lucide-react';
import { baseURL } from '../config/config';
import PreBuiltPCAddToCartButton from './PreBuiltPCAddToCartButton';

  const getImageUrl = (url: string): string => {
    if (!url) return 'https://placehold.co/300x300?text=No+Image';

    // Already full URL (e.g., Cloudinary)
    if (url.startsWith('http')) return url;

    // Serve relative to backend (same server)
    const baseUrl = process.env.NODE_ENV === 'production'
      ? ''  // 👈 relative path
      : baseURL; // 👈 local backend

    return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  };
interface PreBuiltPCCardProps {
  pc?: PreBuiltPC; // Make optional to prevent crashes
  className?: string;
}

const PreBuiltPCCard: React.FC<PreBuiltPCCardProps> = ({ pc, className = '' }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // 🛑 CRITICAL: Safe access with fallbacks
  if (!pc) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse ${className}`}>
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded mb-3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Safe data extraction with comprehensive fallbacks
  const safePC = {
    _id: pc._id || 'unknown',
    name: pc.name || 'Pre-built PC',
    slug: pc.slug || pc._id || 'unknown',
    basePrice: pc.basePrice || pc.totalPrice || 0,
    offerPrice: pc.offerPrice || pc.discountPrice || pc.totalPrice || pc.basePrice || 0,
    discountPercentage: pc.discountPercentage || 0,
    images: pc.images || [],
    components: pc.components || [],
    category: pc.category || 'Gaming PC',
    condition: pc.condition || 'New',
    stockQuantity: pc.stockQuantity || 0,
    averageRating: pc.averageRating || 0,
    totalReviews: pc.totalReviews || 0,
    performanceRating: pc.performanceRating || 0,
    featured: pc.featured || false,
    isTested: pc.isTested || false,
    warranty: pc.warranty || '1 Year',
    performanceSummary: pc.performanceSummary,
    benchmarkTests: pc.benchmarkTests || []
  };

  // Calculate pricing
  const basePrice = safePC.basePrice;
  const offerPrice = safePC.offerPrice;
  const discountPercentage = safePC.discountPercentage > 0 
    ? safePC.discountPercentage 
    : (offerPrice < basePrice ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0);
  
  const hasDiscount = discountPercentage > 0;
  const savings = basePrice - offerPrice;

  // Get main image safely
  const mainImage = safePC.images.length > 0 
    ? getImageUrl(safePC.images[0]?.url)
    : getImageUrl('/uploads/default-pc.jpg');

  // Get key components
  const cpuComponent = safePC.components.find(comp => comp.partType === 'CPU');
  const gpuComponent = safePC.components.find(comp => comp.partType === 'GPU');
  const ramComponent = safePC.components.find(comp => comp.partType === 'RAM');
  const mainComponents = [cpuComponent, gpuComponent, ramComponent].filter(Boolean);

  // Performance indicators
  const performanceLevel = Math.min(Math.floor(safePC.performanceRating / 2), 5);
  const isInStock = safePC.stockQuantity > 0;
  const isLowStock = safePC.stockQuantity > 0 && safePC.stockQuantity <= 5;

  return (
    <div className={`group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 ${className}`}>
      
      {/* Image Section with Overlays */}
      <div className="relative overflow-hidden">
        <Link to={`/prebuilt-pcs/${safePC.slug}`}>
          <img
            src={mainImage}
            alt={safePC.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageUrl('/uploads/default-pc.jpg');
            }}
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </Link>
        
        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {safePC.featured && (
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
              {discountPercentage}% OFF
            </span>
          )}
          {safePC.isTested && (
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Benchmarked
            </span>
          )}
        </div>

        {/* Top Right Condition */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm ${
            safePC.condition === 'New' 
              ? 'bg-green-500/90 text-white'
              : safePC.condition === 'Refurbished'
              ? 'bg-yellow-500/90 text-white'
              : 'bg-gray-500/90 text-white'
          }`}>
            {safePC.condition}
          </span>
        </div>

        {/* Bottom Left Performance */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
            <Monitor className="w-3 h-3" />
            <span>Perf: {safePC.performanceRating}/10</span>
          </div>
        </div>

        {/* Bottom Right Wishlist */}
        <div className="absolute bottom-3 right-3">
          <AddToWishlistButton 
            productId={safePC._id}
            productType="prebuilt-pc"
            className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
            size="sm"
          />
        </div>

        {/* Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-semibold backdrop-blur-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Category & Rating Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wide">
            {safePC.category}
          </span>
          
          {(safePC.averageRating > 0) && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold text-gray-900">
                {safePC.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({safePC.totalReviews})
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <Link to={`/prebuilt-pcs/${safePC.slug}`}>
          <h3 className="font-bold text-lg text-gray-900 mb-3 hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
            {safePC.name}
          </h3>
        </Link>

        {/* Key Components */}
        <div className="mb-4 space-y-2">
          {mainComponents.map((component, index) => (
            component && (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">{component.partType}:</span>
                <span className="text-gray-900 font-semibold text-right truncate ml-2">
                  {component.name}
                </span>
              </div>
            )
          ))}
          
          {safePC.components.length > 3 && (
            <div className="text-xs text-blue-600 font-medium pt-1">
              +{safePC.components.length - 3} more components
            </div>
          )}
        </div>

        {/* Performance Stars */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= performanceLevel
                    ? 'text-blue-500 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {safePC.performanceRating}/10 Rating
          </span>
        </div>

        {/* Pricing Section */}
        <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                Rs {offerPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-500 line-through">
                  Rs {basePrice.toLocaleString()}
                </span>
              )}
            </div>
            
            {/* Stock Status */}
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isInStock 
                ? isLowStock
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {isInStock 
                ? (isLowStock ? `Only ${safePC.stockQuantity} left` : 'In Stock')
                : 'Out of Stock'
              }
            </div>
          </div>

          {/* Savings */}
          {hasDiscount && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-green-600">
                You save Rs {savings.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">
                {discountPercentage}% off
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
  <PreBuiltPCAddToCartButton
    pcId={safePC._id}
    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={!isInStock}
  >
    {!isInStock ? 'Out of Stock' : 'Add to Cart'}
  </PreBuiltPCAddToCartButton>
          
<Link
    to={`/prebuilt-pcs/${safePC.slug}`}
    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 border border-gray-200 hover:border-gray-300"
  >
    View Details
  </Link>
        </div>

        {/* Quick Specs Footer */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Warranty</span>
            </div>
            <span className="font-semibold text-gray-900">{safePC.warranty}</span>
          </div>
          
          {safePC.isTested && safePC.benchmarkTests.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Benchmarks</span>
              </div>
              <span className="font-semibold text-gray-900">
                {safePC.benchmarkTests.length} tests
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreBuiltPCCard;