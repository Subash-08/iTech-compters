// components/wishlist/WishlistItem.tsx - COMPLETE FIXED VERSION
import React from 'react';
import { Link } from 'react-router-dom';
import { WishlistItem as WishlistItemType } from '../../redux/types/wishlistTypes';
import { useAppDispatch } from '../../redux/hooks';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { cartActions } from '../../redux/actions/cartActions';
import { baseURL } from '../config/config';

interface WishlistItemProps {
  item: WishlistItemType;
  onRemove: (itemId: string, productType: 'product' | 'prebuilt-pc') => void;
}

// Helper function to get full image URL - FIXED VERSION
const getFullImageUrl = (url: string): string => {
  
  if (!url || url.trim() === '') {
    return '/images/placeholder-product.jpg';
  }
  
  // 1. Handle live server URLs - CONVERT TO LOCAL
  if (url.includes('itech-compters.onrender.com')) {
    // Extract the path from the live URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Use local server instead
    const LOCAL_API_URL = 'http://localhost:5000'; // Your local backend
    return `${LOCAL_API_URL}${path}`;
  }
  
  // 2. Handle other external URLs (keep as-is but log)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    
    // Optionally convert any other external URLs to local
    if (url.includes('render.com') || url.includes('onrender.com')) {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const LOCAL_API_URL = 'http://localhost:5000';
      return `${LOCAL_API_URL}${path}`;
    }
    
    return url;
  }
  
  // 3. Handle data URLs
  if (url.startsWith('data:')) {
    return url;
  }
  
  // 4. Handle relative paths - prepend local API URL
  const LOCAL_API_URL = process.env.REACT_APP_API_URL || baseURL;
  const cleanBaseUrl = LOCAL_API_URL.endsWith('/') ? LOCAL_API_URL.slice(0, -1) : LOCAL_API_URL;
    
  if (url.startsWith('/uploads/')) {
    const fullUrl = `${cleanBaseUrl}${url}`;
    return fullUrl;
  }
  
  if (url.startsWith('/')) {
    const fullUrl = `${cleanBaseUrl}${url}`;
    return fullUrl;
  }
  
  // 5. Handle filenames only
  if (!url.includes('/')) {
    const fullUrl = `${cleanBaseUrl}/uploads/products/${url}`;
    return fullUrl;
  }
  return '/images/placeholder-product.jpg';
};


const WishlistItem: React.FC<WishlistItemProps> = ({ item, onRemove }) => {
  const dispatch = useAppDispatch();


// In WishlistItem.tsx - FIXED handleRemove function
const handleRemove = () => {
    
    // ✅ FIXED: Pass item._id (wishlist item ID), not product._id
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
        await dispatch(cartActions.addPreBuiltPCToCart({ 
          pcId: (item.product as any)._id, 
          quantity: 1 
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

  // FIXED: Better data extraction with comprehensive price checking
  const getDisplayData = () => {
    console.log('💰 Price calculation for:', item.product?.name);
    
    let price = 0;
    let mrp = 0;
    let name = item.product?.name || 'Product';
    let imageUrl = '';

    // 1. First check if we have variant data
    if (item.variant && item.variant.price !== undefined) {
      price = item.variant.price || 0;
      mrp = item.variant.mrp || price;
      if (item.variant.name) {
        name = `${item.product?.name || ''} - ${item.variant.name}`;
      }
      console.log('✅ Using variant price:', { price, mrp });
    } 
    // 2. Check if product has direct pricing data
    else {
      const product = item.product as any;
      
      // Log all price-related fields for debugging
      console.log('🔍 Product price fields:', {
        effectivePrice: product.effectivePrice,
        sellingPrice: product.sellingPrice,
        basePrice: product.basePrice,
        price: product.price,
        lowestPrice: product.lowestPrice,
        displayPrice: product.displayPrice,
        mrp: product.mrp,
        displayMrp: product.displayMrp
      });
      
      // Try multiple price fields in priority order
      const possiblePriceFields = [
        product.effectivePrice,
        product.sellingPrice,
        product.displayPrice,
        product.basePrice,
        product.price,
        product.lowestPrice
      ];
      
      const possibleMrpFields = [
        product.mrp,
        product.displayMrp,
        product.basePrice
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

    // Get image URL
    const product = item.product as any;
    imageUrl = product.images?.thumbnail?.url || 
               product.primaryImage?.url ||
               product.images?.gallery?.[0]?.url ||
               product.image ||
               '';

    const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    console.log('🎯 Final display data:', { 
      name, 
      price, 
      mrp, 
      discountPercentage,
      imageUrl 
    });

    return { 
      price, 
      mrp, 
      discountPercentage, 
      name, 
      image: getFullImageUrl(imageUrl) 
    };
  };


  const { price, mrp, discountPercentage, name, image } = getDisplayData();
  const hasDiscount = discountPercentage > 0;
  const productSlug = item.productType === 'prebuilt-pc' 
    ? `/prebuilt-pc/${item.product.slug}`
    : `/product/${item.product.slug}`;

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
    } else if (item.product.stockQuantity !== undefined) {
      stock = item.product.stockQuantity;
    } else if ((item.product as any).stock !== undefined) {
      stock = (item.product as any).stock;
    } else if ((item.product as any).totalStock !== undefined) {
      stock = (item.product as any).totalStock;
    }
    
    const isInStock = stock > 0;
    
    return {
      isInStock,
      stock,
      stockText: isInStock ? 'In Stock' : 'Out of Stock',
      stockColor: isInStock ? 'text-green-700' : 'text-red-600',
      dotColor: isInStock ? 'bg-green-500' : 'bg-red-500'
    };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 group">
      
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Link to={productSlug} className="block w-full h-full">

<img
  src={image}
  alt={name}
  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
  onError={(e) => { 
    console.error('🖼️ Image failed to load:', image);
    // Use local placeholder instead of external URL
    e.currentTarget.src = `/images/placeholder-product.jpg`;
    e.currentTarget.classList.add('bg-gray-200');
  }}
/>
        </Link>
        
        {/* Remove Button */}
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
          title="Remove from wishlist"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercentage}%
          </div>
        )}

        {/* Variant Badge */}
        {item.variant && item.variant.name && (
          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
            Variant
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        
        {/* Product Name */}
        <Link to={productSlug} className="block mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors duration-200">
            {name}
          </h3>
        </Link>

        {/* Variant Attributes */}
        {item.variant?.attributes && item.variant.attributes.length > 0 && (
          <div className="mb-2 space-y-1">
            {item.variant.attributes.map((attr, index) => (
              <div key={index} className="text-xs text-gray-600 flex items-center">
                <span className="font-medium min-w-[60px]">{attr.label}:</span> 
                <span className="ml-1">{attr.displayValue || attr.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {hasDiscount && mrp > price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(mrp)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center mb-4">
          <span className={`w-2 h-2 rounded-full mr-2 ${stockStatus.dotColor}`}></span>
          <span className={`text-xs font-medium ${stockStatus.stockColor}`}>
            {stockStatus.stockText}
            {stockStatus.isInStock && stockStatus.stock > 0 && (
              <span className="text-gray-500 ml-1">
                ({stockStatus.stock} available)
              </span>
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleMoveToCart}
            disabled={!stockStatus.isInStock}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
              stockStatus.isInStock 
                ? 'bg-gray-900 text-white hover:bg-black' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {stockStatus.isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;