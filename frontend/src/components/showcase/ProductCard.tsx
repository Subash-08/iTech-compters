import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShoppingBag, ChevronRight } from 'lucide-react';
import { Product } from '../admin/types/product';
import AddToWishlistButton from '../product/AddToWishlistButton';
import AddToCartButton from '../product/AddToCartButton';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayPrice = product.offerPrice || product.basePrice;
  const originalPrice = product.basePrice;
  const hasDiscount = product.offerPrice && product.offerPrice < product.basePrice;

  const discountPercentage =
    hasDiscount && product.discountPercentage
      ? product.discountPercentage
      : hasDiscount
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : 0;

  const inStock = product.stockQuantity > 0;
  const hasVariants = product.variants && product.variants.length > 0;

  // Format price
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden h-full flex flex-col border border-gray-100 hover:shadow-xl transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- IMAGE SECTION --- */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {/* Main Image */}
          <img
            src={product.images?.thumbnail?.url || ''}
            alt={product.images?.thumbnail?.altText || product.name}
            width={300}
            height={400}
            className={`w-full h-full object-contain transition-all duration-700 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = '/placeholder.png';
              e.currentTarget.className = 'w-full h-full object-contain p-4';
            }}
          />

          {/* Hover Image */}
          {product.images?.hoverImage?.url && (
            <img
              src={product.images.hoverImage.url}
              alt={`${product.name} hover`}
              width={400}
              height={500}
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500 opacity-0 group-hover:opacity-100"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </Link>

        {/* Loading Spinner */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
          </div>
        )}

        {/* --- DISCOUNT BADGE (NO BLUR) --- */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          {discountPercentage > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              -{discountPercentage}% OFF
            </span>
          )}

          {!inStock && (
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-gray-200">
              Out of Stock
            </span>
          )}
        </div>

        {/* --- ACTION BUTTONS (NO BLUR) --- */}
        <div
          className={`absolute top-3 right-3 z-20 flex flex-col gap-2 transition-all duration-500 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}
        >
          {/* Wishlist */}
          <div className="bg-white rounded-full shadow-lg p-2 hover:shadow-xl transition-all duration-300">
            <AddToWishlistButton
              productId={product._id}
              product={product}
              className="p-1.5 text-gray-600 hover:text-red-500 transition-colors duration-300"
              iconSize="w-4 h-4"
            />
          </div>

          {/* Quick View */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="bg-white rounded-full shadow-lg p-2.5 text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all duration-300"
            aria-label="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* --- OUT OF STOCK OVERLAY (NO BLUR) --- */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg transform -rotate-3 transition-transform duration-300 group-hover:rotate-0">
              <span className="text-sm font-bold uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- PRODUCT INFO --- */}
      <div className="p-3 flex flex-col flex-1 bg-white">

        {/* Brand */}
        <div className="mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {product.brand?.name || 'Premium Brand'}
          </span>
        </div>

        {/* Title */}
        <Link to={`/product/${product.slug}`} className="block mb-1 group/title">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 transition-colors duration-300 group-hover/title:text-blue-600">
            {product.name}
          </h3>
        </Link>

        {/* PRICE */}
        <div className="mt-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(displayPrice)}
            </span>

            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through decoration-gray-300">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Low Stock Info */}
          {inStock && product.stockQuantity && product.stockQuantity < 20 && (
            <div className="flex items-center mb-1">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-xs text-gray-500">
                Only {product.stockQuantity} left
              </span>
            </div>
          )}
        </div>

        {/* --- ADD TO CART OR VARIANT OPTIONS --- */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          {hasVariants ? (
            <Link
              to={`/product/${product.slug}`}
              className="flex items-center justify-center w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>View Options</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          ) : (
            <AddToCartButton
              productId={product._id}
              product={product}
              disabled={!inStock}
              quantity={1}
              className={`w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                inStock
                  ? 'bg-gray-900 text-white hover:bg-blue-700 hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </AddToCartButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
