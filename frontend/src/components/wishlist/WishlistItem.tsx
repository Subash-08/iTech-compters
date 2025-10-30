import React from 'react';
import { Link } from 'react-router-dom';
import { WishlistItem as WishlistItemType } from '../../redux/types/wishlistTypes';

interface WishlistItemProps {
  item: WishlistItemType;
  onRemove: (productId: string) => void;
}

const WishlistItem: React.FC<WishlistItemProps> = ({ item, onRemove }) => {
  const product = item.product;

  if (!product) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-gray-500">Product not available</p>
      </div>
    );
  }

  // ✅ Handle different price structures
  const displayPrice = product.discountPrice || product.offerPrice || product.price || product.basePrice || 0;
  const originalPrice = product.price || product.basePrice || 0;
  const hasDiscount = displayPrice < originalPrice && originalPrice > 0;
  
  // ✅ Handle stock
  const inStock = (product.stock || product.stockQuantity || 0) > 0;
  
  // ✅ Handle images
  const productImage = product.images?.thumbnail?.url || 
                      product.images?.[0]?.url || 
                      'https://via.placeholder.com/300x300?text=Product+Image';
  
  // ✅ Get display name - show variant name if available
  const getDisplayName = () => {
    if (item.variant?.name) {
      return item.variant.name;
    }
    return product.name || 'Product Name';
  };

  const productName = getDisplayName();
  const productSlug = product.slug || '';

  // Render star rating
  const renderStars = (rating: number) => {
    if (!rating || rating === 0) return null;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-500 ml-1">
          ({product.averageRating?.toFixed(1) || '0.0'})
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link to={`/product/${productSlug}`} className="block p-4 flex-1">
        <div className="relative mb-4">
          <img
            src={productImage}
            alt={productName}
            className="w-full h-48 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+Image';
            }}
          />
          
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {Math.round((1 - displayPrice / originalPrice) * 100)}% OFF
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
            {product.brand?.name || 'No Brand'}
          </div>

          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors min-h-[3rem]">
            {productName}
            {item.variant?.name && item.variant.name !== product.name && (
              <span className="text-sm font-normal text-gray-600 block">
                ({product.name})
              </span>
            )}
          </h3>

          {/* Show variant attributes if available */}
          {item.variant?.attributes && item.variant.attributes.length > 0 && (
            <div className="text-xs text-gray-500">
              {item.variant.attributes.map((attr, index) => (
                <span key={index}>
                  {attr.label}: {attr.displayValue || attr.value}
                  {index < item.variant.attributes.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {renderStars(product.averageRating || 0)}

          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              ${typeof displayPrice === 'number' ? displayPrice.toFixed(2) : '0.00'}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-500 line-through">
                ${typeof originalPrice === 'number' ? originalPrice.toFixed(2) : '0.00'}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Condition: {product.condition || 'New'}
          </div>

          <div className={`text-sm font-medium ${
            inStock ? 'text-green-600' : 'text-red-600'
          }`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>
      </Link>

      {/* Remove Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => onRemove(product._id)}
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