import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';
import AddToWishlistButton from '../product/AddToWishlistButton';
import { toast } from 'react-toastify';
import { baseURL } from '../config/config';

// --- Types ---
export interface Variant {
  _id: string;
  name: string;
  price?: number;
  mrp?: number;
  offerPrice?: number;
  stockQuantity?: number;
  sku?: string;
  slug?: string;
  images?: {
    thumbnail?: {
      url: string;
      altText: string;
    };
    gallery?: any[];
  };
  isActive?: boolean;
  identifyingAttributes?: any[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  // ✅ FIX: Added fields based on your console logs
  basePrice?: number; 
  sellingPrice?: number; // Added from logs
  effectivePrice?: number;
  mrp?: number;
  offerPrice?: number;
  stockQuantity?: number;
  hasStock?: boolean;
  condition?: string;
  averageRating?: number;
  images?: {
    thumbnail?: {
      url: string;
      altText: string;
    };
    hoverImage?: {
      url: string;
      altText: string;
    };
    gallery?: any[];
  };
  brand?: {
    name: string;
  };
  variants?: Variant[];
  variantConfiguration?: any;
}

// --- AddToCartButton Component ---
interface VariantData {
  variantId: string;
  name?: string;
  price?: number;
  mrp?: number;
  offerPrice?: number;
  stock?: number;
  attributes?: Array<{ key: string; label: string; value: string }>;
  sku?: string;
}

interface AddToCartButtonProps {
  productId: string;
  product?: any;
  variant?: VariantData | null;
  productType?: 'product' | 'prebuilt-pc';
  className?: string;
  quantity?: number;
  disabled?: boolean;
  showIcon?: boolean;
  iconSize?: string;
  children?: React.ReactNode;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ 
  productId, 
  product,
  variant,
  productType = 'product',
  className = '',
  quantity = 1,
  disabled = false,
  showIcon = true,
  iconSize = "w-4 h-4",
  children 
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      const cartPayload = {
        productId, 
        variantId: variant?.variantId,
        variantData: variant,
        quantity,
        product: product || {
          _id: productId,
          name: product?.name || 'Product',
          images: product?.images || [],
          // ✅ FIX: Ensure price fallback includes sellingPrice
          effectivePrice: product?.effectivePrice || product?.sellingPrice || product?.basePrice || variant?.price || 0
        }
      };
      
      await dispatch(cartActions.addToCart(cartPayload));
      
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add to cart';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || disabled}
      className={`${className} transition-all duration-300 ease-out ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Adding...</span>
        </div>
      ) : (
        children || (
          <>
            {showIcon && (
              <svg className={`${iconSize} transition-transform duration-200 group-hover:scale-110`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
            <span>Add to Cart</span>
          </>
        )
      )}
    </button>
  );
};

// --- Main ProductCard Component ---
interface ProductCardProps {
  product: Product;
  cardStyle?: string; 
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    _id,
    name,
    slug,
    effectivePrice,
    sellingPrice, // ✅ FIX: Added from logs
    basePrice,
    mrp,
    offerPrice,
    stockQuantity,
    condition,
    averageRating = 0,
    images,
    brand,
    variants = [],
  } = product;

  const [isHovering, setIsHovering] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Ensure variants is an array
  const safeVariants = Array.isArray(variants) ? variants : [];
  const hasVariants = safeVariants.length > 0;

  const getBaseVariant = () => {
    if (!hasVariants) return null;
    
    const activeVariantWithStock = safeVariants.find(v => 
      v.isActive !== false && (v.stockQuantity || 0) > 0
    );
    if (activeVariantWithStock) return activeVariantWithStock;
    
    const activeVariant = safeVariants.find(v => v.isActive !== false);
    if (activeVariant) return activeVariant;
    
    return safeVariants[0];
  };

  const baseVariant = getBaseVariant();
  const inStock = hasVariants && baseVariant
    ? (baseVariant.stockQuantity || 0) > 0
    : (stockQuantity || 0) > 0;

  // ✅ FIX: Updated Price Logic to include sellingPrice (from logs)
  const getDisplayPrice = () => {
    if (hasVariants && baseVariant) {
      return baseVariant.offerPrice || baseVariant.price || 0;
    }
    // Check offerPrice, then effectivePrice, then sellingPrice (API), then basePrice
    return offerPrice || effectivePrice || sellingPrice || basePrice || 0;
  };

  const getDisplayMrp = () => {
    if (hasVariants && baseVariant) {
      return baseVariant.mrp || baseVariant.price || 0;
    }
    return mrp || basePrice || effectivePrice || sellingPrice || 0;
  };

  const displayPrice = getDisplayPrice();
  const displayMrp = getDisplayMrp();
  
  // Calculate discount
  const discount = displayMrp > displayPrice && displayPrice > 0 
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) 
    : 0;

  // Image handling helper
  const getImageUrl = (imageObj: any) => {
    if (!imageObj?.url) return '/placeholder-image.jpg';
      
    const url = imageObj.url;
    const API_BASE_URL = process.env.REACT_APP_API_URL || baseURL;
    
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }

    if (!url.includes('/')) {
      if (url.startsWith('products-')) return `${API_BASE_URL}/uploads/products/${url}`;
      if (url.startsWith('brands-')) return `${API_BASE_URL}/uploads/brands/${url}`;
      return `${API_BASE_URL}/uploads/products/${url}`;
    }
    
    if (url.startsWith('/uploads/')) {
      const filename = url.split('/').pop();
      if (filename && filename.startsWith('products-') && !url.includes('/products/')) {
        return `${API_BASE_URL}/uploads/products/${filename}`;
      }
      return `${API_BASE_URL}${url}`;
    }
    
    return `${API_BASE_URL}/${url.replace(/^\//, '')}`;
  };

  const getDisplayImages = () => {
    const imagesData = {
      thumbnail: null as any,
      hover: null as any
    };

    if (hasVariants && baseVariant?.images) {
      imagesData.thumbnail = baseVariant.images.thumbnail;
      if (baseVariant.images.gallery?.[0]) {
        imagesData.hover = baseVariant.images.gallery[0];
      }
    } else if (images) {
      imagesData.thumbnail = images.thumbnail;
      imagesData.hover = images.hoverImage;
    }

    return imagesData;
  };

  const displayImages = getDisplayImages();
  const thumbnailUrl = getImageUrl(displayImages.thumbnail);
  const hoverImageUrl = displayImages.hover ? getImageUrl(displayImages.hover) : null;

  const [currentImgSrc, setCurrentImgSrc] = useState<string>(thumbnailUrl);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setCurrentImgSrc(thumbnailUrl);
    setHasImageError(false);
  }, [thumbnailUrl]);

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getProductUrl = () => {
    if (hasVariants && baseVariant) {
      const variantSlug = baseVariant.slug || baseVariant.name?.toLowerCase().replace(/\s+/g, '-');
      const variantId = baseVariant._id;
      if (variantSlug) return `/product/${slug}?variant=${variantSlug}`;
      if (variantId) return `/product/${slug}?variant=${variantId}`;
    }
    return `/product/${slug}`;
  };

  const productUrl = getProductUrl();

  // ✅ FIX: Construct Normalized Data for Wishlist
  // This ensures 'price' is always present, even if the API sends 'basePrice' or 'sellingPrice'
  const wishlistProductData = {
    ...product,
    price: displayPrice, // Explicitly set the calculated price
    effectivePrice: displayPrice,
    mrp: displayMrp,
    // Ensure images are properly structured
    images: product.images || (hasVariants && baseVariant ? baseVariant.images : {})
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg 
          key={star} 
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs font-medium text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <div 
      className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out hover:border-gray-200"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {discount > 0 && (
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform transition-transform duration-300 group-hover:scale-105">
            -{discount}%
          </span>
        </div>
      )}

      {!inStock && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
          <div className="bg-gray-900/90 text-white px-4 py-2 rounded-lg transform -rotate-3 transition-transform duration-300 group-hover:rotate-0">
            <span className="text-sm font-bold uppercase tracking-wider">Out of Stock</span>
          </div>
        </div>
      )}

      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Wishlist Button */}
        <div className="absolute top-4 right-4 z-20 transform transition-transform duration-300">
          <AddToWishlistButton 
            productId={_id}
            product={wishlistProductData} // ✅ FIX: Pass the normalized data here
            variant={hasVariants && baseVariant ? {
              variantId: baseVariant._id,
              name: baseVariant.name,
              price: baseVariant.price,
              mrp: baseVariant.mrp,
              offerPrice: baseVariant.offerPrice,
              stock: baseVariant.stockQuantity,
              sku: baseVariant.sku,
              slug: baseVariant.slug
            } : null}
className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl hover:text-red-500 transition-all duration-300"
            size="md"
          />
        </div>

        {hasVariants && (
          <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500">
            <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              {safeVariants.length} Options
            </span>
          </div>
        )}

        <Link to={productUrl} className="block w-full h-full">
          <div className="relative w-full h-full">
            <div className={`absolute inset-0 ${isHovering ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
              <img
                src={currentImgSrc}
                alt={displayImages.thumbnail?.altText || name}
                width={400}
                height={400}
                className="w-full h-full object-contain"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                   if (!hasImageError) {
                     setHasImageError(true);
                     setCurrentImgSrc('/placeholder-image.jpg'); 
                     setImageLoaded(true);
                   }
                }}
              />
            </div>

            {hoverImageUrl && (
              <div className={`absolute inset-0 ${isHovering ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}>
                <img
                  src={hoverImageUrl}
                  alt={displayImages.hover?.altText || `${name} - Alternate view`}
                  width={400}
                  height={400}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </Link>
      </div>

      <div className="flex flex-col flex-1 p-6">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 transition-all duration-300 group-hover:text-blue-600">
          {brand?.name || 'Premium Brand'}
        </div>

        <Link to={productUrl} className="mb-3 block group/title">
          <h3 className="text-base font-semibold text-gray-900 leading-tight line-clamp-2 group-hover/title:text-blue-700 transition-colors duration-300">
            {baseVariant?.name || name}
          </h3>
        </Link>

        {averageRating > 0 && (
          <div className="mb-4 transform transition-transform duration-300 group-hover:translate-x-1">
            <StarRating rating={averageRating} />
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-end justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900 transition-all duration-300 group-hover:text-blue-700">
                  {formatPrice(displayPrice)}
                </span>
                
                {discount > 0 && displayMrp && (
                  <span className="text-sm text-gray-400 line-through transition-all duration-300 group-hover:text-gray-500">
                    {formatPrice(displayMrp)}
                  </span>
                )}
              </div>

              <div className="flex items-center">
                <span className={`flex w-2 h-2 rounded-full mr-2 ${inStock ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className={`text-xs font-medium ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                  {inStock ? 'In Stock' : 'Currently Unavailable'}
                </span>
              </div>
            </div>
          </div>

          <AddToCartButton
            productId={_id}
            product={wishlistProductData} // Use same normalized data here for consistency
            variant={hasVariants && baseVariant ? {
              variantId: baseVariant._id,
              name: baseVariant.name,
              price: baseVariant.price,
              mrp: baseVariant.mrp,
              offerPrice: baseVariant.offerPrice,
              stock: baseVariant.stockQuantity,
              attributes: baseVariant.identifyingAttributes || [],
              sku: baseVariant.sku,
            } : null}
            quantity={1}
            disabled={!inStock}
            className={`w-full py-3 px-6 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-300 ease-out
              ${inStock 
                ? 'bg-gradient-to-r from-gray-900 to-black text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="transition-all duration-300">{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </AddToCartButton>
        </div>
      </div>

      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/10 rounded-2xl pointer-events-none transition-all duration-500"></div>
    </div>
  );
};

export default React.memo(ProductCard);