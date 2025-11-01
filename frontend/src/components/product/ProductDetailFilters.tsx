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
  // ✅ FIXED: Use BASE price range (not affected by current filters)
  const [sliderValues, setSliderValues] = useState([
    currentFilters.minPrice || availableFilters.baseMinPrice || 0, 
    currentFilters.maxPrice || availableFilters.baseMaxPrice || 5000
  ]);

  // ✅ FIXED: Update slider only when current filters change
  useEffect(() => {
    const currentMin = currentFilters.minPrice || availableFilters.baseMinPrice || 0;
    const currentMax = currentFilters.maxPrice || availableFilters.baseMaxPrice || 5000;
    
    setSliderValues([currentMin, currentMax]);
  }, [
    currentFilters.minPrice, 
    currentFilters.maxPrice, 
  ]);

  // ✅ FIXED: Handle slider change (real-time updates)
  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setSliderValues(value);
    }
  };

  // ✅ FIXED: Handle slider completion (update filters) - NO DEPRECATION WARNING
  const handleSliderComplete = (value: number | number[]) => {
    if (Array.isArray(value)) {
      console.log('💰 Slider completed - updating price filters:', value);
      onUpdateFilter('minPrice', value[0]);
      onUpdateFilter('maxPrice', value[1]);
    }
  };

  // ✅ FIXED: Handle direct input changes
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    if (newMin >= availableMinPrice && newMin <= currentMaxPrice) {
      onUpdateFilter('minPrice', newMin);
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    if (newMax >= currentMinPrice && newMax <= availableMaxPrice) {
      onUpdateFilter('maxPrice', newMax);
    }
  };

  // ✅ ENHANCED: Get ALL available options for current route
  const getAvailableOptions = (type: 'brands' | 'categories') => {
    // Always return ALL available options from Redux, not filtered by current selections
    return availableFilters[type] || [];
  };

  // ✅ FIXED: Check custom price filter against BASE range
  const hasCustomPriceFilter = 
    (currentFilters.minPrice && currentFilters.minPrice > (availableFilters.baseMinPrice || 0)) || 
    (currentFilters.maxPrice && currentFilters.maxPrice < (availableFilters.baseMaxPrice || 5000));

  // ✅ FIXED: Reset to BASE price range
  const resetPriceRange = () => {
    console.log('🔄 Resetting price range to available range');
    onUpdateFilter('minPrice', availableFilters.baseMinPrice || 0);
    onUpdateFilter('maxPrice', availableFilters.baseMaxPrice || 5000);
  };

  // ✅ NEW: Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get current min/max values for inputs
  const currentMinPrice = currentFilters.minPrice || availableFilters.baseMinPrice || 0;
  const currentMaxPrice = currentFilters.maxPrice || availableFilters.baseMaxPrice || 5000;
  
  // ✅ FIXED: Use BASE price range for available range (never changes with filters)
  const availableMinPrice = availableFilters.baseMinPrice || 0;
  const availableMaxPrice = availableFilters.baseMaxPrice || 5000;

  return (
    <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
                onClick={resetPriceRange}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
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
                min={availableMinPrice}
                max={availableMaxPrice}
                value={sliderValues}
                onChange={handleSliderChange} // ✅ Real-time updates
                onChangeComplete={handleSliderComplete} // ✅ FIXED: No deprecation warning
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
              <div className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded border">
                {formatPrice(sliderValues[0])} - {formatPrice(sliderValues[1])}
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Min:</span>
                  <input
                    type="number"
                    value={currentMinPrice}
                    onChange={handleMinPriceChange} // ✅ Use the fixed handler
                    min={availableMinPrice}
                    max={currentMaxPrice}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Max:</span>
                  <input
                    type="number"
                    value={currentMaxPrice}
                    onChange={handleMaxPriceChange} // ✅ Use the fixed handler
                    min={currentMinPrice}
                    max={availableMaxPrice}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* ✅ FIXED: Available Range shows BASE range (never changes) */}
            <div className="text-xs text-gray-500 text-center bg-blue-50 py-1 rounded border border-blue-100">
              Available range: {formatPrice(availableMinPrice)} - {formatPrice(availableMaxPrice)}
            </div>

            {/* Quick Price Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[100, 250, 500, 1000].map((price) => (
                <button
                  key={price}
                  onClick={() => {
                    console.log('💨 Quick price filter:', price);
                    onUpdateFilter('minPrice', availableMinPrice);
                    onUpdateFilter('maxPrice', Math.min(price, availableMaxPrice));
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    currentMaxPrice === price && currentMinPrice === availableMinPrice
                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  Under {formatPrice(price)}
                </button>
              ))}
              <button
                onClick={resetPriceRange}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  currentMaxPrice === availableMaxPrice && currentMinPrice === availableMinPrice
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                All Prices
              </button>
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Category Filter - Shows ALL categories for current route */}
        {shouldShowFilter('category') && getAvailableOptions('categories').length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Category {currentFilters.brand && `(for ${currentFilters.brand})`}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getAvailableOptions('categories').map(category => (
                <label key={category} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="category"
                    checked={currentFilters.category === category}
                    onChange={() => onUpdateFilter('category', category)}
                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ✅ FIXED: Brand Filter - Shows ALL brands for current route */}
        {shouldShowFilter('brand') && getAvailableOptions('brands').length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Brand {currentFilters.category && `(in ${currentFilters.category})`}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getAvailableOptions('brands').map(brand => (
                <label key={brand} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="brand"
                    checked={currentFilters.brand === brand}
                    onChange={() => onUpdateFilter('brand', brand)}
                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* In Stock Filter */}
        <div className="mb-6">
          <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={currentFilters.inStock || false}
              onChange={(e) => onUpdateFilter('inStock', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
            />
            <span className="ml-3 text-sm text-gray-700">In Stock Only</span>
          </label>
        </div>

        {/* Rating Filter */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Customer Rating</h3>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="rating"
                  checked={currentFilters.rating === rating}
                  onChange={() => onUpdateFilter('rating', rating)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                />
                <span className="ml-3 text-sm text-gray-700 flex items-center">
                  {rating}+ Stars
                  <span className="ml-1 text-yellow-400">{"★".repeat(rating)}</span>
                  <span className="text-gray-400 ml-1">{"★".repeat(5 - rating)}</span>
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
              <label key={condition} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="condition"
                  checked={currentFilters.condition === condition}
                  onChange={() => onUpdateFilter('condition', condition)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
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
              <div className="flex justify-between items-center">
                <span>Range:</span>
                <span className="font-medium">
                  {formatPrice(currentMinPrice)} - {formatPrice(currentMaxPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <span>Available:</span>
                <span>{formatPrice(availableMinPrice)} - {formatPrice(availableMaxPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Products Count Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailFilters;