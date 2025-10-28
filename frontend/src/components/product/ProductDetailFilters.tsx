import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { AvailableFilters, ProductFilters, Product } from '../../redux/types/productTypes';

interface ProductFiltersProps {
  showFilters: boolean;
  availableFilters: AvailableFilters;
  currentFilters: ProductFilters;
  onUpdateFilter: (key: string, value: string | number | boolean) => void;
  onClearFilters: () => void;
  shouldShowFilter: (filterType: 'brand' | 'category') => boolean;
  products: Product[];
}

const ProductDetailFilters: React.FC<ProductFiltersProps> = ({
  showFilters,
  availableFilters,
  currentFilters,
  onUpdateFilter,
  onClearFilters,
  shouldShowFilter,
  products,
}) => {
  // ✅ FIXED: Initialize with current filters, don't use availableFilters.maxPrice as default
  const [sliderValues, setSliderValues] = useState([
    currentFilters.minPrice || 0, 
    currentFilters.maxPrice || 5000 // Use fixed default, not availableFilters.maxPrice
  ]);

  // ✅ FIXED: Only update slider when user changes filters, NOT when available max price changes
  useEffect(() => {
    // Only update if the user hasn't set a custom max price
    if (!currentFilters.maxPrice || currentFilters.maxPrice === availableFilters.maxPrice) {
      setSliderValues([
        currentFilters.minPrice || 0, 
        availableFilters.maxPrice
      ]);
    } else {
      setSliderValues([
        currentFilters.minPrice || 0, 
        currentFilters.maxPrice
      ]);
    }
  }, [currentFilters.minPrice, currentFilters.maxPrice]); // Removed availableFilters.maxPrice dependency

  // Get available options based on current filters
  const getAvailableOptions = (type: 'brands' | 'categories') => {
    let availableOptions = availableFilters[type];
    
    if (type === 'categories' && currentFilters.brand) {
      const brandCategories = new Set<string>();
      products.forEach(product => {
        if (product.brand?.name === currentFilters.brand) {
          product.categories?.forEach(cat => {
            if (cat.name) brandCategories.add(cat.name);
          });
        }
      });
      availableOptions = Array.from(brandCategories).sort();
    }
    
    if (type === 'brands' && currentFilters.category) {
      const categoryBrands = new Set<string>();
      products.forEach(product => {
        if (product.categories?.some(cat => cat.name === currentFilters.category)) {
          if (product.brand?.name) categoryBrands.add(product.brand.name);
        }
      });
      availableOptions = Array.from(categoryBrands).sort();
    }
    
    return availableOptions;
  };

  // Check if user has applied custom price filter
  const hasCustomPriceFilter = currentFilters.minPrice > 0 || 
    (currentFilters.maxPrice && currentFilters.maxPrice < availableFilters.maxPrice);

  return (
    <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        </div>

        {/* Price Range Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Price Range</h3>
            {hasCustomPriceFilter && (
              <button
                onClick={() => {
                  onUpdateFilter('minPrice', 0);
                  onUpdateFilter('maxPrice', availableFilters.maxPrice);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-4">
            {/* Slider */}
            <div className="px-2">
              <Slider
                range
                min={0}
                max={availableFilters.maxPrice}
                value={sliderValues}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    setSliderValues(value);
                  }
                }}
                onAfterChange={(value) => {
                  if (Array.isArray(value)) {
                    onUpdateFilter('minPrice', value[0]);
                    onUpdateFilter('maxPrice', value[1]);
                  }
                }}
                trackStyle={[{ backgroundColor: '#3b82f6', height: 6 }]}
                handleStyle={[
                  {
                    backgroundColor: '#ffffff',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    height: 18,
                    width: 18,
                    opacity: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  },
                  {
                    backgroundColor: '#ffffff',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    height: 18,
                    width: 18,
                    opacity: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  },
                ]}
                railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
                activeDotStyle={{ borderColor: '#3b82f6' }}
              />
            </div>

            {/* Price Display and Inputs */}
            <div className="flex items-center justify-between space-x-4">
              <div className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded">
                ${sliderValues[0].toLocaleString()} - ${sliderValues[1].toLocaleString()}
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Min:</span>
                  <input
                    type="number"
                    value={currentFilters.minPrice || 0}
                    onChange={(e) => {
                      const newMin = Number(e.target.value);
                      if (newMin >= 0 && newMin <= (currentFilters.maxPrice || availableFilters.maxPrice)) {
                        onUpdateFilter('minPrice', newMin);
                      }
                    }}
                    min={0}
                    max={currentFilters.maxPrice || availableFilters.maxPrice}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Max:</span>
                  <input
                    type="number"
                    value={currentFilters.maxPrice || availableFilters.maxPrice}
                    onChange={(e) => {
                      const newMax = Number(e.target.value);
                      if (newMax >= (currentFilters.minPrice || 0) && newMax <= availableFilters.maxPrice) {
                        onUpdateFilter('maxPrice', newMax);
                      }
                    }}
                    min={currentFilters.minPrice || 0}
                    max={availableFilters.maxPrice}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Available Range Info */}
            <div className="text-xs text-gray-500 text-center bg-blue-50 py-1 rounded">
              Max available: ${availableFilters.maxPrice.toLocaleString()}
            </div>

            {/* Quick Price Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[100, 250, 500, 1000].map((price) => (
                <button
                  key={price}
                  onClick={() => {
                    onUpdateFilter('minPrice', 0);
                    onUpdateFilter('maxPrice', price);
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    currentFilters.maxPrice === price && currentFilters.minPrice === 0
                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  Under ${price}
                </button>
              ))}
              <button
                onClick={() => {
                  onUpdateFilter('minPrice', 0);
                  onUpdateFilter('maxPrice', availableFilters.maxPrice);
                }}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  currentFilters.maxPrice === availableFilters.maxPrice && currentFilters.minPrice === 0
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                All Prices
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        {shouldShowFilter('category') && getAvailableOptions('categories').length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Category</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getAvailableOptions('categories').map(category => (
                <label key={category} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={currentFilters.category === category}
                    onChange={() => onUpdateFilter('category', category)}
                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Brand Filter */}
        {shouldShowFilter('brand') && getAvailableOptions('brands').length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Brand</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getAvailableOptions('brands').map(brand => (
                <label key={brand} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={currentFilters.brand === brand}
                    onChange={() => onUpdateFilter('brand', brand)}
                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* In Stock Filter */}
        <div className="mb-6">
          <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={currentFilters.inStock || false}
              onChange={(e) => onUpdateFilter('inStock', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">In Stock Only</span>
          </label>
        </div>

        {/* Rating Filter */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Customer Rating</h3>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={currentFilters.rating === rating}
                  onChange={() => onUpdateFilter('rating', rating)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 flex items-center">
                  {rating}+ Stars
                  <span className="ml-1 text-yellow-400">{"★".repeat(rating)}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Condition Filter */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Condition</h3>
          <div className="space-y-2">
            {availableFilters.conditions.map(condition => (
              <label key={condition} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  checked={currentFilters.condition === condition}
                  onChange={() => onUpdateFilter('condition', condition)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">{condition}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasCustomPriceFilter && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-2">Active Price Filter:</div>
              <div className="flex justify-between">
                <span>Range:</span>
                <span className="font-medium">
                  ${currentFilters.minPrice || 0} - ${currentFilters.maxPrice || availableFilters.maxPrice}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailFilters;