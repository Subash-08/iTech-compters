import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
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
import ProductDetailFilters from './ProductDetailFilters';
import ProductPagination from './ProductPagination';
import { useAuthErrorHandler } from '../hooks/useAuthErrorHandler';

const ProductList: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const { brandName, categoryName } = useParams();
  
  const { handleAuthError } = useAuthErrorHandler();

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

  const isRouteFilter = useCallback((key: string) => {
    return (key === 'category' && categoryName) || (key === 'brand' && brandName);
  }, [categoryName, brandName]);

useEffect(() => {
    const urlFilters: any = {};
    
    console.log('🔄 URL changed, parsing search params:', Object.fromEntries(searchParams.entries()));
    
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

    // Apply route parameters
    if (brandName) urlFilters.brand = brandName.replace(/-/g, ' ');
    if (categoryName) urlFilters.category = categoryName.replace(/-/g, ' ');

    console.log('📋 Parsed URL filters:', urlFilters);
    
    // Only update Redux if URL actually changed
    dispatch(productActions.updateFilters(urlFilters));
  }, [searchParams, brandName, categoryName, dispatch]);

  // ✅ FIXED: Fetch products when URL changes (NOT when Redux filters change)
  useEffect(() => {
    const fetchProductsWithAuth = async () => {
      try {
        console.log('🚀 Fetching products with filters:', filters);
        await dispatch(productActions.fetchProducts(filters, { 
          brandName: brandName?.replace(/-/g, ' '), 
          categoryName: categoryName?.replace(/-/g, ' ') 
        }));
      } catch (error: any) {
        if (handleAuthError(error)) {
          return;
        }
      }
    };

    fetchProductsWithAuth();
  }, [filters, dispatch, handleAuthError, brandName, categoryName]);



  // ✅ FIXED: Update filter function to handle sortBy
  const updateFilter = useCallback((key: string, value: string | number | boolean | null) => {
    console.log('🎛️ Updating filter:', { key, value, currentParams: Object.fromEntries(searchParams.entries()) });
    
    // Prevent removing route-based filters
    if (value === null && isRouteFilter(key)) {
      toast.info(`Cannot remove ${key} filter on this page`);
      return;
    }
    
    const newParams = new URLSearchParams(searchParams);
    
    // Reset to page 1 when filters change (except page and limit changes)
    if (key !== 'page' && key !== 'limit') {
      newParams.delete('page');
    }
    
    // Handle value removal
    if (value === null || value === '' || value === false) {
      newParams.delete(key);
      console.log('❌ Deleted filter:', key);
    } else {
      newParams.set(key, value.toString());
      console.log('✅ Set filter:', key, value);
    }
    
    console.log('🔗 New URL params:', Object.fromEntries(newParams.entries()));
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, isRouteFilter]);

  // Add debug logging for current state
  useEffect(() => {
    console.log('📊 CURRENT STATE:');
    console.log('   URL Params:', Object.fromEntries(searchParams.entries()));
    console.log('   Redux Filters:', filters);
    console.log('   Products Count:', products.length);
  }, [searchParams, filters, products.length]);
const handleSortChange = useCallback((sortBy: string) => {
    console.log('🔀 Changing sort to:', sortBy);
    updateFilter('sortBy', sortBy);
  }, [updateFilter]);
 const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    
    console.log('🧹 Clearing all filters');
    
    // Only preserve route parameters, remove all other filters
    if (brandName) newParams.set('brand', brandName);
    if (categoryName) newParams.set('category', categoryName);
    
    console.log('🔗 New URL after clear:', newParams.toString());
    
    setSearchParams(newParams);
    toast.success('Filters cleared successfully');
  }, [brandName, categoryName, setSearchParams]);

  // ✅ FIXED: Remove specific filter
  const removeFilter = useCallback((key: string) => {
    if (isRouteFilter(key)) {
      toast.info(`Cannot remove ${key} filter on this page`);
      return;
    }
    
    console.log('🗑️ Removing filter:', key);
    updateFilter(key, null);
  }, [updateFilter, isRouteFilter]);



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

  // Handle retry with auth error handling
  const handleRetry = useCallback(async () => {
    try {
      await dispatch(productActions.fetchProducts(filters));
    } catch (error: any) {
      if (handleAuthError(error)) {
        return;
      }
      toast.error('Failed to load products. Please try again.');
    }
  }, [dispatch, filters, handleAuthError]);

  // Get removable active filters (excluding route filters)
  const getRemovableActiveFilters = useCallback(() => {
    return activeFilters.filter(filter => !isRouteFilter(filter.key));
  }, [activeFilters, isRouteFilter]);

  const hasRemovableFilters = getRemovableActiveFilters().length > 0;

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  // Error state with auth handling
  if (error && products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
            {hasRemovableFilters && (
              <button 
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
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
                  {filter.label}: {filter.value}
                  <span className="ml-1 text-gray-600">×</span>
                </button>
              ))}
              
              {/* Clear All button - only show if there are removable filters */}
              {hasRemovableFilters && (
                <button
                  onClick={clearFilters}
                  className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded hover:bg-red-200 transition-colors border border-red-300"
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
        {/* Filters Sidebar - Using your ProductDetailFilters */}
        <ProductDetailFilters
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
              {hasRemovableFilters && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
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