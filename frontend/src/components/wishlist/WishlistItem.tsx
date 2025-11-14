// components/wishlist/WishlistItem.tsx - FIXED VERSION
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import { WishlistItem as WishlistItemType } from '../../redux/types/wishlistTypes';
import { Product } from '../../redux/types/productTypes';

interface WishlistItemProps {
  item: WishlistItemType;
  onRemove: (productId: string, productType: 'product' | 'prebuilt-pc') => void; // ✅ FIX: Add productType
}

const WishlistItem: React.FC<WishlistItemProps> = ({ item, onRemove }) => {
  // ✅ FIX: Get all products from Redux store to find complete product data
  const products = useAppSelector(state => state.productsState.products);
  
  // Find the complete product details from Redux store
  const findCompleteProduct = (productId: string): Product | null => {
    const completeProduct = products.find(p => p._id === productId);
    return completeProduct || null;
  };

  // Get product ID from the wishlist item
  const productId = item.product._id || item.product;
  
  // ✅ Get productType from the wishlist item
  const productType = item.productType || 'product';
  
  // ✅ Get complete product data from Redux store
  const completeProduct = findCompleteProduct(productId);
  const product = completeProduct || item.product; // Fallback to item data

  // ✅ FIX: Handle remove with productType
  const handleRemove = () => {
    onRemove(productId, productType);
  };

  if (!product) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-gray-500">Product not available</p>
        <button
          onClick={handleRemove}
          className="mt-2 text-red-500 text-sm hover:text-red-700"
        >
          Remove
        </button>
      </div>
    );
  }

  const productName = product.name || 'Unnamed Product';
  const productSlug = product.slug || productId;
  
  // ✅ Get prices from the complete product data
  const basePrice = product.basePrice || 0;
  const offerPrice = product.offerPrice || product.basePrice || 0;
  const discountPercentage = product.discountPercentage || 0;
  
  const hasDiscount = discountPercentage > 0 && offerPrice < basePrice;
  
  // ✅ Handle stock safely
  const stock = product.stockQuantity || product.totalStock || 0;
  const inStock = stock > 0;
  
  // ✅ Handle images safely - FIXED placeholder URL
  const getProductImage = (): string => {
    if (!product.images) return 'https://placehold.co/300x300/1e40af/ffffff?text=No+Image';
    
    if (product.images.thumbnail?.url) return product.images.thumbnail.url;
    if (product.images.hoverImage?.url) return product.images.hoverImage.url;
    if (product.images.gallery?.[0]?.url) return product.images.gallery[0].url;
    if (typeof product.images === 'string') return product.images;
    
    return 'https://placehold.co/300x300/1e40af/ffffff?text=No+Image';
  };

  const productImage = getProductImage();
  
  // ✅ Get brand name safely
  const getBrandName = (): string => {
    if (!product.brand) return 'No Brand';
    
    if (typeof product.brand === 'object') {
      return product.brand.name || 'No Brand';
    }
    
    return 'No Brand';
  };

  const brandName = getBrandName();

  // Render star rating
  const renderStars = (rating: number) => {
    if (!rating || rating === 0) return null;
    
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(numericRating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-500 ml-1">
          ({numericRating.toFixed(1)})
        </span>
      </div>
    );
  };

  // ✅ Show product type badge
  const getProductTypeBadge = () => {
    if (productType === 'prebuilt-pc') {
      return (
        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
          Pre-built PC
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link to={productType === 'prebuilt-pc' ? `/prebuilt-pcs/${productSlug}` : `/product/${productSlug}`} className="block p-4 flex-1">
        <div className="relative mb-4">
          <img
            src={productImage}
            alt={productName}
            className="w-full h-48 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/300x300/1e40af/ffffff?text=Product+Image';
            }}
          />
          
          {getProductTypeBadge()}
          
          {hasDiscount && discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {discountPercentage}% OFF
            </div>
          )}
          
          {!inStock && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-70 rounded-lg flex items-center justify-center">
              <span className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <div className="text-sm text-gray-500 uppercase tracking-wide">
            {brandName}
          </div>

          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors min-h-[3rem]">
            {productName}
          </h3>

          {renderStars(product.averageRating || 0)}

          {/* ✅ FIXED: Price display from complete product data */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              Rs {offerPrice.toLocaleString()}
            </span>
            {hasDiscount && basePrice > offerPrice && (
              <>
                <span className="text-lg text-gray-500 line-through">
                  Rs {basePrice.toLocaleString()}
                </span>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                  Save Rs {(basePrice - offerPrice).toLocaleString()}
                </span>
              </>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Condition: {product.condition || 'New'}
          </div>

          <div className={`text-sm font-medium ${
            inStock ? 'text-green-600' : 'text-red-600'
          }`}>
            {inStock ? `In Stock (${stock})` : 'Out of Stock'}
          </div>

          {/* ✅ Add product description if available */}
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </Link>

      {/* Remove Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleRemove}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Remove from Wishlist</span>
        </button>
      </div>
    </div>
  );
};

export default WishlistItem;