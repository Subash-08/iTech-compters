// src/components/products/ProductDetailFilters.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// --- TYPE DEFINITIONS ---
interface FilterRange { 
  min: number; 
  max: number; 
}

interface CurrentFilters { 
  page?: number | string; 
  limit?: number | string;
  minPrice?: number | string; 
  maxPrice?: number | string; 
  brand?: string | string[]; 
  category?: string | string[];
  rating?: number;
  condition?: string | string[];
  inStock?: boolean;
}

interface AvailableFilters {
  maxPrice: number;
  minPrice: number;
  availableBrands: string[];
  availableCategories: string[];
  conditions: string[];
  inStockCount: number;
  totalProducts: number;
}

interface ProductDetailFiltersProps {
  showFilters: boolean;
  availableFilters: AvailableFilters;
  currentFilters: CurrentFilters;
  onUpdateFilter: (key: keyof CurrentFilters | 'minPrice' | 'maxPrice', value: any) => void;
  onClearFilters: () => void;
  shouldShowFilter: (key: string) => boolean;
  products: any[];
}

const ProductDetailFilters: React.FC<ProductDetailFiltersProps> = ({
  showFilters,
  availableFilters,
  currentFilters,
  onUpdateFilter,
  onClearFilters,
  shouldShowFilter,
  products
}) => {
  const { brandName, categoryName } = useParams();
  const [isApplying, setIsApplying] = useState(false);

  // Initial state set to 0, will be immediately updated by useEffect based on availableFilters
  const [localPriceInputs, setLocalPriceInputs] = useState<FilterRange>({
    min: 0,
    max: 0
  });

  // --- Price Range Logic ---
  const getAvailablePriceRange = useCallback((): FilterRange => {
    const availableMax = availableFilters?.maxPrice || 0;
    const availableMin = availableFilters?.minPrice || 0;
    return { min: availableMin, max: availableMax };
  }, [availableFilters]);

  useEffect(() => {
    const availableRange = getAvailablePriceRange();
    
    if (availableRange.max === 0) return;

    const currentMin = Number(currentFilters.minPrice) || availableRange.min;
    const currentMax = Number(currentFilters.maxPrice) || availableRange.max;

    const newMin = Math.max(availableRange.min, currentMin);
    const newMax = Math.min(availableRange.max, currentMax);

    const finalMin = Math.min(newMin, newMax - 1);
    const finalMax = Math.max(newMin + 1, newMax); 

    if (!isNaN(finalMin) && !isNaN(finalMax)) {
      setLocalPriceInputs({
        min: finalMin,
        max: finalMax
      });
    }
  }, [getAvailablePriceRange, currentFilters.minPrice, currentFilters.maxPrice, availableFilters.maxPrice]);

  const handleMinPriceChange = useCallback((value: number) => {
    const availableRange = getAvailablePriceRange();
    const boundedValue = Math.max(availableRange.min, Math.min(value, localPriceInputs.max - 1));
    setLocalPriceInputs(prev => ({ ...prev, min: boundedValue }));
  }, [getAvailablePriceRange, localPriceInputs.max]);

  const handleMaxPriceChange = useCallback((value: number) => {
    const availableRange = getAvailablePriceRange();
    const boundedValue = Math.min(availableRange.max, Math.max(value, localPriceInputs.min + 1));
    setLocalPriceInputs(prev => ({ ...prev, max: boundedValue }));
  }, [getAvailablePriceRange, localPriceInputs.min]);
  
  const handleMinSliderChange = handleMinPriceChange;
  const handleMaxSliderChange = handleMaxPriceChange;

  const applyPriceFilter = useCallback(() => {
    if (isApplying) return;
    
    if (isNaN(localPriceInputs.min) || isNaN(localPriceInputs.max)) {
      return;
    }

    const availableRange = getAvailablePriceRange();
    const currentMin = Number(currentFilters.minPrice) || availableRange.min;
    const currentMax = Number(currentFilters.maxPrice) || availableRange.max;

    const hasChanged = localPriceInputs.min !== currentMin || localPriceInputs.max !== currentMax;

    if (hasChanged) {
      setIsApplying(true);
      onUpdateFilter('page', 1);
      onUpdateFilter('minPrice', localPriceInputs.min);
      onUpdateFilter('maxPrice', localPriceInputs.max);

      setTimeout(() => {
        setIsApplying(false);
      }, 500);
    }
  }, [localPriceInputs, getAvailablePriceRange, currentFilters.minPrice, currentFilters.maxPrice, onUpdateFilter, isApplying]);

  const handleSliderRelease = useCallback(() => {
    applyPriceFilter();
  }, [applyPriceFilter]);

  const handleInputKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    applyPriceFilter();
  }, [applyPriceFilter]);

  // --- Filter Toggle Logic ---
  const toggleFilterItem = useCallback((currentValue: string | string[] | undefined, newItem: string) => {
    let arr: string[] = [];
    
    if (Array.isArray(currentValue)) {
      arr = [...currentValue];
    } else if (typeof currentValue === 'string') {
      arr = currentValue.split(',').filter(item => item.trim() !== '');
    }

    if (arr.includes(newItem)) {
      return arr.filter(i => i !== newItem);
    }
    return [...arr, newItem];
  }, []);

  const handleBrandChange = useCallback((brand: string) => {
    const currentBrands = currentFilters.brand;
    const newBrands = toggleFilterItem(currentBrands, brand);
    
    if (newBrands.length === 0) {
      onUpdateFilter('brand', null);
    } else {
      onUpdateFilter('brand', newBrands);
    }
  }, [currentFilters.brand, onUpdateFilter, toggleFilterItem]);

  const handleCategoryChange = useCallback((category: string) => {
    const currentCategories = currentFilters.category;
    const newCategories = toggleFilterItem(currentCategories, category);
    
    if (newCategories.length === 0) {
      onUpdateFilter('category', null);
    } else {
      onUpdateFilter('category', newCategories);
    }
  }, [currentFilters.category, onUpdateFilter, toggleFilterItem]);

  const getAvailableBrands = useMemo(() => {
    return availableFilters.availableBrands || [];
  }, [availableFilters.availableBrands]);

  const getAvailableCategories = useMemo(() => {
    return availableFilters.availableCategories || [];
  }, [availableFilters.availableCategories]);
  
  const isBrandSelected = useCallback((brand: string) => {
    if (!currentFilters.brand) return false;
    
    const selectedBrands = Array.isArray(currentFilters.brand) 
      ? currentFilters.brand 
      : typeof currentFilters.brand === 'string' 
        ? (currentFilters.brand as string).split(',') 
        : [currentFilters.brand];
        
    return selectedBrands.includes(brand);
  }, [currentFilters.brand]);
  
  const isCategorySelected = useCallback((category: string) => {
    if (!currentFilters.category) return false;
    
    const selectedCategories = Array.isArray(currentFilters.category) 
      ? currentFilters.category 
      : typeof currentFilters.category === 'string' 
        ? (currentFilters.category as string).split(',') 
        : [currentFilters.category];

    return selectedCategories.includes(category);
  }, [currentFilters.category]);

  const handleConditionChange = useCallback((condition: string) => {
    const currentConditions = currentFilters.condition;
    const newConditions = toggleFilterItem(currentConditions, condition);
    
    if (newConditions.length === 0) {
      onUpdateFilter('condition', null);
    } else {
      onUpdateFilter('condition', newConditions);
    }
  }, [currentFilters.condition, onUpdateFilter, toggleFilterItem]);

  const isConditionSelected = useCallback((condition: string) => {
    if (!currentFilters.condition) return false;
    
    const selectedConditions = Array.isArray(currentFilters.condition) 
      ? currentFilters.condition 
      : typeof currentFilters.condition === 'string' 
        ? (currentFilters.condition as string).split(',') 
        : [currentFilters.condition];
        
    return selectedConditions.includes(condition);
  }, [currentFilters.condition]);

  const handleStockChange = useCallback((inStock: boolean) => {
    onUpdateFilter('inStock', currentFilters.inStock === inStock ? null : inStock);
  }, [currentFilters.inStock, onUpdateFilter]);

  const handleClearAll = useCallback(() => {
    onClearFilters();
    const availableRange = getAvailablePriceRange();
    setLocalPriceInputs({ min: availableRange.min, max: availableRange.max });
  }, [onClearFilters, getAvailablePriceRange]);

  const hasActiveFilters = useMemo(() => {
    const availableRange = getAvailablePriceRange();
    const isDefaultPrice = (Number(currentFilters.minPrice || availableRange.min) === availableRange.min) && 
                          (Number(currentFilters.maxPrice || availableRange.max) === availableRange.max);
    
    const hasBrand = (Array.isArray(currentFilters.brand) && currentFilters.brand.length > 0) || 
                     (typeof currentFilters.brand === 'string' && currentFilters.brand.length > 0);
    const hasCategory = (Array.isArray(currentFilters.category) && currentFilters.category.length > 0) || 
                        (typeof currentFilters.category === 'string' && currentFilters.category.length > 0);
    const hasCondition = (Array.isArray(currentFilters.condition) && currentFilters.condition.length > 0) || 
                         (typeof currentFilters.condition === 'string' && currentFilters.condition.length > 0);
    
    return !isDefaultPrice || hasBrand || hasCategory || !!currentFilters.rating || hasCondition || !!currentFilters.inStock;
  }, [currentFilters, getAvailablePriceRange]);

  if (!showFilters) {
    return null;
  }

  const availableRange = getAvailablePriceRange();
  const rangeDiff = availableRange.max - availableRange.min;
  const safeRangeDiff = rangeDiff > 0 ? rangeDiff : 1; 

  const minPosition = ((localPriceInputs.min - availableRange.min) / safeRangeDiff) * 100;
  const maxPosition = ((localPriceInputs.max - availableRange.min) / safeRangeDiff) * 100;
  
  const effectiveMinPosition = Math.max(0, Math.min(100, isNaN(minPosition) ? 0 : minPosition));
  const effectiveMaxPosition = Math.max(0, Math.min(100, isNaN(maxPosition) ? 100 : maxPosition));

  return (
<div className="w-full lg:w-80 bg-white rounded-2xl p-6 h-fit lg:sticky transform transition-all duration-300
  /* Key Changes: distinct border, minimal shadow */
  border border-gray-300/80 shadow-sm
  /* Hover state */
  hover:border-gray-400 hover:shadow-md"
>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-sm font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200 active:scale-95"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="space-y-8">
        {/* 💰 Price Range Filter */}
        <div className="border-b border-gray-100 pb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Price Range
          </h3>
          
          <div className="mb-6">
            <div className="relative h-10 mb-6">
              {/* Background Track */}
              <div className="absolute top-5 h-2 w-full bg-gray-100 rounded-full"></div>
              
              {/* Selected Range */}
              <div 
                className="absolute top-5 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{
                  left: `${effectiveMinPosition}%`,
                  width: `${effectiveMaxPosition - effectiveMinPosition}%`
                }}
              ></div>
              
              {/* Slider Handles */}
              <div 
                className="absolute top-3 w-6 h-6 bg-white rounded-full border-4 border-blue-500 shadow-lg shadow-blue-500/30 transform -translate-x-1/2 z-20 cursor-pointer pointer-events-none transition-transform duration-200 hover:scale-110"
                style={{ left: `${effectiveMinPosition}%` }}
              ></div>
              <div 
                className="absolute top-3 w-6 h-6 bg-white rounded-full border-4 border-blue-500 shadow-lg shadow-blue-500/30 transform -translate-x-1/2 z-20 cursor-pointer pointer-events-none transition-transform duration-200 hover:scale-110"
                style={{ left: `${effectiveMaxPosition}%` }}
              ></div>
              
              {/* Hidden Inputs for Slider */}
              <input
                type="range"
                min={availableRange.min}
                max={availableRange.max}
                step="1"
                value={localPriceInputs.min}
                onChange={(e) => handleMinSliderChange(Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="absolute top-0 w-full h-10 opacity-0 cursor-pointer z-10"
                aria-label="Minimum price"
              />
              <input
                type="range"
                min={availableRange.min}
                max={availableRange.max}
                step="1"
                value={localPriceInputs.max}
                onChange={(e) => handleMaxSliderChange(Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="absolute top-0 w-full h-10 opacity-0 cursor-pointer z-10"
                aria-label="Maximum price"
              />
            </div>

            {/* Price Inputs */}
            <div className="flex items-center justify-between space-x-3 mb-6">
              <div className="flex-1">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 hover:bg-white hover:border-gray-300"
                    type="number"
                    value={localPriceInputs.min}
                    onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                    onKeyPress={handleInputKeyPress}
                    onBlur={handleInputBlur}
                    min={availableRange.min}
                    max={localPriceInputs.max - 1}
                    placeholder={`Min: ₹${availableRange.min.toLocaleString()}`}
                  />
                </div>
              </div>
              
              <span className="text-gray-400 font-medium">to</span>
              
              <div className="flex-1">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 hover:bg-white hover:border-gray-300"
                    type="number"
                    value={localPriceInputs.max}
                    onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                    onKeyPress={handleInputKeyPress}
                    onBlur={handleInputBlur}
                    min={localPriceInputs.min + 1}
                    max={availableRange.max}
                    placeholder={`Max: ₹${availableRange.max.toLocaleString()}`}
                  />
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <button
              className="w-full bg-gradient-to-r from-gray-900 to-black text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={applyPriceFilter}
              disabled={isApplying}
            >
              {isApplying ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </span>
              ) : 'Apply Price Filter'}
            </button>
          </div>
        </div>

        {/* 🏷️ Brand Filter */}
        {shouldShowFilter('brand') && getAvailableBrands.length > 0 && (
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Brand <span className="ml-2 text-xs font-normal bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{getAvailableBrands.length}</span>
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {getAvailableBrands.map((brand) => (
                <label key={brand} className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isBrandSelected(brand)}
                      onChange={() => handleBrandChange(brand)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200 flex items-center justify-center group-hover:border-gray-400">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-3 text-sm text-gray-700 capitalize group-hover:text-gray-900 transition-colors duration-200">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 📁 Category Filter */}
        {shouldShowFilter('category') && getAvailableCategories.length > 0 && (
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Category <span className="ml-2 text-xs font-normal bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{getAvailableCategories.length}</span>
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {getAvailableCategories.map((category) => (
                <label key={category} className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isCategorySelected(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200 flex items-center justify-center group-hover:border-gray-400">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-3 text-sm text-gray-700 capitalize group-hover:text-gray-900 transition-colors duration-200">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 🔧 Condition Filter - WRAPPED IN shouldShowFilter CHECK */}
        {shouldShowFilter('condition') && availableFilters.conditions && availableFilters.conditions.length > 0 && (
          <div className="border-b border-gray-100 pb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Condition
            </h3>
            <div className="space-y-3">
              {availableFilters.conditions.map((condition) => (
                <label key={condition} className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isConditionSelected(condition)}
                      onChange={() => handleConditionChange(condition)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200 flex items-center justify-center group-hover:border-gray-400">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-3 text-sm text-gray-700 capitalize group-hover:text-gray-900 transition-colors duration-200">
                    {condition}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 📦 In Stock Filter */}
        <div className="border-b border-gray-100 pb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Availability
          </h3>
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={currentFilters.inStock === true}
                onChange={() => handleStockChange(true)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200 flex items-center justify-center group-hover:border-gray-400">
                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
              In Stock Only <span className="ml-1 text-gray-500">({availableFilters.inStockCount || 0} available)</span>
            </span>
          </label>
        </div>

        {/* Results Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                <span className="text-2xl font-bold text-gray-900">{products.length}</span> of{' '}
                <span className="font-semibold">{availableFilters.totalProducts || 0}</span> products
              </p>
              <p className="text-xs text-gray-500 mt-1">Matching your filters</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Available Range</span>
              <span className="font-medium text-gray-900">
                ₹{availableRange.min.toLocaleString()} - ₹{availableRange.max.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Selected Range</span>
              <span className="font-medium text-blue-600">
                ₹{localPriceInputs.min.toLocaleString()} - ₹{localPriceInputs.max.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailFilters;