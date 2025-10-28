import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { toast } from 'react-toastify';

// Redux imports
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { productActions } from '../../redux/actions/productActions';
import {
  selectProducts,
  selectProductsLoading,
  selectProductsError,
  selectProductFilters,
  selectAvailableFilters,
  selectTotalPages,
  selectTotalProducts,
  selectCurrentPage,
  selectActiveFilters,
  selectHasActiveFilters,
} from '../../redux/selectors';

// Components
import ProductCard from './ProductCard';
import ProductFilters from './ProductDetailFilters';
import ProductPagination from './ProductPagination';

const ProductList: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const { brandName, categoryName } = useParams();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Redux selectors
  const products = useAppSelector(selectProducts);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);
  const filters = useAppSelector(selectProductFilters);
  const availableFilters = useAppSelector(selectAvailableFilters);
  const totalPages = useAppSelector(selectTotalPages);
  const totalProducts = useAppSelector(selectTotalProducts);
  const currentPage = useAppSelector(selectCurrentPage);
  const activeFilters = useAppSelector(selectActiveFilters);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);

  // ✅ Check if filter is from route (non-removable)
  const isRouteFilter = useCallback((key: string) => {
    return (key === 'category' && categoryName) || (key === 'brand' && brandName);
  }, [categoryName, brandName]);

  // ✅ FIXED: Convert URL params to filters - Run this FIRST
  useEffect(() => {
    const urlFilters: any = {};
    
    // Get all URL parameters
    searchParams.forEach((value, key) => {
      if (key === 'inStock') {
        urlFilters[key] = value === 'true';
      } else if (key === 'minPrice' || key === 'maxPrice' || key === 'rating' || key === 'page' || key === 'limit') {
        urlFilters[key] = Number(value);
      } else if (key === 'sortBy') {
        urlFilters[key] = value;
      } else {
        urlFilters[key] = value;
      }
    });

    // Apply route parameters with higher priority
    if (brandName) urlFilters.brand = brandName.replace(/-/g, ' ');
    if (categoryName) urlFilters.category = categoryName.replace(/-/g, ' ');

    dispatch(productActions.updateFilters(urlFilters));
    setIsInitialLoad(false);
  }, [searchParams, brandName, categoryName, dispatch]);

  // ✅ FIXED: Fetch max price when category or brand changes OR on initial load
  useEffect(() => {
    if (!isInitialLoad) {
      const maxPriceFilters: any = {};
      
      if (categoryName) maxPriceFilters.category = categoryName.replace(/-/g, ' ');
      if (brandName) maxPriceFilters.brand = brandName.replace(/-/g, ' ');
            dispatch(productActions.fetchMaxPrice(maxPriceFilters));
    }
  }, [categoryName, brandName, dispatch, isInitialLoad]);

  // ✅ FIXED: Fetch products when filters change - with proper dependency order
  useEffect(() => {
    if (!isInitialLoad) {
      dispatch(productActions.fetchProducts(filters));
    }
  }, [filters, dispatch, isInitialLoad]);

  // ✅ FIXED: Extract available filters when products change (without maxPrice)
  useEffect(() => {
    if (products.length > 0 && !isInitialLoad) {
      dispatch(productActions.extractAvailableFilters(products));
    }
  }, [products, dispatch, isInitialLoad]);

  // ✅ FIXED: Improved filter update function with route protection
  const updateFilter = useCallback((key: string, value: string | number | boolean | null) => {
    // Prevent removing route-based filters
    if (value === null && isRouteFilter(key)) {
      toast.info(`Cannot remove ${key} filter on this page`);
      return;
    }
    
    const newParams = new URLSearchParams(searchParams);
    
    // Reset to page 1 when filters change (except page changes)
    if (key !== 'page' && key !== 'limit') {
      newParams.delete('page');
    }
    
    // Handle value removal
    if (value === null || value === '' || value === false || value === 0) {
      newParams.delete(key);
    } else {
      newParams.set(key, value.toString());
    }
    setSearchParams(newParams);
    
    // Also update Redux state immediately for better UX
    dispatch(productActions.updateFilters({ 
      [key]: value, 
      page: key !== 'page' ? 1 : filters.page 
    }));
  }, [searchParams, setSearchParams, dispatch, filters.page, isRouteFilter]);

  // ✅ FIXED: Clear all filters - protect route filters
  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    
    // Preserve route parameters if they exist
    if (brandName) newParams.set('brand', brandName);
    if (categoryName) newParams.set('category', categoryName);
    setSearchParams(newParams);
    dispatch(productActions.clearFilters());
    toast.success('Filters cleared successfully');
  }, [brandName, categoryName, setSearchParams, dispatch]);

  // ✅ FIXED: Remove specific filter - protect route filters
  const removeFilter = useCallback((key: string) => {
    // Prevent removing route-based filters
    if (isRouteFilter(key)) {
      toast.info(`Cannot remove ${key} filter on this page`);
      return;
    }
    updateFilter(key, null);
  }, [updateFilter, isRouteFilter]);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string) => {
    updateFilter('sortBy', sortBy);
  }, [updateFilter]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  // Get page title
  const getPageTitle = useCallback(() => {
    if (brandName) {
      return `${brandName.replace(/-/g, ' ')} Products`;
    } else if (categoryName) {
      return `${categoryName.replace(/-/g, ' ')} Products`;
    } else if (filters.search) {
      return `Search Results for "${filters.search}"`;
    } else if (filters.category) {
      return `${filters.category} Products`;
    } else if (filters.brand) {
      return `${filters.brand} Products`;
    } else {
      return 'All Products';
    }
  }, [brandName, categoryName, filters.search, filters.category, filters.brand]);

  // Check if we should show specific filters
  const shouldShowFilter = useCallback((filterType: 'brand' | 'category') => {
    if (filterType === 'brand' && brandName) return false;
    if (filterType === 'category' && categoryName) return false;
    return true;
  }, [brandName, categoryName]);

  // ✅ Get filtered active filters (excluding route filters from removal)
  const getRemovableActiveFilters = useCallback(() => {
    return activeFilters.filter(filter => !isRouteFilter(filter.key));
  }, [activeFilters, isRouteFilter]);

  // ✅ Check if we have any removable filters
  const hasRemovableFilters = useCallback(() => {
    return getRemovableActiveFilters().length > 0;
  }, [getRemovableActiveFilters]);
  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            This might be due to server issues or incompatible filter parameters.
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => dispatch(productActions.fetchProducts(filters))}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
            <Link 
              to="/"
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 mt-1">
            Showing {products.length} of {totalProducts} products
            {loading && products.length > 0 && ' (Updating...)'}
          </p>
          
          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Route-based filters (non-removable) */}
              {brandName && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center border border-blue-200">
                  <span className="mr-1">🏷️</span>
                  Brand: {brandName.replace(/-/g, ' ')}
                </span>
              )}
              {categoryName && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center border border-green-200">
                  <span className="mr-1">📁</span>
                  Category: {categoryName.replace(/-/g, ' ')}
                </span>
              )}
              
              {/* Removable filters */}
              {getRemovableActiveFilters().map(filter => (
                <button
                  key={filter.key}
                  onClick={() => removeFilter(filter.key)}
                  className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  {filter.label}
                  <span className="ml-1 text-gray-600">×</span>
                </button>
              ))}
              
              {/* Clear All button - only show if there are removable filters */}
              {hasRemovableFilters() && (
                <button
                  onClick={clearFilters}
                  className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <select
            value={filters.sortBy || 'featured'}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <ProductFilters
          showFilters={showFilters}
          availableFilters={availableFilters}
          currentFilters={filters}
          onUpdateFilter={updateFilter}
          onClearFilters={clearFilters}
          shouldShowFilter={shouldShowFilter}
          products={products}
        />

        {/* Products Grid */}
        <div className="flex-1">
          {products.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">😔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
              <button
                onClick={clearFilters}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <ProductPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;