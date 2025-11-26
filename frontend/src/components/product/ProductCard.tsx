import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../redux/types/productTypes';
import AddToWishlistButton from './AddToWishlistButton';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    _id,
    name,
    slug,
    sellingPrice,
    displayMrp,
    discountPercentage,
    stockQuantity,
    condition,
    averageRating,
    images,
    brand,
    variants = [],
    variantConfiguration
  } = product;

  const inStock = stockQuantity > 0;
  const hasDiscount = discountPercentage > 0;
  const hasVariants = variants && variants.length > 0;

  // 🔧 FIXED: Get base/default variant
  const getBaseVariant = () => {
    if (!hasVariants) return null;
    
    // Strategy 1: Find first active variant
    const activeVariant = variants.find(v => v.isActive !== false);
    if (activeVariant) return activeVariant;
    
    // Strategy 2: Use first variant
    return variants[0];
  };

  const baseVariant = getBaseVariant();

  // 🔧 FIXED: Prepare product data for cart/wishlist
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
          sku: baseVariant.sku
        }
      };
    } else {
      return {
        productId: _id,
        variant: null // No variants
      };
    }
  };

  const productData = getProductData();

  // Currency Formatter
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Star Rating Component
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
        
        {/* Badges (Top Left) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {/* Condition Badge */}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm ${
            condition === 'New' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {condition}
          </span>
          
          {/* Discount Badge */}
          {hasDiscount && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
              -{discountPercentage}%
            </span>
          )}

          {/* Variant Indicator */}
          {hasVariants && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
              {variants.length} Options
            </span>
          )}
        </div>

        {/* Wishlist (Top Right) */}
        <div className="absolute top-3 right-3 z-10">
          <AddToWishlistButton 
            productId={_id}
            variant={productData.variant}
            className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all duration-200 shadow-sm"
          />
        </div>

        <Link to={`/product/${slug}`} className="block w-full h-full">
          <img
            src={images?.thumbnail?.url || 'https://via.placeholder.com/300x300?text=Product+1'}
            alt={name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+1'; }}
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
        
        {/* Brand Name */}
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
          {brand?.name || 'Brand'}
        </div>

        {/* Product Name */}
        <Link to={`/product/${slug}`} className="mb-2 block">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Variant Name (if has variants) */}
        {hasVariants && baseVariant && (
          <div className="text-xs text-gray-600 mb-1">
            {baseVariant.name}
          </div>
        )}

        {/* Rating */}
        {averageRating > 0 && (
          <div className="mb-3">
            <StarRating rating={averageRating} />
          </div>
        )}

        {/* Price Block & Stock Status */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(sellingPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(displayMrp)}
                  </span>
                )}
              </div>
              
              {/* Stock Indicator */}
              <div className="flex items-center mt-1">
                 <span className={`flex w-2 h-2 rounded-full mr-1.5 ${inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                 <span className={`text-xs font-medium ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                    {inStock ? 'In Stock' : 'Unavailable'}
                 </span>
              </div>
            </div>
          </div>

          {/* Add To Cart Button */}
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