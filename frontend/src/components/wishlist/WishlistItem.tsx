// components/wishlist/WishlistItem.tsx - COMPLETE FIXED VERSION
import React from 'react';
import { Link } from 'react-router-dom';
import { WishlistItem as WishlistItemType } from '../../redux/types/wishlistTypes';
import { useAppDispatch } from '../../redux/hooks';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { cartActions } from '../../redux/actions/cartActions';
import { baseURL } from '../config/config';
import { Heart, Trash2, ShoppingCart, Tag, Cpu, Zap } from 'lucide-react';

interface WishlistItemProps {
  item: WishlistItemType;
  onRemove: (itemId: string, productType: 'product' | 'prebuilt-pc') => void;
}

// Helper function to get full image URL - ENHANCED VERSION
const getFullImageUrl = (url: string): string => {
  if (!url || url.trim() === '') {
    return 'https://via.placeholder.com/300x300?text=No+Image';
  }
  
  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Handle local URLs
  const LOCAL_API_URL = process.env.REACT_APP_API_URL || baseURL;
  const cleanBaseUrl = LOCAL_API_URL.endsWith('/') ? LOCAL_API_URL.slice(0, -1) : LOCAL_API_URL;
  
  // Remove leading slash if already in baseURL
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBaseUrl}${cleanUrl}`;
};

// Helper to extract image from product
const extractImageUrl = (item: WishlistItemType): string => {
  const product = item.product as any;
  
  // 1. Check if it's a prebuilt PC
  if (item.productType === 'prebuilt-pc') {
    // First check product.images
    if (product.images) {
      // Handle array format
      if (Array.isArray(product.images)) {
        if (product.images.length > 0) {
          return product.images[0]?.url || product.images[0]?.imageUrl || '';
        }
      }
      // Handle object with numeric keys (from localStorage)
      else if (typeof product.images === 'object') {
        // Check if it's an object with keys like '0', '1'
        const keys = Object.keys(product.images);
        if (keys.length > 0) {
          const firstImage = product.images[keys[0]];
          return firstImage?.url || firstImage?.imageUrl || '';
        }
      }
    }
    
    // Check preBuiltPC field
    if (item.preBuiltPC && typeof item.preBuiltPC === 'object') {
      const pcData = item.preBuiltPC as any;
      if (pcData.images) {
        if (Array.isArray(pcData.images) && pcData.images.length > 0) {
          return pcData.images[0]?.url || '';
        }
      }
    }
  }
  
  // 2. Regular product images
  if (product.images?.thumbnail?.url) {
    return product.images.thumbnail.url;
  }
  
  if (product.primaryImage?.url) {
    return product.primaryImage.url;
  }
  
  if (product.images?.gallery && Array.isArray(product.images.gallery) && product.images.gallery.length > 0) {
    return product.images.gallery[0]?.url || '';
  }
  
  if (product.image) {
    return product.image;
  }
  
  // 3. Check variant images
  if (item.variant?.images?.thumbnail?.url) {
    return item.variant.images.thumbnail.url;
  }
  
  return '';
};

const WishlistItem: React.FC<WishlistItemProps> = ({ item, onRemove }) => {
  const dispatch = useAppDispatch();

  const handleRemove = () => {
    console.log('🗑️ Removing item:', item._id, item.productType);
    onRemove(item._id, item.productType || 'product');
  };

const handleMoveToCart = async () => {
  try {
    // Remove from wishlist first
    await dispatch(wishlistActions.removeFromWishlist({ 
      itemId: item._id
    }));
    
    // Then add to cart based on product type
    if (item.productType === 'prebuilt-pc') {
      // ✅ PASS PRODUCT DATA TO CART
      await dispatch(cartActions.addPreBuiltPCToCart({ 
        pcId: (item.product as any)._id, 
        quantity: 1,
        product: item.product // Pass the full product data
      }));
    } else {
      await dispatch(cartActions.addToCart({ 
        productId: (item.product as any)._id,
        variantData: item.variant ? {
          variantId: item.variant.variantId,
          name: item.variant.name,
          price: item.variant.price,
          mrp: item.variant.mrp,
          stock: item.variant.stock,
          attributes: item.variant.attributes,
          sku: item.variant.sku
        } : undefined,
        quantity: 1 
      }));
    }
  } catch (error) {
    console.error('Failed to move to cart:', error);
  }
};

  // ENHANCED: Better data extraction with prebuilt PC support
  const getDisplayData = () => {
    console.log('💰 Price calculation for:', item.product?.name);
    console.log('🔍 Full item:', item);
    
    let price = 0;
    let mrp = 0;
    let name = item.product?.name || 'Product';
    let imageUrl = extractImageUrl(item);
    
    // Handle Pre-built PC
    if (item.productType === 'prebuilt-pc') {
      const pc = item.product as any;
      
      // Check preBuiltPC field first (populated from backend)
      if (item.preBuiltPC && typeof item.preBuiltPC === 'object') {
        const pcData = item.preBuiltPC as any;
        price = pcData.discountPrice || pcData.totalPrice || 0;
        mrp = pcData.totalPrice || price;
        name = pcData.name || 'Pre-built PC';
        
        console.log('✅ Using preBuiltPC data:', { price, mrp, name });
      } else {
        // Fallback to product field
        price = pc.offerPrice || pc.totalPrice || pc.basePrice || 0;
        mrp = pc.basePrice || pc.totalPrice || price;
        name = pc.name || 'Pre-built PC';
        
        console.log('✅ Using product field for PC:', { price, mrp, name });
      }
    }
    // Handle variant products
    else if (item.variant && item.variant.price !== undefined) {
      price = item.variant.price || 0;
      mrp = item.variant.mrp || price;
      if (item.variant.name) {
        name = `${item.product?.name || ''} - ${item.variant.name}`;
      }
      console.log('✅ Using variant price:', { price, mrp });
    } 
    // Handle regular products
    else {
      const product = item.product as any;
      
      // Try multiple price fields in priority order
      const possiblePriceFields = [
        product.effectivePrice,
        product.sellingPrice,
        product.displayPrice,
        product.basePrice,
        product.price,
        product.lowestPrice,
        product.offerPrice
      ];
      
      const possibleMrpFields = [
        product.mrp,
        product.displayMrp,
        product.basePrice,
        product.totalPrice
      ];
      
      // Find first valid price
      for (const field of possiblePriceFields) {
        if (field !== undefined && field !== null && !isNaN(field) && field > 0) {
          price = Number(field);
          break;
        }
      }
      
      // Find first valid MRP
      for (const field of possibleMrpFields) {
        if (field !== undefined && field !== null && !isNaN(field) && field > 0) {
          mrp = Number(field);
          break;
        }
      }
      
      // If MRP is still 0, use price
      if (mrp === 0 && price > 0) {
        mrp = price;
      }
      
      console.log('✅ Using product price:', { price, mrp });
    }

    const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    
    // Get full image URL
    const fullImageUrl = getFullImageUrl(imageUrl);
    
    console.log('🎯 Final display data:', { 
      name, 
      price, 
      mrp, 
      discountPercentage,
      imageUrl: fullImageUrl 
    });

    return { 
      price, 
      mrp, 
      discountPercentage, 
      name, 
      image: fullImageUrl 
    };
  };

  const { price, mrp, discountPercentage, name, image } = getDisplayData();
  const hasDiscount = discountPercentage > 0;
  const productSlug = item.productType === 'prebuilt-pc' 
    ? `/prebuilt-pcs/${item.product?.slug}`  // Fixed: prebuilt-pcs (plural)
    : `/product/${item.product?.slug}`;

  // Currency formatter
  const formatPrice = (amount: number) => {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stock status
  const getStockStatus = () => {
    let stock = 0;
    
    if (item.variant?.stock !== undefined) {
      stock = item.variant.stock;
    } else if (item.product?.stockQuantity !== undefined) {
      stock = item.product.stockQuantity;
    } else if ((item.product as any)?.stock !== undefined) {
      stock = (item.product as any).stock;
    } else if ((item.product as any)?.totalStock !== undefined) {
      stock = (item.product as any).totalStock;
    }
    
    const isInStock = stock > 0;
    
    return {
      isInStock,
      stock,
      stockText: isInStock ? 'In Stock' : 'Out of Stock',
      stockColor: isInStock ? 'text-green-700' : 'text-red-600',
      dotColor: isInStock ? 'bg-green-500' : 'bg-red-500',
      bgColor: isInStock ? 'bg-green-50' : 'bg-red-50',
      borderColor: isInStock ? 'border-green-200' : 'border-red-200'
    };
  };

  const stockStatus = getStockStatus();
  const savings = mrp - price;

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300">
      
      {/* Product Header with Badges */}
      <div className="relative">
        {/* Product Image */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <Link to={productSlug} className="block w-full h-full">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { 
                console.error('🖼️ Image failed to load:', image);
                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                e.currentTarget.classList.add('bg-gray-100', 'p-8');
              }}
            />
          </Link>
          
          {/* Product Type Badge */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
              item.productType === 'prebuilt-pc'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-purple-100 text-purple-800 border border-purple-200'
            }`}>
              {item.productType === 'prebuilt-pc' ? (
                <>
                  <Cpu className="w-3 h-3" />
                  Pre-built PC
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  Product
                </>
              )}
            </div>
          </div>
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Tag className="w-3 h-3" />
              -{discountPercentage}%
            </div>
          )}

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group/remove"
            title="Remove from wishlist"
          >
            <Trash2 className="w-4 h-4 group-hover/remove:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-5">
        {/* Product Name */}
        <Link to={productSlug} className="block mb-3">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors duration-200 group-hover:translate-x-1">
            {name}
          </h3>
        </Link>

        {/* Variant Attributes */}
        {item.variant?.attributes && item.variant.attributes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {item.variant.attributes.map((attr, index) => (
              <div key={index} className="bg-gray-50 px-2.5 py-1 rounded-lg text-xs">
                <span className="font-medium text-gray-700">{attr.label}:</span> 
                <span className="ml-1 text-gray-900 font-semibold">
                  {attr.displayValue || attr.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Section */}
        <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(price)}
              </span>
              {hasDiscount && mrp > price && (
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(mrp)}
                </span>
              )}
            </div>
            
            {/* Stock Status */}
            <div className={`text-xs font-semibold px-2.5 py-1.5 rounded-full ${stockStatus.bgColor} ${stockStatus.borderColor} border`}>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${stockStatus.dotColor}`}></div>
                <span className={stockStatus.stockColor}>
                  {stockStatus.stockText}
                </span>
              </div>
            </div>
          </div>

          {/* Savings */}
          {hasDiscount && savings > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                Save {formatPrice(savings)}
              </span>
              <span className="text-xs text-gray-500">
                {discountPercentage}% off
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleMoveToCart}
            disabled={!stockStatus.isInStock}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              stockStatus.isInStock 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {stockStatus.isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          
          <Link
            to={productSlug}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold text-center transition-all duration-200 border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Added on</span>
            </div>
            <span className="font-semibold text-gray-900">
              {new Date(item.addedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          
          {item.productType === 'prebuilt-pc' && (item.product as any)?.performanceRating && (
            <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Performance</span>
              </div>
              <span className="font-semibold text-gray-900">
                {(item.product as any).performanceRating}/10
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;