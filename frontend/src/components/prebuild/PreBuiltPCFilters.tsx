// components/prebuilt/PreBuiltPCFilters.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PreBuiltPCFilters as FiltersType, AvailablePreBuiltPCFilters } from '../../redux/types/preBuiltPCTypes';
import { X, Check } from 'lucide-react';

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
  // Local state for smoother slider interaction
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || availableFilters.priceRange.min,
    max: filters.maxPrice || availableFilters.priceRange.max
  });

  // Sync local state when props change
  useEffect(() => {
    setPriceRange({
      min: filters.minPrice || availableFilters.priceRange.min,
      max: filters.maxPrice || availableFilters.priceRange.max
    });
  }, [filters.minPrice, filters.maxPrice, availableFilters.priceRange]);

  const hasActiveFilters = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.minRating || 
    filters.inStock ||
    filters.featured;

  // Handle slider changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = Number(e.target.value);
    const newRange = { ...priceRange, [type]: value };
    
    // Validate range overlap
    if (type === 'min' && value > priceRange.max) newRange.max = value;
    if (type === 'max' && value < priceRange.min) newRange.min = value;
    
    setPriceRange(newRange);
  };

  // Commit changes on mouse up / touch end
  const commitPriceChange = () => {
    onFilterChange({
      minPrice: priceRange.min,
      maxPrice: priceRange.max
    });
  };

  // Calculate percentage for slider track background
  const getPercent = useCallback((value: number) => {
    const min = availableFilters.priceRange.min;
    const max = availableFilters.priceRange.max;
    return Math.round(((value - min) / (max - min)) * 100);
  }, [availableFilters.priceRange]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 lg:hidden">
        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Desktop Clear All (Top Right of Sidebar) */}
      {hasActiveFilters && (
        <div className="hidden lg:flex justify-end mb-2">
          <button
            onClick={onClearFilters}
            className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Clear Filters
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div>
        <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Category</h4>
        <div className="space-y-2.5">
          <label className="flex items-center cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filters.category}
                onChange={() => onFilterChange({ category: undefined })}
                className="peer sr-only"
              />
              <div className="w-4 h-4 border border-gray-300 rounded-full bg-white peer-checked:border-blue-600 peer-checked:bg-white transition-all">
                <div className="w-2 h-2 bg-blue-600 rounded-full absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="ml-3 text-sm text-gray-600 group-hover:text-blue-600 transition-colors">All Categories</span>
          </label>

          {availableFilters.categories.map((category) => (
            <label key={category} className="flex items-center cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={filters.category === category}
                  onChange={(e) => onFilterChange({ category: e.target.value })}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 border border-gray-300 rounded-full bg-white peer-checked:border-blue-600 peer-checked:bg-white transition-all">
                  <div className="w-2 h-2 bg-blue-600 rounded-full absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="ml-3 text-sm text-gray-600 group-hover:text-blue-600 transition-colors capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Price Range Filter (Slider) */}
      <div>
        <h4 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">Price Range</h4>
        
        <div className="px-2">
          {/* Slider Visuals */}
          <div className="relative h-1 bg-gray-200 rounded-full mb-6">
            <div 
              className="absolute h-full bg-blue-600 rounded-full"
              style={{ 
                left: `${getPercent(priceRange.min)}%`, 
                right: `${100 - getPercent(priceRange.max)}%` 
              }}
            />
            {/* Invisible Range Inputs overlaid */}
            <input
              type="range"
              min={availableFilters.priceRange.min}
              max={availableFilters.priceRange.max}
              value={priceRange.min}
              onChange={(e) => handlePriceChange(e, 'min')}
              onMouseUp={commitPriceChange}
              onTouchEnd={commitPriceChange}
              className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 z-20"
            />
            <input
              type="range"
              min={availableFilters.priceRange.min}
              max={availableFilters.priceRange.max}
              value={priceRange.max}
              onChange={(e) => handlePriceChange(e, 'max')}
              onMouseUp={commitPriceChange}
              onTouchEnd={commitPriceChange}
              className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 z-20"
            />
            
            {/* Visual Thumbs */}
            <div 
              className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full -mt-1.5 -ml-2 shadow cursor-grab z-10"
              style={{ left: `${getPercent(priceRange.min)}%` }}
            />
            <div 
              className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full -mt-1.5 -ml-2 shadow cursor-grab z-10"
              style={{ left: `${getPercent(priceRange.max)}%` }}
            />
          </div>

          {/* Inputs */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => handlePriceChange(e, 'min')}
                onBlur={commitPriceChange}
                className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded text-sm font-medium text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => handlePriceChange(e, 'max')}
                onBlur={commitPriceChange}
                className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded text-sm font-medium text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Availability Filter */}
      <div>
        <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Status</h4>
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => onFilterChange({ inStock: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border border-gray-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all">
                <Check size={14} className="text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100" />
              </div>
            </div>
            <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">In Stock Only</span>
          </label>

          <label className="flex items-center cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={filters.featured || false}
                onChange={(e) => onFilterChange({ featured: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border border-gray-300 rounded bg-white peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-all">
                <Check size={14} className="text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100" />
              </div>
            </div>
            <span className="ml-3 text-sm text-gray-600 group-hover:text-purple-700 transition-colors font-medium">Featured Deals</span>
          </label>
        </div>
      </div>

    </div>
  );
};

export default PreBuiltPCFilters;