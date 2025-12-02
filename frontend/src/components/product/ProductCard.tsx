import React from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';
import AddToWishlistButton from './AddToWishlistButton';
import { toast } from 'react-toastify';

// --- Types (Inlined for self-containment) ---
export interface Variant {
  _id: string;
  name: string;
  price?: number;
  mrp?: number;
  stockQuantity?: number;
  sku?: string;
  slug?: string;
  images?: {
    thumbnail?: {
      url: string;
      altText: string;
    };
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
  stockQuantity?: number;
  hasStock?: boolean;
  condition?: string;
  averageRating?: number;
  images?: {
    thumbnail?: {
      url: string;
      altText: string;
    };
  };
  brand?: {
    name: string;
  };
  variants?: Variant[];
  variantConfiguration?: any;
}

// --- Actual Working Components ---

interface VariantData {
  variantId: string;
  name?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  attributes?: Array<{ key: string; label: string; value: string }>;
  sku?: string;
}



interface AddToCartButtonProps {
  productId: string;
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
  const [loading, setLoading] = React.useState(false);

  const handleAddToCart = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      const cartPayload = {
        productId, 
        variantId: variant?.variantId, // Extract variantId from variant object
        variantData: variant, // Send full variant data
        quantity 
      };
      
      // Dispatch the add to cart action
      await dispatch(cartActions.addToCart(cartPayload));
      
      toast.success('Product added to cart!');
      
    } catch (error: any) {
      console.error('❌ Failed to add to cart:', error);
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
      className={`${className} ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      } transition-all duration-200`}
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
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

// --- Main Component ---

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    _id,
    name,
    slug,
    effectivePrice,
    mrp,
    stockQuantity,
    condition,
    averageRating = 0,
    images,
    brand,
    variants = [],
  } = product;

  // 🎯 CALCULATE: Discount percentage
  const calculateDiscount = () => {
    if (!mrp || mrp <= effectivePrice) return 0;
    return Math.round(((mrp - effectivePrice) / mrp) * 100);
  };

  const hasVariants = variants && variants.length > 0;

  // 🔧 FIXED: Get base/default variant logic
  const getBaseVariant = () => {
    if (!hasVariants) return null;
    
    // 1. Find first active variant with stock
    const activeVariantWithStock = variants.find(v => 
      v.isActive !== false && (v.stockQuantity || 0) > 0
    );
    if (activeVariantWithStock) return activeVariantWithStock;
    
    // 2. Find any active variant
    const activeVariant = variants.find(v => v.isActive !== false);
    if (activeVariant) return activeVariant;
    
    // 3. Fallback
    return variants[0];
  };

  const baseVariant = getBaseVariant();

  // 🎯 CRITICAL FIX: Calculate inStock correctly
  const inStock = hasVariants && baseVariant
    ? (baseVariant.stockQuantity || 0) > 0
    : (stockQuantity || 0) > 0;

  // 🔧 FIXED: Generate URL
  const getProductUrl = () => {
    if (hasVariants && baseVariant) {
      const variantSlug = baseVariant.slug || baseVariant.name?.toLowerCase().replace(/\s+/g, '-');
      const variantId = baseVariant._id;
      
      if (variantSlug) return `/product/${slug}?variant=${variantSlug}`;
      if (variantId) return `/product/${slug}?variant=${variantId}`;
    }
    return `/product/${slug}`;
  };

  // 🔧 FIXED: Data for actions
  const getProductData = () => {
    if (hasVariants && baseVariant) {
      return {
        productId: _id,
        variant: {
          variantId: baseVariant._id,
          name: baseVariant.name,
          price: baseVariant.price,
          mrp: baseVariant.mrp,
          stock: baseVariant.stockQuantity,
          attributes: baseVariant.identifyingAttributes || [],
          sku: baseVariant.sku,
          slug: baseVariant.slug
        }
      };
    }
    return { productId: _id, variant: null };
  };

  const productData = getProductData();
  const productUrl = getProductUrl();

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // 🎯 FIXED: Display Price Logic
  const getDisplayPrice = () => {
    if (hasVariants && baseVariant && baseVariant.price) {
      return baseVariant.price;
    }
    return effectivePrice;
  };

  const getDisplayMrp = () => {
    if (hasVariants && baseVariant && baseVariant.mrp) {
      return baseVariant.mrp;
    }
    return mrp;
  };

