// components/prebuilt/PreBuiltPCDetail.tsx - FIXED VERSION
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { preBuiltPCActions } from '../../redux/actions/preBuiltPCActions';
import { selectCurrentPC, selectLoading, selectError } from '../../redux/selectors/preBuiltPCSelectors';
import AddToCartButton from '../product/AddToCartButton';
import AddToWishlistButton from '../product/AddToWishlistButton'; // Fixed import path
import LoadingSpinner from '../admin/common/LoadingSpinner';
import PreBuiltPCAddToWishlistButton from './PreBuiltPCAddToWishlistButton';
import { getImageUrl } from '../utils/imageUtils';
import {
  Star, Shield, TrendingUp, Check, Cpu, HardDrive,
  MemoryStick, Power, Monitor, Wind, Zap,
  Package, Clock, Users, Award, ShieldCheck, Truck,
  LifeBuoy, RefreshCw, ChevronRight, Heart,
  Cpu as CpuIcon, Gpu as GpuIcon, HardDrive as StorageIcon,
   Fan as FanIcon,
  Layers as LayersIcon
} from 'lucide-react';

// Component icon mapper
const componentIcons: Record<string, React.ComponentType<any>> = {
  'CPU': CpuIcon,
  'Motherboard': ShieldCheck,
  'RAM': MemoryStick,
  'Storage': StorageIcon,
  'Cabinet': Package,
  'PSU': Power,
  'GPU': GpuIcon,
  'Cooling': FanIcon,
  'Other': LayersIcon,
};

const getComponentIcon = (partType: string) => {
  const normalizedType = partType?.charAt(0)?.toUpperCase() + partType?.slice(1)?.toLowerCase();
  return componentIcons[normalizedType as keyof typeof componentIcons] || componentIcons.Other;
};

