// src/components/products/ProductList.tsx
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
  selectLastSearchQuery,
} from '../../redux/selectors';

// Components
import ProductCard from './ProductCard';
import ProductDetailFilters from './ProductDetailFilters';
import ProductPagination from './ProductPagination';
import { useAuthErrorHandler } from '../hooks/useAuthErrorHandler';
import ProductCardShimmer from './ProductCardShimmer';

// --- Premium Shimmer Components ---
const ProductCardShimmerGrid: React.FC<{ count?: number }> = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardShimmer key={index} />
      ))}
    </div>
  );
};

const FilterShimmer: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3, 4].map((section) => (
        <div key={section} className="border-b border-gray-100 pb-6">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center">
                <div className="h-4 w-4 bg-gray-200 rounded-sm mr-3"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const HeaderShimmer: React.FC = () => {
  return (
    <div className="animate-pulse mb-8">
      <div className="h-10 bg-gray-200 rounded w-64 mb-3"></div>
      <div className="h-4 bg-gray-100 rounded w-48 mb-6"></div>
      <div className="flex gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-8 bg-gray-200 rounded-full w-24"></div>
        ))}
      </div>
    </div>
  );
};

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
  const lastSearchQuery = useAppSelector(selectLastSearchQuery);
  
  const isRouteFilter = useCallback((key: string) => {
    return (key === 'category' && categoryName) || (key === 'brand' && brandName);
  }, [categoryName, brandName]);

  // Handle URL Params
  useEffect(() => {
    const urlFilters: any = {};
    searchParams.forEach((value, key) => {
      if ((key === 'category' && categoryName) || (key === 'brand' && brandName)) return;
      
      if (['minPrice', 'maxPrice', 'rating', 'page', 'limit'].includes(key)) {
        const numValue = Number(value);
        urlFilters[key] = value === '' ? null : (isNaN(numValue) ? null : numValue);
      } else if (key === 'inStock') {
        urlFilters[key] = value === 'true';
      } else if (key === 'sort') {
        const sortMap: Record<string, string> = {
          'newest': 'newest', 'price-low': 'price-low', 'price-high': 'price-high',
          'rating': 'rating', 'popular': 'popular'
        };
        urlFilters.sortBy = sortMap[value] || 'newest';
      } else if (key === 'sortBy') {
        urlFilters[key] = value;
      } else {
        urlFilters[key] = value;
      }
    });
    dispatch(productActions.updateFilters(urlFilters));
  }, [searchParams, dispatch, brandName, categoryName]);

  // Fetch Products
  useEffect(() => {
    const fetchProductsWithAuth = async () => {
      try {
        await dispatch(productActions.fetchProducts(filters, { 
          brandName: brandName?.replace(/-/g, ' '), 
          categoryName: categoryName?.replace(/-/g, ' ') 
        }));
      } catch (error: any) {
        if (handleAuthError(error)) return;
      }
    };
    if (categoryName || brandName || (!categoryName && !brandName)) {
      fetchProductsWithAuth();
    }
  }, [filters, dispatch, handleAuthError, brandName, categoryName]);

  // Filter Handlers
  const updateFilter = useCallback((key: string, value: string | number | boolean | null) => {
    if (value === null && isRouteFilter(key)) {
      toast.info(`Cannot remove ${key} filter on this page`);
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    if (key !== 'page' && key !== 'limit') newParams.delete('page');
    if (value === null || value === '' || value === false) newParams.delete(key);
    else newParams.set(key, value.toString());
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, isRouteFilter]);

  const handleSortChange = useCallback((sortBy: string) => {
    const urlSortMap: Record<string, string> = {
      'featured': 'newest', 'newest': 'newest', 'price-low': 'price-low', 
      'price-high': 'price-high', 'rating': 'rating', 'popular': 'popular'
    };
    updateFilter('sortBy', sortBy);
  }, [updateFilter]);

  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
    dispatch(productActions.clearFilters({ 
      brandName: brandName?.replace(/-/g, ' '), 
      categoryName: categoryName?.replace(/-/g, ' ') 
    }));
    toast.success('Filters cleared successfully');
  }, [setSearchParams, dispatch, brandName, categoryName]);

  const removeFilter = useCallback((key: string) => {
    if (isRouteFilter(key)) {
      toast.info(`Cannot remove ${key} filter on this page`);
      return;
    }
    updateFilter(key, null);
  }, [updateFilter, isRouteFilter]);

  const handlePageChange = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  const getPageTitle = useCallback(() => {
    if (brandName) return `${brandName.replace(/-/g, ' ')}`;
    if (categoryName) return `${categoryName.replace(/-/g, ' ')}`;
    if (lastSearchQuery) return `Results for "${lastSearchQuery}"`;
    return 'All Products';
  }, [brandName, categoryName, lastSearchQuery]);

  const shouldShowFilter = useCallback((filterType: 'brand' | 'category') => {
    if (filterType === 'brand' && brandName) return false;
    if (filterType === 'category' && categoryName) return false;
    return true;
  }, [brandName, categoryName]);

  const handleRetry = useCallback(async () => {
    try {
      await dispatch(productActions.fetchProducts(filters, { 
        brandName: brandName?.replace(/-/g, ' '), 
        categoryName: categoryName?.replace(/-/g, ' ') 
      }));
    } catch (error: any) {
      if (handleAuthError(error)) return;
      toast.error('Failed to load products. Please try again.');
    }
  }, [dispatch, filters, handleAuthError, brandName, categoryName]);

  const getRemovableActiveFilters = useCallback(() => {
    return activeFilters.filter(filter => !isRouteFilter(filter.key));
  }, [activeFilters, isRouteFilter]);

  const hasRemovableFilters = getRemovableActiveFilters().length > 0;

  const clearSearch = useCallback(() => {
    dispatch(productActions.clearSearchResults());
    updateFilter('search', null);
  }, [dispatch, updateFilter]);

  // --- Initial Loading State ---
  if (loading && products.length === 0) {
    return (
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <HeaderShimmer />
        <div className="flex flex-col lg:flex-row gap-10 mt-8">
          <div className="w-full lg:w-72 hidden lg:block">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <FilterShimmer />
            </div>
          </div>
          <div className="flex-1">
            <ProductCardShimmerGrid count={8} />
          </div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error && products.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50/50">
        <div className="text-center p-12 max-w-lg">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">⚠️</div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">Unable to Load Products</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleRetry}
              className="px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg shadow-gray-200"
            >
              Try Again
            </button>
            <Link 
              to="/"
              className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-all duration-300"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Content ---
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-12 py-10">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight capitalize">
                  {getPageTitle()}
                </h1>
                <span className="text-gray-400 font-medium text-lg">
                  {totalProducts}
                </span>
              </div>
              <p className="text-gray-500 mt-2 text-lg">
                Curated collection for you.
              </p>
            </div>

            {/* Sort & Filter Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters
              </button>

              <div className="relative group">
                <select
                  value={filters.sortBy || 'featured'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all cursor-pointer shadow-sm"
                  disabled={loading}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest Drops</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Filters Bar */}
          {(hasActiveFilters || lastSearchQuery) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              
              {/* Route Filters (Static) */}
              {(brandName || categoryName) && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black text-white shadow-md">
                  {brandName ? `Brand: ${brandName.replace(/-/g, ' ')}` : `Category: ${categoryName?.replace(/-/g, ' ')}`}
                </span>
              )}

              {/* Removable Filters */}
              {getRemovableActiveFilters().map(filter => (
                <button
                  key={filter.key}
                  onClick={() => removeFilter(filter.key)}
                  className="group inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm"
                >
                  {filter.label}
                  <svg className="ml-2 w-3 h-3 text-gray-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}

              {/* Search Badge */}
              {lastSearchQuery && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  "{lastSearchQuery}"
                  <button onClick={clearSearch} className="ml-2 hover:text-blue-900">×</button>
                </span>
              )}

              {/* Clear All */}
              {(hasRemovableFilters || lastSearchQuery) && (
                <button
                  onClick={() => { clearFilters(); if(lastSearchQuery) clearSearch(); }}
                  className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-wider ml-2 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-14 relative">
          
          {/* --- Sidebar Filters --- */}
          <div className={`
            fixed inset-0 z-40 bg-white/95 backdrop-blur-md transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:bg-transparent lg:backdrop-blur-none lg:z-0 lg:w-72 lg:block
            ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile Close Button */}
            <div className="lg:hidden p-6 flex justify-between items-center border-b border-gray-100">
              <span className="text-lg font-bold">Filters</span>
              <button onClick={() => setShowFilters(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="h-full overflow-y-auto lg:overflow-visible p-6 lg:p-0">
               <ProductDetailFilters
                  showFilters={true}
                  availableFilters={availableFilters}
                  currentFilters={filters}
                  onUpdateFilter={updateFilter}
                  onClearFilters={clearFilters}
                  shouldShowFilter={shouldShowFilter}
                  products={products}
                />
            </div>
          </div>

          {/* Backdrop for Mobile */}
          {showFilters && (
            <div 
              className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
          )}

          {/* --- Product Grid & Content --- */}
          <div className="flex-1 relative min-h-[500px]">
            
            {/* Loading Overlay (Glassmorphism) */}
            {loading && products.length > 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-start justify-center pt-32 transition-opacity duration-300">
                <div className="bg-white px-6 py-3 rounded-full shadow-xl border border-gray-100 flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-sm font-medium text-gray-900">Updating Catalog...</span>
                </div>
              </div>
            )}

            {products.length === 0 && !loading ? (
              // --- Empty State ---
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 text-3xl">
                  {lastSearchQuery ? '🔍' : '📦'}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {lastSearchQuery ? 'No matches found' : 'Collection Empty'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                  {lastSearchQuery 
                    ? `We couldn't find anything matching "${lastSearchQuery}". Try using broader terms.`
                    : 'We are currently restocking this collection. Check back later for new drops.'
                  }
                </p>
                <div className="flex gap-4">
                  {hasRemovableFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl font-semibold hover:border-gray-400 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <Link 
                    to="/products"
                    className="px-6 py-2.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                  >
                    View All Products
                  </Link>
                </div>
              </div>
            ) : (
              // --- Products Grid ---
              <div className="animate-fade-in-up">
<div className="grid gap-6 lg:gap-8"
     style={{
       gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
     }}>
  {products.map((product) => (
    <ProductCard key={product._id} product={product} />
  ))}
</div>


                {totalPages > 1 && (
                  <div className="mt-16 pt-8 border-t border-gray-100">
                    <ProductPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;