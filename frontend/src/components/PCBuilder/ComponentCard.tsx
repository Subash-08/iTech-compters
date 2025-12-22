import React from 'react';
import { Plus, Star, X } from 'lucide-react';
import { Product, Category } from '../types/pcBuilder';
// Assuming the utility function is in a file named 'utils' or 'imageUtils' in your project structure
import { getImageUrl } from '../utils/imageUtils'; 

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
  const handleCardClick = (e?: React.MouseEvent): void => {
    // Prevent bubbling if triggered from button
    if (e) e.stopPropagation();
    
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
      className={`group bg-white border rounded-xl p-4 transition-all duration-300 cursor-pointer relative overflow-hidden ${
        selected 
          ? 'border-blue-600 ring-1 ring-blue-600 shadow-md' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}
      onClick={() => handleCardClick()}
    >
      {/* Selection Indicator (Optional visual cue) */}
      {selected && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white p-1 rounded-bl-lg z-10">
          <Plus size={12} className="transform rotate-45" />
        </div>
      )}

      {/* Product Image - Using getImageUrl */}
      <div className="flex justify-center mb-4 bg-gray-50/50 rounded-lg p-2 h-36">
        <img
          src={getImageUrl(product.images || product.image)}
          alt={product.name}
          className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback if the utils function somehow fails or returns a 404 URL
            e.currentTarget.src = "https://placehold.co/300x300?text=No+Image";
          }}
        />
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem]" title={product.name}>
            {product.name}
          </h3>
          
          {/* Brand & Condition Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {product.brand && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide">
                {product.brand}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
              product.condition === 'New' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-amber-50 text-amber-700'
            }`}>
              {product.condition || 'New'}
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {renderStars(product.rating || 0)}
          </div>
          <span className="text-xs text-gray-400 ml-1">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Footer: Price removed, Action Button aligned right */}
        <div className="flex items-center justify-end pt-2 border-t border-gray-50">
          
          {/* Stock Status (Left side) */}
          <div className={`text-xs font-medium mr-auto flex items-center gap-1 ${
            product.inStock ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </div>

          {/* Action Button */}
          <button
            onClick={handleCardClick}
            disabled={!product.inStock && !selected}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              selected
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
            } ${(!product.inStock && !selected) ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
          >
            {selected ? (
              <>
                <X size={14} /> Remove
              </>
            ) : (
              <>
                <Plus size={14} /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;