import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';
import AddToWishlistButton from './AddToWishlistButton';
import { toast } from 'react-toastify';
import { baseURL } from '../config/config';

// --- Types (Preserved) ---
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
    thumbnail?: { url: string; altText: string; };
    gallery?: any[];
  };
  isActive?: boolean;
  identifyingAttributes?: any[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  effectivePrice: number;
  mrp?: number;
  offerPrice?: number;
  stockQuantity?: number;
  hasStock?: boolean;
  condition?: string;
  averageRating?: number;
  images?: {
    thumbnail?: { url: string; altText: string; };
    hoverImage?: { url: string; altText: string; };
    gallery?: any[];
  };
  brand?: { name: string; };
  variants?: Variant[];
  variantConfiguration?: any;
}

// --- AddToCartButton Component (Styled) ---
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop click from triggering product link
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
          effectivePrice: product?.effectivePrice || variant?.price || 0
        }
      };
      
      await dispatch(cartActions.addToCart(cartPayload));
      toast.success('Product added to cart!');
      
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
      className={`transition-all duration-200 ease-out active:scale-[0.98] ${className} ${
        loading ? 'opacity-70 cursor-wait' : ''
      } ${
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Adding...</span>
        </div>
      ) : (
        children || (
          <div className="flex items-center justify-center gap-2">
            {showIcon && (
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
            <span>Add to Cart</span>
          </div>
        )
      )}
    </button>
  );
};

// --- Main ProductCard Component ---
interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Destructuring logic preserved exactly
  const {
    _id,
    name,
    slug,
    effectivePrice,
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

  // Variant Logic Preserved
  const hasVariants = variants && variants.length > 0;

  const getBaseVariant = () => {
    if (!hasVariants) return null;
    const activeVariantWithStock = variants.find(v => v.isActive !== false && (v.stockQuantity || 0) > 0);
    if (activeVariantWithStock) return activeVariantWithStock;
    const activeVariant = variants.find(v => v.isActive !== false);
    if (activeVariant) return activeVariant;
    return variants[0];
  };

  const baseVariant = getBaseVariant();
  const inStock = hasVariants && baseVariant
    ? (baseVariant.stockQuantity || 0) > 0
    : (stockQuantity || 0) > 0;

  // Price logic
  const getDisplayPrice = () => {
    if (hasVariants && baseVariant) return baseVariant.offerPrice || baseVariant.price || 0;
    return offerPrice || effectivePrice || 0;
  };

  const getDisplayMrp = () => {
    if (hasVariants && baseVariant) return baseVariant.mrp || baseVariant.price || 0;
    return mrp || effectivePrice || 0;
  };

  const displayPrice = getDisplayPrice();
  const displayMrp = getDisplayMrp();
  const discount = displayMrp > displayPrice && displayPrice > 0 
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) 
    : 0;

  // Image handling
  const getImageUrl = (imageObj: any) => {
    if (!imageObj?.url) return '/placeholder-image.jpg';
    const url = imageObj.url;
    const API_BASE_URL = process.env.REACT_APP_API_URL || baseURL;
    
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    if (!url.includes('/')) {
      if (url.startsWith('products-')) return `${API_BASE_URL}/uploads/products/${url}`;
      return `${API_BASE_URL}/uploads/products/${url}`;
    }
    return `${API_BASE_URL}/${url.replace(/^\//, '')}`;
  };

  const getDisplayImages = () => {
    const imagesData = { thumbnail: null as any, hover: null as any };
    if (hasVariants && baseVariant?.images) {
      imagesData.thumbnail = baseVariant.images.thumbnail;
      if (baseVariant.images.gallery?.[0]) imagesData.hover = baseVariant.images.gallery[0];
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
      if (variantSlug) return `/product/${slug}?variant=${variantSlug}`;
    }
    return `/product/${slug}`;
  };

  const productUrl = getProductUrl();

  return (
<div 
  className="group relative flex flex-col h-full bg-white rounded-lg border overflow-hidden transition-all duration-300 w-full max-w-[280px] mx-auto
  /* Key Changes Here: Crisper border, standard deeper shadow */
  border-gray-400/60 shadow-lg 
  /* Hover states */
  hover:border-gray-500/60 hover:shadow-xl"
  onMouseEnter={() => setIsHovering(true)}
  onMouseLeave={() => setIsHovering(false)}
>
      
      {/* --- Image Section (Aspect 4:3 for Tech) --- */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden p-3">
        
{/* Badges - Top Left - Sleek Minimalist Style */}
<div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
  
  {/* 1. Condition Badge (Subtle Gray/Dark Blue) */}
  {condition && (
    <span className="inline-block bg-slate-800 text-white text-[9px] font-bold px-1.5 py-[2px] rounded uppercase tracking-wider">
      {condition}
    </span>
  )}

  {/* 2. Discount Badge (Sharp Red, JUST percentage) */}
  {discount > 0 && (
    <span className="inline-block bg-[#dc2626] text-white text-[10px] font-extrabold px-1.5 py-[2px] rounded shadow-sm">
      -{discount}%
    </span>
  )}

  {/* 3. Sold Out Badge (Black) */}
  {!inStock && (
    <span className="inline-block bg-black text-white text-[9px] font-bold px-1.5 py-[2px] rounded uppercase tracking-wider">
      Sold Out
    </span>
  )}
</div>

        {/* Wishlist - Top Right */}
        <div className="absolute top-3 right-3 z-20">
          <AddToWishlistButton 
            productId={_id}
            product={product}
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
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            size="sm"
          />
        </div>

        {/* Image Display */}
        <Link to={productUrl} className="block w-full h-full relative z-10">
          <div className="w-full h-full flex items-center justify-center">
            {/* Main Image */}
            <img
              src={currentImgSrc}
              alt={displayImages.thumbnail?.altText || name}
              className={`max-w-full max-h-full object-contain mix-blend-multiply transition-opacity duration-500 ${isHovering && hoverImageUrl ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (!hasImageError) {
                   setHasImageError(true);
                   setCurrentImgSrc('/placeholder-image.jpg');
                   setImageLoaded(true);
                }
              }}
            />
            {/* Hover Image */}
            {hoverImageUrl && (
              <img
                src={hoverImageUrl}
                alt={displayImages.hover?.altText || name}
                className={`absolute inset-0 w-full h-full object-contain mix-blend-multiply transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </div>
        </Link>
      </div>

      {/* --- Details Section --- */}
      <div className="flex flex-col flex-1 p-2">
        
        {/* Brand */}
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 truncate">
          {brand?.name || 'Brand'}
        </div>

        {/* Title */}
        <Link to={productUrl} className="block group/title mb-2">
          <h3 className="text-[15px] font-medium text-gray-900 leading-[1.35] line-clamp-2 min-h-[2.5rem] group-hover/title:text-blue-600 transition-colors">
            {baseVariant?.name || name}
          </h3>
        </Link>

        {/* Rating */}
        {/* {averageRating > 0 && (
          <div className="flex items-center gap-1 mb-2">
             <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
             <span className="text-xs font-medium text-gray-500">{averageRating.toFixed(1)}</span>
          </div>
        )} */}
{/* --- Footer (Price Top, Button Bottom) --- */}
        <div className="mt-auto pt-2 pb-2 border-t border-dashed border-gray-100">
          
          {/* Price Block */}
          <div className="mb-3">
             <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(displayPrice)}
                </span>
                {discount > 0 && displayMrp && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(displayMrp)}
                  </span>
                )}
             </div>
             {inStock && (
                <div className="text-[10px] text-green-600 font-medium mt-0.5">
                   In Stock
                </div>
             )}
          </div>

          {/* Button Block - Centered with Max Width */}
          <AddToCartButton
            productId={_id}
            product={product}
            variant={hasVariants && baseVariant ? {
              variantId: baseVariant._id,
              name: baseVariant.name,
              price: baseVariant.price,
              mrp: baseVariant.mrp,
              offerPrice: baseVariant.offerPrice,
              stock: baseVariant.stockQuantity,
              attributes: baseVariant.identifyingAttributes || [],
              sku: baseVariant.sku,
              slug: baseVariant.slug
            } : null}
            quantity={1}
            disabled={!inStock}
            // ✅ FIX: Added 'max-w-[220px]', 'mx-auto', and 'block'
            className={`w-full max-w-[220px] mx-auto block py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${
              inStock 
                ? 'bg-black text-white hover:bg-gray-800 hover:shadow-md' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          />
          
        </div>

      </div>
    </div>
  );
};

export default ProductCard;