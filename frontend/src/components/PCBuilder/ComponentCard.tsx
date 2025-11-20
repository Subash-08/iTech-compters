import React from 'react';
import { Plus, Star } from 'lucide-react';
import { Product, Category } from '../types/pcBuilder';

interface ComponentCardProps {
  product: Product;
  selected: boolean;
  onSelect: (product: Product) => void;
  onRemove: () => void;
  category: Category;
}

const ComponentCard: React.FC<ComponentCardProps> = ({ 
  product, 
  selected, 
  onSelect, 
  onRemove,
  category 
}) => {
  const handleCardClick = (): void => {
    if (selected) {
      onRemove();
    } else {
      onSelect(product);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div
      className={`bg-white border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="flex justify-center mb-3">
        <img
          src={product.image || '/api/placeholder/200/150'}
          alt={product.name}
          className="h-32 object-contain"
        />
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {renderStars(product.rating || 0)}
          <span className="text-xs text-gray-500 ml-1">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Brand & Condition */}
        <div className="flex flex-wrap gap-1">
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            {product.brand}
          </span>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
            {product.condition}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-blue-600">
              ₹{product.price?.toLocaleString()}
            </div>
            {product.originalPrice > product.price && (
              <div className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice?.toLocaleString()}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
              selected
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Plus size={14} />
            {selected ? 'Remove' : 'Add'}
          </button>
        </div>

        {/* Stock Status */}
        <div className={`text-xs font-medium ${
          product.inStock ? 'text-green-600' : 'text-red-600'
        }`}>
          {product.inStock ? 'In stock' : 'Out of stock'}
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;