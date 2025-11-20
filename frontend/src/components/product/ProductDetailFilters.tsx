import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { AvailableFilters, ProductFilters, Product } from '../../redux/types/productTypes';

interface ProductFiltersProps {
  showFilters: boolean;
  availableFilters: AvailableFilters;
  currentFilters: ProductFilters;
  onUpdateFilter: (key: string, value: string | number | boolean | null) => void;
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
  // ✅ FIXED: Get base price range with better fallback logic
  const getBasePriceRange = () => {
    const baseMin = availableFilters.baseMinPrice || availableFilters.priceRange?.min || 0;
    const baseMax = availableFilters.baseMaxPrice || availableFilters.priceRange?.max || 5000;
    
    // If base range is invalid (0-5000), wait for actual data
    if (baseMin === 0 && baseMax === 5000) {
      return { baseMin: 0, baseMax: 5000, isLoading: true };
    }
    
    return { baseMin, baseMax, isLoading: false };
  };

  const { baseMin, baseMax, isLoading } = getBasePriceRange();

  // ✅ FIXED: Initialize slider with proper values
  const [sliderValues, setSliderValues] = useState([baseMin, baseMax]);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ FIXED: Update slider when filters OR base range changes
  useEffect(() => {


    // Don't update until base range is loaded
    if (isLoading && !isInitialized) {
      return;
    }

    // Use current filters if set, otherwise use base range
    const currentMin = (currentFilters.minPrice !== undefined && currentFilters.minPrice !== null) 
      ? currentFilters.minPrice 
      : baseMin;
    
    const currentMax = (currentFilters.maxPrice !== undefined && currentFilters.maxPrice !== null) 
      ? currentFilters.maxPrice 
      : baseMax;
    setSliderValues([currentMin, currentMax]);
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [currentFilters.minPrice, currentFilters.maxPrice, baseMin, baseMax, isLoading, isInitialized]);

  // ✅ FIXED: Reset to actual base values when base range loads
  useEffect(() => {
    if (!isLoading && isInitialized && 
        (currentFilters.minPrice === null || currentFilters.minPrice === undefined) && 
        (currentFilters.maxPrice === null || currentFilters.maxPrice === undefined)) {
      setSliderValues([baseMin, baseMax]);
    }
  }, [baseMin, baseMax, isLoading, isInitialized, currentFilters.minPrice, currentFilters.maxPrice]);

  // ✅ FIXED: Handle slider change (real-time updates)
  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setSliderValues(value);
    }
  };

  // ✅ FIXED: Handle slider completion - update URL params
  const handleSliderComplete = (value: number | number[]) => {
    if (Array.isArray(value)) {
      const [min, max] = value;
      const newMin = min === baseMin ? null : min;
      const newMax = max === baseMax ? null : max;
      
      // Update both filters
      onUpdateFilter('minPrice', newMin);
      onUpdateFilter('maxPrice', newMax);
    }
  };

  // ✅ FIXED: Handle direct input changes
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newMin = value === '' ? null : Number(value);
    
    if (newMin === null || (!isNaN(newMin) && newMin >= baseMin && newMin <= (currentFilters.maxPrice || baseMax))) {
      onUpdateFilter('minPrice', newMin);
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newMax = value === '' ? null : Number(value);
    
    if (newMax === null || (!isNaN(newMax) && newMax >= (currentFilters.minPrice || baseMin) && newMax <= baseMax)) {
      onUpdateFilter('maxPrice', newMax);
    }
  };

  // ✅ FIXED: Get available options
  const getAvailableOptions = (type: 'brands' | 'categories') => {
    return availableFilters[type] || [];
  };

  // ✅ FIXED: Check if custom price filter is active
  const hasCustomPriceFilter = 
    (currentFilters.minPrice !== undefined && currentFilters.minPrice !== null) || 
    (currentFilters.maxPrice !== undefined && currentFilters.maxPrice !== null);

  // ✅ FIXED: Reset price range to base values
  const resetPriceRange = () => {
    onUpdateFilter('minPrice', null);
    onUpdateFilter('maxPrice', null);
  };

  // ✅ FIXED: Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // ✅ FIXED: Get current display values
  const displayMinPrice = currentFilters.minPrice !== undefined && currentFilters.minPrice !== null 
    ? currentFilters.minPrice 
    : baseMin;
  
  const displayMaxPrice = currentFilters.maxPrice !== undefined && currentFilters.maxPrice !== null 
    ? currentFilters.maxPrice 
    : baseMax;

  // ✅ FIXED: Handle filter removal for radio buttons
  const handleRadioFilter = (key: 'category' | 'brand' | 'condition' | 'rating', value: string | number | null) => {

    if (currentFilters[key] === value) {
      onUpdateFilter(key, null);
    } else {
      onUpdateFilter(key, value);
    }
  };

  // ✅ FIXED: Handle checkbox filter for inStock
  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateFilter('inStock', e.target.checked || null);
  };

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
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Loading price range...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Slider */}
              <div className="px-2">
                <Slider
                  range
                  min={baseMin}
                  max={baseMax}
                  value={sliderValues}
                  onChange={handleSliderChange}
                  onChangeComplete={handleSliderComplete}
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
              <div className=" items-center justify-between space-x-4">
                <div className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded border min-w-[140px] text-center">
                  {formatPrice(sliderValues[0])} - {formatPrice(sliderValues[1])}
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Min:</span>
                    <input
                      type="number"
                      value={displayMinPrice}
                      onChange={handleMinPriceChange}
                      min={baseMin}
                      max={displayMaxPrice}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Max:</span>
                    <input
                      type="number"
                      value={displayMaxPrice}
                      onChange={handleMaxPriceChange}
                      min={displayMinPrice}
                      max={baseMax}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Base Range Info */}
              <div className="text-xs text-gray-500 text-center bg-blue-50 py-1 rounded border border-blue-100">
                Available range: {formatPrice(baseMin)} - {formatPrice(baseMax)}
              </div>

              {/* Quick Price Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[100, 250, 500, 1000].map((price) => (
                  <button
                    key={price}
                    onClick={() => {
                      if (price >= baseMax) {
                        // If price is higher than base max, remove max filter
                        onUpdateFilter('maxPrice', null);
                      } else {
                        onUpdateFilter('maxPrice', price);
                      }
                      onUpdateFilter('minPrice', null); // Always remove min filter for "under X"
                    }}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      currentFilters.maxPrice === price && !currentFilters.minPrice
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
                    !currentFilters.minPrice && !currentFilters.maxPrice
                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  All Prices
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category Filter */}
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
                    onChange={() => handleRadioFilter('category', category)}
                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{category}</span>
                </label>
              ))}
              {/* "Any Category" option */}
              <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="category"
                  checked={!currentFilters.category}
                  onChange={() => handleRadioFilter('category', null)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                />
                <span className="ml-3 text-sm text-gray-700">Any Category</span>
              </label>
            </div>
          </div>
        )}

        {/* Brand Filter */}
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
                    onChange={() => handleRadioFilter('brand', brand)}
                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{brand}</span>
                </label>
              ))}
              {/* "Any Brand" option */}
              <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="brand"
                  checked={!currentFilters.brand}
                  onChange={() => handleRadioFilter('brand', null)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                />
                <span className="ml-3 text-sm text-gray-700">Any Brand</span>
              </label>
            </div>
          </div>
        )}

        {/* In Stock Filter */}
        <div className="mb-6">
          <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={currentFilters.inStock || false}
              onChange={handleInStockChange}
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
                  onChange={() => handleRadioFilter('rating', rating)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                />
                <span className="ml-3 text-sm text-gray-700 flex items-center">
                  {rating}+ Stars
                  <span className="ml-1 text-yellow-400">{"★".repeat(rating)}</span>
                  <span className="text-gray-400 ml-1">{"★".repeat(5 - rating)}</span>
                </span>
              </label>
            ))}
            {/* "Any Rating" option */}
            <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
              <input
                type="radio"
                name="rating"
                checked={!currentFilters.rating}
                onChange={() => handleRadioFilter('rating', null)}
                className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
              />
              <span className="ml-3 text-sm text-gray-700">Any Rating</span>
            </label>
          </div>
        </div>

        {/* Condition Filter */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Condition</h3>
          <div className="space-y-2">
            {availableFilters.conditions?.map(condition => (
              <label key={condition} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="condition"
                  checked={currentFilters.condition === condition}
                  onChange={() => handleRadioFilter('condition', condition)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                />
                <span className="ml-3 text-sm text-gray-700">{condition}</span>
              </label>
            ))}
            {/* "Any Condition" option */}
            <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
              <input
                type="radio"
                name="condition"
                checked={!currentFilters.condition}
                onChange={() => handleRadioFilter('condition', null)}
                className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
              />
              <span className="ml-3 text-sm text-gray-700">Any Condition</span>
            </label>
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
                  {formatPrice(displayMinPrice)} - {formatPrice(displayMaxPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <span>Available:</span>
                <span>{formatPrice(baseMin)} - {formatPrice(baseMax)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Products Count Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
            {hasCustomPriceFilter && ' with price filter'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailFilters;