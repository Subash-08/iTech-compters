// components/prebuilt/PreBuiltPCFilters.tsx
import React from 'react';
import { PreBuiltPCFilters as FiltersType, AvailablePreBuiltPCFilters } from '../../redux/types/preBuiltPCTypes';

interface PreBuiltPCFiltersProps {
  filters: FiltersType;
  availableFilters: AvailablePreBuiltPCFilters;
  onFilterChange: (filters: Partial<FiltersType>) => void;
  onClearFilters: () => void;
}

const PreBuiltPCFilters: React.FC<PreBuiltPCFiltersProps> = ({
  filters,
  availableFilters,
  onFilterChange,
  onClearFilters
}) => {
  const hasActiveFilters = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.minRating || 
    filters.inStock;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Category</h4>
        <div className="space-y-2">
          {availableFilters.categories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="radio"
                name="category"
                value={category}
                checked={filters.category === category}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
          <button
            onClick={() => onFilterChange({ category: undefined })}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            Show All
          </button>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Price Range</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange({ 
                minPrice: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              min={0}
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange({ 
                maxPrice: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              min={0}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            Range: ${availableFilters.priceRange.min} - ${availableFilters.priceRange.max}
          </div>
        </div>
      </div>

      {/* Performance Rating Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Performance Rating</h4>
        <div className="space-y-2">
          {[8, 7, 6, 5].map((rating) => (
            <label key={rating} className="flex items-center">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={filters.minRating === rating}
                onChange={(e) => onFilterChange({ 
                  minRating: Number(e.target.value) 
                })}
                className="mr-2"
              />
              <span className="text-sm flex items-center">
                {rating}+ ⭐
              </span>
            </label>
          ))}
          <button
            onClick={() => onFilterChange({ minRating: undefined })}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            Any Rating
          </button>
        </div>
      </div>

      {/* Stock Status Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Availability</h4>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={(e) => onFilterChange({ inStock: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">In Stock Only</span>
        </label>
      </div>

      {/* Featured PCs Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Special</h4>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.featured || false}
            onChange={(e) => onFilterChange({ featured: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Featured PCs Only</span>
        </label>
      </div>
    </div>
  );
};

export default PreBuiltPCFilters;