// Single Components Display Component
const ComponentsSection: React.FC<{ components: any[] }> = ({ components }) => {
  if (!components?.length) return null;

  return (
   <div className="mt-6 w-[1200px] m-auto pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Components</h2>
          <p className="text-gray-600 mt-2">
            This system features {components.length} carefully selected components for optimal performance.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
            <Package className="w-4 h-4" />
            {components.length} parts total
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {components.map((component, index) => {
          const IconComponent = getComponentIcon(component.partType);
          const componentImage = component?.image ? getImageUrl(component.image) : null;
          
          return (
            <div 
              key={component._id || index} 
              className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center group-hover:from-blue-100 group-hover:to-purple-100 transition-all">
                    {componentImage && !componentImage.includes('placeholder') ? (
                      <img 
                        src={componentImage} 
                        alt={component.partType}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        width="24"
                        height="24"
                      />
                    ) : (
                      <IconComponent className="w-5 h-5 text-gray-700" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    {component.partType}
                  </span>
                  
                  <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                    {component.name}
                  </h3>
                  
                  <div className="text-xs text-gray-600 mb-1">
                    {component.brand}
                  </div>
                  
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {component.specs}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PreBuiltPCDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  
  const currentPC = useAppSelector(selectCurrentPC);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'support'>('overview');
const [isAutoSlide, setIsAutoSlide] = useState(true);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-slide functionality
  const startAutoSlide = () => {
    if (currentPC?.images?.length > 1 && isAutoSlide) {
      autoSlideTimerRef.current = setInterval(() => {
        setSelectedImageIndex(prev => 
          prev === currentPC.images.length - 1 ? 0 : prev + 1
        );
      }, 3000); // Change image every 3 seconds
    }
  };

  const stopAutoSlide = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
  };

  useEffect(() => {
    startAutoSlide();
    
    return () => {
      stopAutoSlide();
    };
  }, [currentPC, isAutoSlide]);

  useEffect(() => {
    if (!isAutoSlide) {
      stopAutoSlide();
    } else {
      startAutoSlide();
    }
  }, [isAutoSlide]);
  useEffect(() => {
    if (slug) {
      dispatch(preBuiltPCActions.fetchPreBuiltPCBySlug(slug));
    }
  }, [dispatch, slug]);

  // Memoized calculations
  const priceInfo = useMemo(() => {
    if (!currentPC) return null;
    const basePrice = currentPC.totalPrice || 0;
    const offerPrice = currentPC.discountPrice || basePrice;
    const discountPercentage = currentPC.discountPercentage || 
      (offerPrice < basePrice ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0);
    const hasDiscount = discountPercentage > 0;
    const savings = basePrice - offerPrice;
    
    return { basePrice, offerPrice, discountPercentage, hasDiscount, savings };
  }, [currentPC]);

  // Performance tier
  const performanceTier = useMemo(() => {
    if (!currentPC?.performanceRating) return 'Standard';
    if (currentPC.performanceRating >= 9) return 'Elite';
    if (currentPC.performanceRating >= 7) return 'Performance';
    return 'Standard';
  }, [currentPC]);

  // Feature list from data
  const featureList = useMemo(() => {
    const features = [
      'Ready-to-play out of the box',
      `${currentPC?.components?.length || 0} premium components`,
      'Professional cable management',
      'Comprehensive testing completed'
    ];
    
    if (currentPC?.isTested) {
      features.push('Benchmark certified');
    }
    
    if (currentPC?.warranty && currentPC.warranty !== 'No Warranty') {
      features.push(`${currentPC.warranty} warranty included`);
    }
    
    return features;
  }, [currentPC]);

  // Product data for wishlist - FIXED
  const productData = useMemo(() => {
    if (!currentPC) return null;
    
    return {
      _id: currentPC._id,
      name: currentPC.name,
      price: priceInfo?.offerPrice || 0,
      mrp: priceInfo?.basePrice || 0,
      images: currentPC.images || [],
      slug: currentPC.slug,
      category: currentPC.category,
      stock: currentPC.stockQuantity || 0,
      discountPercentage: currentPC.discountPercentage,
      shortDescription: currentPC.shortDescription,
      description: currentPC.description
    };
  }, [currentPC, priceInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !currentPC) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PC Not Found</h1>
          <p className="text-gray-600 mb-8">The system you're looking for doesn't exist or may have been removed.</p>
          <Link
            to="/prebuilt-pcs"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-semibold"
          >
            Browse All PCs
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = currentPC.images?.[selectedImageIndex] 
    ? getImageUrl(currentPC.images[selectedImageIndex])
    : getImageUrl(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/prebuilt-pcs" className="hover:text-blue-600 transition-colors">Pre-built PCs</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate">{currentPC.name}</span>
        </nav>

        {/* Main Grid - Optimized for smaller images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 ">
{/* Image Gallery - Amazon Style */}
<div className="flex flex-col lg:flex-row gap-4">
  {/* Left: Vertical Thumbnails */}
  {currentPC.images.length > 1 && (
    <div className="order-2 lg:order-1 lg:w-20">
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[400px] lg:pr-2">
        {currentPC.images.map((image, index) => (
          <button
            key={image._id || index}
            onClick={() => {
              setSelectedImageIndex(index);
              // Reset auto-slide timer when manually selected
              if (autoSlideTimerRef.current) {
                clearInterval(autoSlideTimerRef.current);
                startAutoSlide();
              }
            }}
            className={`flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-lg border overflow-hidden transition-all duration-200 ${
              selectedImageIndex === index 
                ? 'border-blue-500 ring-2 ring-blue-200 scale-105' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            aria-label={`View image ${index + 1}`}
            aria-current={selectedImageIndex === index}
          >
            <img
              src={getImageUrl(image)}
              alt={`${currentPC.name} view ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              width="64"
              height="64"
            />
          </button>
        ))}
      </div>
    </div>
  )}

  {/* Center: Main Image Container */}
  <div className="order-1 lg:order-2 flex-1">
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group relative">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <div className="relative w-full h-full">
          {currentPC.images.map((image, index) => (
            <img
              key={image._id || index}
              src={getImageUrl(image)}
              alt={currentPC.name}
              className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500 ${
                selectedImageIndex === index ? 'opacity-100' : 'opacity-0'
              }`}
              loading={index === 0 ? "eager" : "lazy"}
              width="500"
              height="500"
            />
          ))}
        </div>

        {/* Featured Badge */}
        {currentPC.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
            Featured Build
          </div>
        )}

        {/* Discount Badge */}
        {priceInfo?.hasDiscount && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg z-10">
            Save {priceInfo.discountPercentage}%
          </div>
        )}

        {/* Navigation Arrows */}
        {currentPC.images.length > 1 && (
          <>
            <button
              onClick={() => {
                setSelectedImageIndex(prev => prev === 0 ? currentPC.images.length - 1 : prev - 1);
                if (autoSlideTimerRef.current) {
                  clearInterval(autoSlideTimerRef.current);
                  startAutoSlide();
                }
              }}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-110 z-10"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => {
                setSelectedImageIndex(prev => prev === currentPC.images.length - 1 ? 0 : prev + 1);
                if (autoSlideTimerRef.current) {
                  clearInterval(autoSlideTimerRef.current);
                  startAutoSlide();
                }
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-110 z-10"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {currentPC.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full z-10">
            {selectedImageIndex + 1} / {currentPC.images.length}
          </div>
        )}

      </div>

      {/* Image Controls */}
      {currentPC.images.length > 1 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View all {currentPC.images.length} images</span>
            </div>
            <div className="flex items-center gap-2">

            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Cpu className="w-3 h-3" />
                  {currentPC.category}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  currentPC.condition === 'New' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentPC.condition === 'New' ? '🆕 New' : '🔄 Refurbished'}
                </span>
                {currentPC.isTested && (
                  <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    Benchmarked
                  </span>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {currentPC.name}
              </h1>
              
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {currentPC.shortDescription || currentPC.description}
              </p>

              {/* Ratings */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {currentPC.averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(currentPC.averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{currentPC.averageRating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm">({currentPC.totalReviews || 0} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Package className="w-3.5 h-3.5" />
                  <span>{currentPC.stockQuantity || 0} in stock</span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-5">
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Price</div>
                    <div className="text-3xl font-bold text-gray-900">
                      ₹{priceInfo?.offerPrice.toLocaleString()}
                    </div>
                  </div>
                  {priceInfo?.hasDiscount && (
                    <div className="mb-1">
                      <div className="text-lg text-gray-500 line-through">
                        ₹{priceInfo.basePrice.toLocaleString()}
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        Save ₹{priceInfo.savings.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                
                {priceInfo?.discountPercentage > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">Discount:</span> {priceInfo.discountPercentage}% off
                  </div>
                )}
              </div>

              {/* Action Buttons - FIXED WISHLIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <AddToCartButton
                  productId={currentPC._id}
                  productName={currentPC.name}
                  productPrice={priceInfo?.offerPrice || 0}
                  productImage={mainImage}
                  stockQuantity={currentPC.stockQuantity || 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-md"
                  disabled={(currentPC.stockQuantity || 0) === 0}
                  productType="prebuilt-pc"
                  label="Add to Cart"
                />

<PreBuiltPCAddToWishlistButton 
  pcId={currentPC._id}
  pcData={currentPC}
  className="w-full py-3 px-6 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex items-center justify-center"
  size="md"
/>
                
      
              </div>

              {/* Quick Features - Compact */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-semibold text-sm">{currentPC.warranty || '1 Year'}</div>
                    <div className="text-xs text-gray-500">Warranty</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-semibold text-sm">Ready to Ship</div>
                    <div className="text-xs text-gray-500">{currentPC.stockQuantity > 0 ? '24-48h' : 'Pre-order'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-semibold text-sm">Expert Support</div>
                    <div className="text-xs text-gray-500">Lifetime</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-semibold text-sm">Tested</div>
                    <div className="text-xs text-gray-500">Quality Checked</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Components Section - Removed from tabs, now standalone */}
        <ComponentsSection components={currentPC.components || []} />

        {/* Tabs Navigation - Reduced options (removed components tab) */}
        <div className="mt-8 mb-6  w-[1300px] m-auto">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'performance', label: 'Performance' },
              { id: 'support', label: 'Support' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8  w-[1300px] m-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">
                      {currentPC.description || `The ${currentPC.name} is designed for ${currentPC.category.toLowerCase() || 'optimal'} performance.`}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {featureList.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Warranty & Support</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
                      <span className="text-gray-600 text-sm">Warranty</span>
                      <span className="font-semibold text-gray-900 text-sm">{currentPC.warranty || '1 Year'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
                      <span className="text-gray-600 text-sm">Support</span>
                      <span className="font-semibold text-gray-900 text-sm">Lifetime</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-600 text-sm">Condition</span>
                      <span className="font-semibold text-gray-900 text-sm">{currentPC.condition}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Specifications</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Category</span>
                      <span className="font-semibold text-gray-900 text-sm">{currentPC.category}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Components</span>
                      <span className="font-semibold text-gray-900 text-sm">{currentPC.components?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-600 text-sm">Performance</span>
                      <span className="font-semibold text-gray-900 text-sm">{currentPC.performanceRating}/10</span>
                    </div>
                  </div>
                </div>

                {currentPC.tags?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">System Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPC.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Details</h2>
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl font-bold text-gray-900">{currentPC.performanceRating}/10</div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{performanceTier} Performance</div>
                    <div className="text-gray-600 text-sm">Overall system rating</div>
                  </div>
                </div>
              </div>
              
              {currentPC.isTested && currentPC.benchmarkTests?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {currentPC.benchmarkTests.map((test, index) => (
                    <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{test.testName}</h3>
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {test.testCategory}
                          </span>
                        </div>
                        <TrendingUp className="w-6 h-6 text-green-500" />
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {test.score} <span className="text-sm text-gray-600">{test.unit}</span>
                        </div>
                        {test.comparison && (
                          <div className="text-xs text-gray-600">
                            Better than <span className="font-bold text-green-600">{test.comparison.betterThan}%</span> of similar builds
                          </div>
                        )}
                      </div>
                      
                      {test.description && (
                        <p className="text-gray-600 text-sm">{test.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-5 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Benchmark Data Available</h3>
                  <p className="text-gray-600 text-sm mb-4">This system hasn't been benchmarked yet, but it's quality tested for optimal performance.</p>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Quality tested components</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Compatibility verified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Thermal testing complete</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Support & Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Warranty Coverage</h3>
                  <p className="text-gray-600 text-sm">
                    Comprehensive {currentPC.warranty || '1 Year'} warranty covering all components and labor.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Expert Support</h3>
                  <p className="text-gray-600 text-sm">
                    Technical support from our team of PC experts. Available via phone, email, and live chat.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Setup Assistance</h3>
                  <p className="text-gray-600 text-sm">
                    Free setup guide and video tutorials to get your system running optimally from day one.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Systems Placeholder */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Similar Systems</h2>
              <p className="text-gray-600 text-sm mt-1">Explore other builds that match your performance needs</p>
            </div>
            <Link
              to="/prebuilt-pcs"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              View All Systems
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreBuiltPCDetail;