import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// --- TYPE DEFINITIONS ---
interface FilterRange { min: number; max: number; }

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
        
        // If backend returns 0 (loading or no products), don't reset inputs yet
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
            onUpdateFilter('page', 1); // Reset page always
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

    // --- Other Filter Logic (Brand, Category, etc.) ---

    // ✅ FIXED: Robust toggle logic that splits strings (e.g. "Apple,Samsung") into arrays
    const toggleFilterItem = useCallback((currentValue: string | string[] | undefined, newItem: string) => {
        let arr: string[] = [];
        
        if (Array.isArray(currentValue)) {
            arr = [...currentValue];
        } else if (typeof currentValue === 'string') {
            // This is the critical fix: Split by comma
            arr = currentValue.split(',').filter(item => item.trim() !== '');
        }

        if (arr.includes(newItem)) {
            return arr.filter(i => i !== newItem); // Unselect
        }
        return [...arr, newItem]; // Select
    }, []);

    const getAvailableBrands = useMemo(() => {
        return availableFilters.availableBrands || [];
    }, [availableFilters.availableBrands]);

    const getAvailableCategories = useMemo(() => {
        return availableFilters.availableCategories || [];
    }, [availableFilters.availableCategories]);
    
    const handleBrandChange = useCallback((brand: string) => {
        const newBrands = toggleFilterItem(currentFilters.brand, brand);
        // Pass array directly. Parent MUST handle page reset or we risk overwriting params.
        onUpdateFilter('brand', newBrands.length > 0 ? newBrands : null);
    }, [currentFilters.brand, onUpdateFilter, toggleFilterItem]);

    const handleCategoryChange = useCallback((category: string) => {
        const newCategories = toggleFilterItem(currentFilters.category, category);
        onUpdateFilter('category', newCategories.length > 0 ? newCategories : null);
    }, [currentFilters.category, onUpdateFilter, toggleFilterItem]);

    // ✅ FIXED: Checkers now handle comma-separated URL strings
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

    const handleRatingChange = useCallback((rating: number) => {
        onUpdateFilter('rating', currentFilters.rating === rating ? null : rating);
    }, [currentFilters.rating, onUpdateFilter]);

    const handleConditionChange = useCallback((condition: string) => {
        const newConditions = toggleFilterItem(currentFilters.condition, condition);
        onUpdateFilter('condition', newConditions.length > 0 ? newConditions : null);
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
        
        const hasBrand = (Array.isArray(currentFilters.brand) && currentFilters.brand.length > 0) || (!!currentFilters.brand);
        const hasCategory = (Array.isArray(currentFilters.category) && currentFilters.category.length > 0) || (!!currentFilters.category);
        
        return !isDefaultPrice || hasBrand || hasCategory || !!currentFilters.rating || !!currentFilters.condition || !!currentFilters.inStock;
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
        <div className="w-full lg:w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearAll}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>
            
            <div className="space-y-6">
                {/* 💰 Price Range Filter */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Price Range</h3>
                    <div className="facets__price--slider">
                        <div className="facets__price--slide relative h-8 mb-4">
                            <div className="absolute top-3 h-2 w-full bg-gray-200 rounded-lg"></div>
                            <div 
                                className="absolute top-3 h-2 bg-blue-500 rounded-lg"
                                style={{
                                    left: `${effectiveMinPosition}%`,
                                    width: `${effectiveMaxPosition - effectiveMinPosition}%`
                                }}
                            ></div>
                            <input
                                type="range"
                                min={availableRange.min}
                                max={availableRange.max}
                                step="1"
                                value={localPriceInputs.min}
                                onChange={(e) => handleMinSliderChange(Number(e.target.value))}
                                onMouseUp={handleSliderRelease}
                                onTouchEnd={handleSliderRelease}
                                className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-10"
                                aria-label="Min"
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
                                className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-10"
                                aria-label="Max"
                            />
                            <div 
                                className="absolute top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 z-20 cursor-pointer pointer-events-none"
                                style={{ left: `${effectiveMinPosition}%` }}
                            ></div>
                            <div 
                                className="absolute top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 z-20 cursor-pointer pointer-events-none"
                                style={{ left: `${effectiveMaxPosition}%` }}
                            ></div>
                        </div>

                        <div className="facets__price--box price-slider clearfix flex items-center space-x-2 mb-4">
                            <div className="form-field flex-1">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        className="form-input field__input filter__price filter__price--min w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        type="number"
                                        value={localPriceInputs.min}
                                        onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                                        onKeyPress={handleInputKeyPress}
                                        onBlur={handleInputBlur}
                                        min={availableRange.min}
                                        max={localPriceInputs.max - 1}
                                        placeholder={availableRange.min.toString()}
                                    />
                                </div>
                            </div>
                            <span className="price-to-price text-gray-500">to</span>
                            <div className="form-field flex-1">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        className="form-input field__input filter__price filter__price--max w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        type="number"
                                        value={localPriceInputs.max}
                                        onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                                        onKeyPress={handleInputKeyPress}
                                        onBlur={handleInputBlur}
                                        min={localPriceInputs.min + 1}
                                        max={availableRange.max}
                                        placeholder={availableRange.max.toString()}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                className="button button--primary filter__price--apply w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={applyPriceFilter}
                                disabled={isApplying}
                            >
                                {isApplying ? 'Applying...' : 'Apply Price Filter'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 🏷️ Brand Filter */}
                {shouldShowFilter('brand') && getAvailableBrands.length > 0 && (
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">
                            Brand ({getAvailableBrands.length} available)
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {getAvailableBrands.map((brand) => (
                                <label key={brand} className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isBrandSelected(brand)}
                                        onChange={() => handleBrandChange(brand)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 capitalize">
                                        {brand}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* 📁 Category Filter */}
                {shouldShowFilter('category') && getAvailableCategories.length > 0 && (
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">
                            Category ({getAvailableCategories.length} available)
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {getAvailableCategories.map((category) => (
                                <label key={category} className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isCategorySelected(category)}
                                        onChange={() => handleCategoryChange(category)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 capitalize">
                                        {category}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⭐ Customer Rating Filter */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Customer Rating</h3>
                    <div className="space-y-2">
                        {[4, 3, 2, 1].map((rating) => (
                            <label key={rating} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="rating"
                                    checked={currentFilters.rating === rating}
                                    onChange={() => handleRatingChange(rating)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-3 text-sm text-gray-700 flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                    <span className="ml-1">& above</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 🔧 Condition Filter */}
                {availableFilters.conditions && availableFilters.conditions.length > 0 && (
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Condition</h3>
                        <div className="space-y-2">
                            {availableFilters.conditions.map((condition) => (
                                <label key={condition} className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isConditionSelected(condition)}
                                        onChange={() => handleConditionChange(condition)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 capitalize">
                                        {condition}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* 📦 In Stock Filter */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Availability</h3>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={currentFilters.inStock === true}
                            onChange={() => handleStockChange(true)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                            In Stock Only ({availableFilters.inStockCount || 0} available)
                        </span>
                    </label>
                </div>

                {/* Results Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{products.length}</span> of{' '}
                        <span className="font-semibold">{availableFilters.totalProducts || 0}</span> products
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                        <div>Available Price Range: ₹{availableRange.min.toLocaleString()} - ₹{availableRange.max.toLocaleString()}</div>
                        <div>Selected Price Range: ₹{localPriceInputs.min.toLocaleString()} - ₹{localPriceInputs.max.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailFilters;