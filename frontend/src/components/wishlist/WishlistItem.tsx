// components/wishlist/WishlistItem.tsx - COMPLETE FIXED VERSION
import React from 'react';
import { Link } from 'react-router-dom';
import { WishlistItem as WishlistItemType } from '../../redux/types/wishlistTypes';
import { useAppDispatch } from '../../redux/hooks';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { cartActions } from '../../redux/actions/cartActions';

interface WishlistItemProps {
  item: WishlistItem;
  onRemove: (itemId: string, productType: 'product' | 'prebuilt-pc') => void; // ✅ Add productType
}

const WishlistItem: React.FC<WishlistItemProps> = ({ item, onRemove }) => {
  const dispatch = useAppDispatch();

const handleRemove = () => {
    console.log('🗑️ Removing wishlist item:', {
        wishlistItemId: item._id,
        productId: item.product._id, // This is what backend needs
        productType: item.productType
    });
    
    // ✅ FIXED: Send PRODUCT ID, not wishlist item ID
    onRemove(item.product._id, item.productType || 'product');
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

  // ✅ FIXED: Better data extraction with type safety
  const getDisplayData = () => {
    // Use backend-enhanced data if available
    if (item.displayPrice !== undefined) {
      return {
        price: item.displayPrice || 0,
        mrp: item.displayMrp || 0,
        discountPercentage: item.discountPercentage || 0,
        name: item.displayName || item.product.name,
        image: item.image || getProductImage()
      };
    }

    // Fallback: Calculate locally
    let price = 0;
    let mrp = 0;
    let name = item.product.name;

    // Use variant data if available
    if (item.variant) {
      price = item.variant.price || 0;
      mrp = item.variant.mrp || price;
      if (item.variant.name) {
        name = `${item.product.name} - ${item.variant.name}`;
      }
    } else {
      // Use product pricing
      const product = item.product as any;
      price = product.offerPrice > 0 ? product.offerPrice : 
             product.basePrice > 0 ? product.basePrice : 
             product.price > 0 ? product.price : 0;
      mrp = product.mrp > 0 ? product.mrp : price;
    }

    const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    return { 
      price, 
      mrp, 
      discountPercentage, 
      name, 
      image: getProductImage() 
    };
  };

  // ✅ FIXED: Better image handling
  const getProductImage = (): string => {
    if (item.productType === 'prebuilt-pc') {
      const pc = item.product as any;
      return pc.images?.[0]?.url;
    } else {
      const product = item.product as any;
      return product.images?.thumbnail?.url || 
             product.images?.hoverImage?.url ||
             product.images?.gallery?.[0]?.url 
             ;
    }
  };

  // ✅ FIXED: Better slug handling
  const getProductSlug = (): string => {
    if (item.productType === 'prebuilt-pc') {
      return `/prebuilt-pc/${item.product.slug}`;
    }
    return `/product/${item.product.slug}`;
  };

  const { price, mrp, discountPercentage, name, image } = getDisplayData();
  const hasDiscount = discountPercentage > 0;
  const productSlug = getProductSlug();

  // Currency formatter
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // ✅ FIXED: Better stock status handling
  const getStockStatus = () => {
    let stock = 0;
    
    if (item.variant?.stock !== undefined) {
      stock = item.variant.stock;
    } else if (item.product.stockQuantity !== undefined) {
      stock = item.product.stockQuantity;
    } else if ((item.product as any).stock !== undefined) {
      stock = (item.product as any).stock;
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

  console.log('🖼️ WishlistItem data:', {
    itemId: item._id,
    productType: item.productType,
    productName: item.product.name,
    variantName: item.variant?.name,
    price,
    image
  });

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
              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+1'; 
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
        {item.variant && (
          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
            Variant
          </div>
        )}

        {/* Pre-built PC Badge */}
        {item.productType === 'prebuilt-pc' && (
          <div className="absolute bottom-2 right-2 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded">
            Pre-built PC
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        
        {/* Brand/Category */}
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {item.productType === 'prebuilt-pc' 
            ? (item.product as any).category 
            : item.product.brand?.name}
        </div>

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
                {attr.hexCode && (
                  <span 
                    className="w-3 h-3 rounded-full ml-2 border border-gray-300"
                    style={{ backgroundColor: attr.hexCode }}
                  />
                )}
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
          
          <Link
            to={productSlug}
            className="flex items-center justify-center w-10 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            title="Quick View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;