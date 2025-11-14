// src/components/showcase/ProductCard.tsx - FIXED
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Eye, Zap } from 'lucide-react';
import { Product } from '../admin/types/product';
import AddToWishlistButton from '../product/AddToWishlistButton';
import AddToCartButton from '../product/AddToCartButton';

interface ProductCardProps {
  product: Product;
  cardStyle?: 'modern' | 'minimal' | 'elegant' | 'bold' | 'glass' | 'gradient';
  animation?: 'fade' | 'slide' | 'zoom' | 'flip' | 'bounce';
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cardStyle = 'modern',
  animation = 'fade',
  onQuickView,
  onAddToCart,
  onAddToWishlist
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const displayPrice = product.offerPrice || product.basePrice;
  const originalPrice = product.basePrice;
  const hasDiscount = product.offerPrice && product.offerPrice < product.basePrice;
  const inStock = product.stockQuantity > 0;
  const hasVariants = product.variants && product.variants.length > 0;

  const getCardClasses = () => {
    const baseClasses = "relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-102 h-full flex flex-col group";
    
    const styleClasses = {
      modern: "bg-white shadow-sm hover:shadow-md border border-gray-100",
      minimal: "bg-white border border-gray-200 hover:border-gray-300",
      elegant: "bg-white shadow-sm hover:shadow-md border border-gray-100",
      bold: "bg-gray-900 text-white shadow-md",
      glass: "bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm",
      gradient: "bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm hover:shadow-md"
    };

    const animationClasses = {
      fade: "animate-fade-in",
      slide: "animate-slide-in",
      zoom: "animate-zoom-in",
      flip: "group-hover:rotate-y-180",
      bounce: "hover:animate-bounce"
    };

    return `${baseClasses} ${styleClasses[cardStyle]} ${animationClasses[animation]}`;
  };

  const getDiscountBadge = () => {
    if (!product.discountPercentage || product.discountPercentage <= 0) return null;
    
    return (
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
          -{product.discountPercentage}%
        </div>
      </div>
    );
  };

  const getStockBadge = () => {
    const stock = product.stockQuantity || 0;
    if (stock === 0) {
      return (
        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          Out of Stock
        </div>
      );
    }
    if (stock < 10) {
      return (
        <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          Low Stock
        </div>
      );
    }
    return null;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <div
      className={getCardClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Section with Link */}
      <Link 
        to={`/product/${product.slug}`} 
        className="block flex-1 p-3"
      >
        <div className="relative mb-3">
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            {/* Main Image */}
            <img
              src={product.images?.thumbnail?.url || 'https://via.placeholder.com/300x300?text=Product+Image'}
              alt={product.images?.thumbnail?.altText || product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+Image';
              }}
            />
            
            {/* Hover Image */}
            {product.images?.hoverImage?.url && (
              <img
                src={product.images.hoverImage.url}
                alt={product.images.hoverImage.altText || product.name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+Image';
                }}
              />
            )}
            
            {/* Loading Skeleton */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg" />
            )}

            {/* Out of Stock Overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-80 rounded-lg flex items-center justify-center">
                <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Badges */}
            {getDiscountBadge()}
            {getStockBadge()}

            {/* Wishlist Button - Top Right */}
            <div className="absolute top-1.5 right-1.5 z-10">
              <AddToWishlistButton 
                productId={product._id}
                className="bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md p-1.5"
                iconSize="w-3 h-3"
              />
            </div>

            {/* Quick View Button - Appears on Hover */}
            <div className={`absolute bottom-2 right-2 z-10 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}>
              <button
                onClick={handleQuickView}
                className="bg-white/90 backdrop-blur-sm text-gray-700 p-1.5 rounded-lg shadow-sm hover:shadow-md transform hover:scale-110 transition-all duration-200"
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1.5 flex-1">
          {/* Brand */}
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {product.brand?.name || 'No Brand'}
          </div>

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-tight min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="flex items-center space-x-1">
              <div className="flex items-center gap-0.5">
                {getRatingStars(product.averageRating)}
              </div>
              <span className="text-xs text-gray-500">
                ({product.averageRating.toFixed(1)})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              R{displayPrice.toFixed(2)}
            </span>
            {hasDiscount && originalPrice > displayPrice && (
              <span className="text-sm text-gray-500 line-through">
                R{originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className={`text-xs font-medium ${
            inStock ? 'text-green-600' : 'text-red-600'
          }`}>
            {inStock ? (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-green-500" />
                <span>In Stock</span>
              </div>
            ) : (
              'Out of Stock'
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button - Bottom of Card */}
      <div className="p-3 pt-2 border-t border-gray-100">
        {hasVariants ? (
          // If product has variants, show a button that links to product page
          <Link 
            to={`/product/${product.slug}`}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center block text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
          >
            View Options
          </Link>
        ) : (
          // If no variants, show direct Add to Cart button WITH PRODUCT DATA
          <AddToCartButton
            productId={product._id}
            productData={product} // ✅ ADD THIS - Pass the full product data
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 text-sm py-2"
            quantity={1}
            disabled={!inStock}
          />
        )}
      </div>
    </div>
  );
};

export default ProductCard;