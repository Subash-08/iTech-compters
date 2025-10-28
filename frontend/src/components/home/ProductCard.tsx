
import React from 'react';
import { Product } from '../../types';
import StarIcon from '../icons/StarIcon';
import HeartIcon from '../icons/HeartIcon';
import EyeIcon from '../icons/EyeIcon';
import CartIcon from '../icons/CartIcon';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 ease-in-out group flex flex-col h-full transform hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-t-lg">
        <a href="#">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-56 object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              loading="lazy"
            />
        </a>
        
        {product.status && (
          <span className={`absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-full ${
            product.status === 'Sale' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {product.status}
          </span>
        )}
        
        {product.originalPrice && product.status === 'Sale' && (
          <span className="absolute top-3 right-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </span>
        )}
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            className="p-2.5 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors" 
            aria-label="Add to wishlist"
            title="Add to wishlist"
          >
            <HeartIcon className="w-5 h-5 text-gray-700" />
          </button>
          <button 
            className="p-2.5 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors" 
            aria-label="Quick view"
            title="Quick view"
          >
            <EyeIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-gray-800 h-12 line-clamp-2 mb-2">
          <a href="#" className="hover:text-blue-600 transition-colors">{product.name}</a>
        </h3>
        
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                ))}
            </div>
            <span className="text-xs text-gray-500 font-medium mt-0.5">{product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
        </div>
        
        <div className="mt-auto pt-3 flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
            {product.originalPrice && (
                <p className="text-sm text-gray-500 line-through">${product.originalPrice.toFixed(2)}</p>
            )}
        </div>
        
        <button className="mt-4 w-full flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ease-in-out transform hover:scale-105">
          <CartIcon className="w-5 h-5 mr-2"/>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
