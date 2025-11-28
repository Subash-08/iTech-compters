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
  // 🐛 DEBUG: Log all data to understand what's happening
  useEffect(() => {
    console.log('🔍 === FILTER DEBUG START ===');
    console.log('📊 AVAILABLE FILTERS:', availableFilters);
    console.log('🎯 CURRENT FILTERS:', currentFilters);
    console.log('📦 TOTAL PRODUCTS:', products.length);
    
    // Debug price data specifically
    if (products.length > 0) {
      const priceData = products.slice(0, 5).map(p => ({
        name: p.name,
        basePrice: p.basePrice,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
        displayMrp: p.displayMrp,
        hasVariants: p.variantConfiguration?.hasVariants,
        variantCount: p.variants?.length,
        variantPrices: p.variants?.map(v => v.price)
      }));
      console.log('💰 SAMPLE PRODUCT PRICE DATA:', priceData);
      
      // Calculate actual price range from products
      const allPrices = products
        .map(p => p.sellingPrice || p.basePrice || 0)
        .filter(price => price > 0);
      
      if (allPrices.length > 0) {
        const actualMin = Math.min(...allPrices);
        const actualMax = Math.max(...allPrices);
        console.log('🧮 ACTUAL PRICE RANGE FROM PRODUCTS:', {
          min: actualMin,
          max: actualMax,
          productCount: products.length
        });
      }
    }
    console.log('🔍 === FILTER DEBUG END ===');
  }, [availableFilters, currentFilters, products]);

  // ✅ FIXED: Get price range with ALWAYS min=0 and dynamic max
  const getPriceRange = () => {
    // ALWAYS set min to 0 for better UX
    const baseMin = 0;

    // Strategy 1: Calculate max from actual products
    if (products.length > 0) {
      const sellingPrices = products
        .map(p => p.sellingPrice || p.basePrice || 0)
        .filter(price => price > 0);
      
      if (sellingPrices.length > 0) {
        const calculatedMax = Math.ceil(Math.max(...sellingPrices));
        
        // Ensure reasonable max (at least 100 more than min)
        const finalMax = Math.max(calculatedMax, 100);
        
        console.log('🧮 Calculated range from products:', { baseMin, finalMax });
        return { 
          baseMin, 
          baseMax: finalMax,
          isLoading: false 
        };
      }
    }

    // Strategy 2: Use available filters if they have valid data
    if (availableFilters.baseMaxPrice && availableFilters.baseMaxPrice > 0) {
      console.log('🎯 Using available filters max price');
      return {
        baseMin,
        baseMax: availableFilters.baseMaxPrice,
        isLoading: false
      };
    }

    // Strategy 3: Use priceRange object if available
    if (availableFilters.priceRange?.max && availableFilters.priceRange.max > 0) {
      console.log('🎯 Using priceRange max');
      return {
        baseMin,
        baseMax: availableFilters.priceRange.max,
        isLoading: false
      };
    }

    // Strategy 4: Default fallback
    console.log('🔄 Using default price range');
    return { 
      baseMin, 
      baseMax: 5000, 
      isLoading: true 
    };
  };

  const { baseMin, baseMax, isLoading } = getPriceRange();

  // ✅ FIXED: Initialize slider with proper values
  const [sliderValues, setSliderValues] = useState([baseMin, baseMax]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🐛 DEBUG: Log slider state
  useEffect(() => {
    console.log('🎚️ SLIDER STATE:', {
      sliderValues,
      baseMin,
      baseMax,
      currentMinPrice: currentFilters.minPrice,
      currentMaxPrice: currentFilters.maxPrice,
      isInitialized
    });
  }, [sliderValues, baseMin, baseMax, currentFilters.minPrice, currentFilters.maxPrice, isInitialized]);

  // ✅ FIXED: Update slider when filters OR base range changes
  useEffect(() => {
    // Don't update until we have valid base range
    if (isLoading && !isInitialized) {
      console.log('⏳ Waiting for valid price range...');
      return;
    }

    // Use current filters if set, otherwise use base range
    const currentMin = (currentFilters.minPrice !== undefined && currentFilters.minPrice !== null) 
      ? currentFilters.minPrice 
      : baseMin;
    
    const currentMax = (currentFilters.maxPrice !== undefined && currentFilters.maxPrice !== null) 
      ? currentFilters.maxPrice 
      : baseMax;

    console.log('🔄 Updating slider values:', { currentMin, currentMax, baseMin, baseMax });

    setSliderValues([currentMin, currentMax]);
    
    if (!isInitialized) {
      console.log('✅ Slider initialized');
      setIsInitialized(true);
    }
  }, [currentFilters.minPrice, currentFilters.maxPrice, baseMin, baseMax, isLoading, isInitialized]);

  // ✅ FIXED: Handle slider change (real-time updates)
  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      console.log('📈 Slider changing:', value);
      setSliderValues(value);
    }
  };

  // ✅ FIXED: Handle slider completion - update URL params
  const handleSliderComplete = (value: number | number[]) => {
    if (Array.isArray(value)) {
      const [min, max] = value;
      
      // Only update if values are different from base range
      const newMin = min <= baseMin ? null : min;
      const newMax = max >= baseMax ? null : max;
      
      console.log('🎯 Slider completed - updating filters:', { newMin, newMax, baseMin, baseMax });
      
      // Update both filters
      onUpdateFilter('minPrice', newMin);
      onUpdateFilter('maxPrice', newMax);
    }
  };

  // ✅ FIXED: Handle direct input changes
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newMin = value === '' ? null : Number(value);
    
    console.log('⌨️ Min price input:', { value, newMin });
    
    if (newMin === null || (!isNaN(newMin) && newMin >= baseMin && newMin <= (currentFilters.maxPrice || baseMax))) {
      onUpdateFilter('minPrice', newMin);
    } else {
      console.warn('❌ Invalid min price:', newMin);
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newMax = value === '' ? null : Number(value);
    
    console.log('⌨️ Max price input:', { value, newMax });
    
    if (newMax === null || (!isNaN(newMax) && newMax >= (currentFilters.minPrice || baseMin) && newMax <= baseMax)) {
      onUpdateFilter('maxPrice', newMax);
    } else {
      console.warn('❌ Invalid max price:', newMax);
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
    console.log('🔄 Resetting price range to base values');
    onUpdateFilter('minPrice', null);
    onUpdateFilter('maxPrice', null);
  };

  // ✅ FIXED: Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  // ✅ FIXED: Handle brand selection as toggle (select/unselect)
  const handleBrandToggle = (brand: string) => {
    console.log('🔘 Brand toggle:', { brand, current: currentFilters.brand });
    
    // If already selected, unselect it. Otherwise select it.
    if (currentFilters.brand === brand) {
      onUpdateFilter('brand', null);
    } else {
      onUpdateFilter('brand', brand);
    }
  };

  // ✅ FIXED: Handle category selection as toggle
  const handleCategoryToggle = (category: string) => {
    console.log('🔘 Category toggle:', { category, current: currentFilters.category });
    
    if (currentFilters.category === category) {
      onUpdateFilter('category', null);
    } else {
      onUpdateFilter('category', category);
    }
  };

  // ✅ FIXED: Handle other filter removal for radio buttons
  const handleRadioFilter = (key: 'condition' | 'rating', value: string | number | null) => {
    console.log('🔘 Radio filter:', { key, value, current: currentFilters[key] });
    
    if (currentFilters[key] === value) {
      onUpdateFilter(key, null);
    } else {
      onUpdateFilter(key, value);
    }
  };

  // ✅ FIXED: Handle checkbox filter for inStock
  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('☑️ In stock filter:', e.target.checked);
    onUpdateFilter('inStock', e.target.checked || null);
  };

  // Show loading state while waiting for price range
  if (isLoading && !isInitialized) {
    return (
      <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading filters...</p>
            <p className="text-xs text-gray-500 mt-1">Calculating price range</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
        {/* Debug Info - Remove in production */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-xs font-mono">
            <div>💰 Range: {formatPrice(baseMin)} - {formatPrice(baseMax)}</div>
            <div>🎯 Current: {formatPrice(displayMinPrice)} - {formatPrice(displayMaxPrice)}</div>
            <div>📦 Products: {products.length}</div>
            <div>🏷️ Selected Brand: {currentFilters.brand || 'None'}</div>
            <div>📁 Selected Category: {currentFilters.category || 'None'}</div>
          </div>
        </div>

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
            <div className="flex flex-col space-y-3">
              <div className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded border text-center">
                {formatPrice(sliderValues[0])} - {formatPrice(sliderValues[1])}
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Min:</span>
                  <input
                    type="number"
                    value={displayMinPrice}
                    onChange={handleMinPriceChange}
                    min={baseMin}
                    max={displayMaxPrice}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    console.log('🚀 Quick filter: Under', price);
                    if (price >= baseMax) {
                      onUpdateFilter('maxPrice', null);
                    } else {
                      onUpdateFilter('maxPrice', price);
                    }
                    onUpdateFilter('minPrice', null);
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
        </div>

        {/* Category Filter - Now toggleable */}
        {shouldShowFilter('category') && getAvailableOptions('categories').length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Category {currentFilters.brand && `(for ${currentFilters.brand})`}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getAvailableOptions('categories').map(category => (
                <label key={category} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox" // Changed from radio to checkbox for toggle behavior
                    name="category"
                    checked={currentFilters.category === category}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{category}</span>
                </label>
              ))}
              {/* Show "Any Category" when a category is selected */}
              {currentFilters.category && (
                <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="category"
                    checked={!currentFilters.category}
                    onChange={() => handleCategoryToggle(null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700">Any Category</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Brand Filter - Now toggleable */}
        {shouldShowFilter('brand') && getAvailableOptions('brands').length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Brand {currentFilters.category && `(in ${currentFilters.category})`}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getAvailableOptions('brands').map(brand => (
                <label key={brand} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox" // Changed from radio to checkbox for toggle behavior
                    name="brand"
                    checked={currentFilters.brand === brand}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700 truncate">{brand}</span>
                </label>
              ))}
              {/* Show "Any Brand" when a brand is selected */}
              {currentFilters.brand && (
                <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="brand"
                    checked={!currentFilters.brand}
                    onChange={() => handleBrandToggle(null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-3 text-sm text-gray-700">Any Brand</span>
                </label>
              )}
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