  const displayPrice = getDisplayPrice();
  const displayMrp = getDisplayMrp();
  const displayDiscount = displayMrp && displayMrp > displayPrice ? 
    Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;

  // 🔧 FIXED: Get image URL with Smart Subfolder Support
  const getImageUrl = (imageObj: any) => {
    if (!imageObj?.url) return '/placeholder-image.jpg';
      
    const url = imageObj.url;
    
    // 1. If it's already a full URL or blob URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // 2. Handle cases where it is just a filename (no slashes)
    if (!url.includes('/')) {
       // Heuristic: If filename starts with known prefixes, route to that folder
       if (url.startsWith('products-')) {
          return `${API_BASE_URL}/uploads/products/${url}`;
       }
       if (url.startsWith('brands-')) {
          return `${API_BASE_URL}/uploads/brands/${url}`;
       }
       // Default fallback to products if unsure
       return `${API_BASE_URL}/uploads/products/${url}`;
    }
    
    // 3. Handle paths that already start with /uploads/
    if (url.startsWith('/uploads/')) {
      // 🔴 SMART FIX: Check if the subfolder is missing based on filename prefix
      const filename = url.split('/').pop();
      
      // If file is "products-xyz.jpg" but path doesn't contain "/products/"
      if (filename && filename.startsWith('products-') && !url.includes('/products/')) {
         return `${API_BASE_URL}/uploads/products/${filename}`;
      }
      // If file is "brands-xyz.jpg" but path doesn't contain "/brands/"
      if (filename && filename.startsWith('brands-') && !url.includes('/brands/')) {
         return `${API_BASE_URL}/uploads/brands/${filename}`;
      }

      return `${API_BASE_URL}${url}`;
    }
    
    // 4. Fallback for other relative paths
    return `${API_BASE_URL}/${url.replace(/^\//, '')}`;
  };

  // Get the display image
  const getDisplayImage = () => {
    if (hasVariants && baseVariant?.images?.thumbnail) {
      return baseVariant.images.thumbnail;
    }
    return images?.thumbnail;
  };

  const displayImage = getDisplayImage();
  const imageUrl = getImageUrl(displayImage);
  // Helper for stars
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center space-x-1">
      <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="group flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-gray-300 transition-all duration-300">
      
      {/* --- Image Section --- */}
      <div className="relative aspect-[1/1] overflow-hidden bg-gray-50 p-4">
        
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm ${
            condition === 'New' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {condition || 'New'}
          </span>
          
          {displayDiscount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
              -{displayDiscount}%
            </span>
          )}

          {hasVariants && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
              {variants.length} Options
            </span>
          )}
        </div>

        {/* Wishlist */}
        <div className="absolute top-3 right-3 z-10">
          <AddToWishlistButton 
            productId={_id}
            variant={productData.variant}
            className="p-2"
            size="sm"
          />
        </div>

        <Link to={productUrl} className="block w-full h-full">
          <img
            src={imageUrl}
            alt={displayImage?.altText || name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
                e.currentTarget.onerror = null; 
                e.currentTarget.src = ''; 
            }}
          />
          
          {!inStock && (
             <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
               <span className="bg-gray-800 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">Out of Stock</span>
             </div>
          )}
        </Link>
      </div>

      {/* --- Details Section --- */}
      <div className="flex flex-col flex-1 p-4">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
          {brand?.name || 'Brand'}
        </div>

        <Link to={productUrl} className="mb-2 block">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
            {name}
          </h3>
        </Link>

        {hasVariants && baseVariant && (
          <div className="text-xs text-gray-600 mb-1">
            {baseVariant.name}
          </div>
        )}

        {averageRating > 0 && (
          <div className="mb-3">
            <StarRating rating={averageRating} />
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(displayPrice)}
                </span>
                {displayDiscount > 0 && displayMrp && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(displayMrp)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center mt-1">
                  <span className={`flex w-2 h-2 rounded-full mr-1.5 ${inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-xs font-medium ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                    {inStock ? 'In Stock' : 'Unavailable'}
                  </span>
              </div>
            </div>
          </div>

          <AddToCartButton
            productId={_id}
            variant={productData.variant}
            quantity={1}
            disabled={!inStock}
            className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 
              ${inStock 
                ? 'bg-gray-900 text-white hover:bg-black hover:shadow-lg active:scale-95' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Add to Cart</span>
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;