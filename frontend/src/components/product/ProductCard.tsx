import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../redux/types/productTypes';
import AddToWishlistButton from './AddToWishlistButton';
import AddToCartButton from './AddToCartButton'; // Import the AddToCartButton

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const displayPrice = product.offerPrice || product.basePrice;
  const originalPrice = product.basePrice;
  const hasDiscount = displayPrice < originalPrice;
  const inStock = product.stockQuantity > 0;

  // Check if product has variants
  const hasVariants = product.variants && product.variants.length > 0;

  // Render star rating
  const renderStars = (rating: number) => {
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
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col relative">
      {/* Wishlist Button - Top Right Corner */}
      <div className="absolute top-3 right-3 z-10">
        <AddToWishlistButton 
          productId={product._id}
          className="bg-white shadow-md hover:shadow-lg"
        />
      </div>

      <Link to={`/product/${product.slug}`} className="block p-4 flex-1">
        <div className="relative mb-4">
          <img
            src={product.images?.thumbnail?.url || 'https://via.placeholder.com/300x300?text=Product+1'}
            alt={product.images?.thumbnail?.altText || product.name}
            className="w-full h-48 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+1';
            }}
          />
          
          {hasDiscount && product.discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {product.discountPercentage}% OFF
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
            {product.name}
          </h3>

          {product.averageRating > 0 && (
            <div className="flex items-center space-x-1">
              {renderStars(product.averageRating)}
              <span className="text-sm text-gray-500 ml-1">
                ({product.averageRating.toFixed(1)})
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && originalPrice > displayPrice && (
              <span className="text-lg text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Condition: {product.condition}
          </div>

          <div className={`text-sm font-medium ${
            inStock ? 'text-green-600' : 'text-red-600'
          }`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button - Bottom of Card */}
      <div className="p-4 pt-2 border-t border-gray-100">
        {hasVariants ? (
          // If product has variants, show a button that links to product page
          <Link 
            to={`/product/${product.slug}`}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center block"
          >
            View Options
          </Link>
        ) : (
          // If no variants, show direct Add to Cart button
          <AddToCartButton
            productId={product._id}
            className="w-full"
            quantity={1}
          />
        )}
      </div>
    </div>
  );
};

export default ProductCard;