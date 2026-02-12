// src/pages/products/UsedLaptopsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';

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
} from '../../redux/selectors';

// Components
import ProductCard from '../product/ProductCard';
import ProductDetailFilters from '../product/ProductDetailFilters';
import ProductPagination from '../product/ProductPagination';
import ProductCardShimmer from '../product/ProductCardShimmer';
import { useAuthErrorHandler } from '../hooks/useAuthErrorHandler';

// --- Reusing Shimmer Components ---
const ProductCardShimmerGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardShimmer key={index} />
      ))}
    </div>
  );
};

const FilterShimmer: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    {[1, 2, 3].map((section) => (
      <div key={section} className="border-b border-gray-100 pb-6 last:border-0">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-5"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-3 bg-gray-100 rounded w-1/2"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const HeaderShimmer: React.FC = () => (
  <div className="animate-pulse mb-5 border-b border-gray-100 pb-6">
    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
  </div>
);

const UsedLaptopsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const { handleAuthError } = useAuthErrorHandler();

  // Redux Selectors
  const products = useAppSelector(selectProducts);
  console.log(products);
  
  const loading = useAppSelector(selectProductsLoading);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const error = useAppSelector(selectProductsError);
  const filters = useAppSelector(selectProductFilters);
  const availableFilters = useAppSelector(selectAvailableFilters);
  const totalPages = useAppSelector(selectTotalPages);
  const totalProducts = useAppSelector(selectTotalProducts);
  const currentPage = useAppSelector(selectCurrentPage);
  const activeFilters = useAppSelector(selectActiveFilters);

  // --- 1. CONFIGURATION ---
  const BASE_CATEGORY_SLUG = 'laptops'; 
  const BASE_CONDITION = 'Used'; 

  // --- 2. SEO CONFIGURATION ---
  const siteUrl = "https://itechcomputers.shop";
  const canonicalUrl = `${siteUrl}/used-laptops${currentPage > 1 ? `?page=${currentPage}` : ''}`;
  
  const seoTitle = "Buy Used Laptops | Certified Refurbished | iTech Computers";
  const seoDescription = "Shop high-performance used and refurbished laptops at iTech Computers Salem. Quality tested, warranty backed, and best prices guaranteed.";

  // --- 3. INITIALIZATION & CLEANUP (The Fix) ---
  useEffect(() => {
    // ✅ CRITICAL: Clear old products immediately so users don't see "New" products flash
    dispatch(productActions.clearProducts()); 

    return () => {
      dispatch(productActions.clearProducts());
    };
  }, [dispatch]);

  // --- 4. FILTER LOGIC ---
  useEffect(() => {
    const urlFilters: any = {
      category: BASE_CATEGORY_SLUG, 
      condition: BASE_CONDITION,    
      page: 1,                      
      limit: 12,                    
      search: '',                   
      sortBy: 'newest',
      
      // Explicitly clear potentially stale filters
      brand: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      inStock: null
    };

    searchParams.forEach((value, key) => {
      // Ignore URL attempts to override category/condition
      if (key === 'category' || key === 'condition') return;

      if (['minPrice', 'maxPrice', 'rating', 'page', 'limit'].includes(key)) {
        const numValue = Number(value);
        if (!isNaN(numValue) && value !== '') {
          urlFilters[key] = numValue;
        }
      } else if (key === 'inStock') {
        urlFilters[key] = value === 'true';
      } else if (key === 'sort') {
        const sortMap: Record<string, string> = {
          'newest': 'newest', 'price-low': 'price-low', 'price-high': 'price-high', 'rating': 'rating'
        };
        urlFilters.sortBy = sortMap[value] || 'newest';
      } else {
        urlFilters[key] = value;
      }
    });
    dispatch(productActions.updateFilters(urlFilters));
  }, [searchParams, dispatch]);

  // --- 5. FETCH DATA (With Guard Clause) ---
  useEffect(() => {
    const fetchUsedLaptops = async () => {
      
      // ✅ CRITICAL GUARD: Do not fetch if Redux hasn't updated to 'Used' yet.
      // This prevents the "All Products" API call race condition.
      if (filters.condition !== BASE_CONDITION || filters.category !== BASE_CATEGORY_SLUG) {
         return; 
      }

      try {
        await dispatch(productActions.fetchProducts(filters, { 
          categoryName: 'renewed-laptops' // UI Label
        }));
      } catch (error: any) {
        if (handleAuthError(error)) return;
      }
    };
    fetchUsedLaptops();
  }, [filters, dispatch, handleAuthError]);

  // --- 6. EVENT HANDLERS ---
  const updateFilter = useCallback((key: string, value: string | number | boolean | null) => {
    // Prevent user from removing the core logic of this page
    if (key === 'condition' || key === 'category') return;

    const newParams = new URLSearchParams(searchParams);
    if (key !== 'page') newParams.delete('page');
    
    if (value === null || value === '' || value === false) newParams.delete(key);
    else newParams.set(key, value.toString());
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSortChange = useCallback((sortBy: string) => {
    updateFilter('sortBy', sortBy);
  }, [updateFilter]);

  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
    toast.success('Filters reset to default');
  }, [setSearchParams]);

  const removeFilter = useCallback((key: string) => {
    updateFilter(key, null);
  }, [updateFilter]);

  const handlePageChange = useCallback((page: number) => {
    updateFilter('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateFilter]);

  // Hide the Category filter AND Condition filter from the sidebar
  const shouldShowFilter = useCallback((filterType: string) => {
    if (filterType === 'category') return false; 
    if (filterType === 'condition') return false; 
    return true;
  }, []);

  const getRemovableActiveFilters = useCallback(() => {
    return activeFilters.filter(f => f.key !== 'category' && f.key !== 'condition');
  }, [activeFilters]);

  const hasRemovableFilters = getRemovableActiveFilters().length > 0;

  // --- 7. LOADING STATE ---
  if (loading && products.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-4 py-8 md:py-6 bg-white min-h-screen">
        <HeaderShimmer />
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-64 hidden lg:block"><FilterShimmer /></div>
          <div className="flex-1"><ProductCardShimmerGrid count={8} /></div>
        </div>
      </div>
    );
  }

  // --- 8. RENDER ---
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
      </Helmet>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        
        {/* --- Header --- */}
        <div className="flex flex-col gap-6 mb-10 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="block text-xs font-semibold tracking-widest text-emerald-600 uppercase mb-2">
                Special Collection
              </span>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
                Used Laptops
              </h1>
              <p className="mt-2 text-gray-500 text-sm">
                {totalProducts} certified units available. Performance tested & quality checked.
              </p>
                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Note:</strong> All laptops listed on this page are <strong>pre-owned</strong>.
              Each device is professionally tested for performance and quality.
              Exact condition details are clearly mentioned on the product page.
            </p>
          </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="xl:hidden flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                Filters
              </button>

              <div className="relative flex-1 md:flex-none md:min-w-[200px]">
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium focus:ring-1 focus:ring-black focus:border-black cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasRemovableFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {getRemovableActiveFilters().map(filter => (
                <button
                  key={filter.key}
                  onClick={() => removeFilter(filter.key)}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-500 font-normal">{filter.label.split(':')[0]}:</span>
                  <span>{filter.label.split(':')[1]}</span>
                  <span className="text-gray-400 group-hover:text-gray-600">×</span>
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 hover:underline ml-2"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* --- Main Content Layout --- */}
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-16 relative">
          
          {/* Sidebar Filters */}
          <div className={`
            fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
            xl:relative xl:transform-none xl:z-0 xl:w-80 xl:block
            ${showFilters ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
          `}>
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm xl:hidden" onClick={() => setShowFilters(false)}></div>
             <div className="relative h-full w-[85%] max-w-xs bg-white xl:bg-transparent xl:w-full xl:max-w-none shadow-2xl xl:shadow-none overflow-hidden flex flex-col">
                <div className="xl:hidden px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                  <span className="text-lg font-semibold">Filters</span>
                  <button onClick={() => setShowFilters(false)}>✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 xl:p-0 xl:sticky xl:top-24">
                  <ProductDetailFilters
                    showFilters={true}
                    availableFilters={availableFilters}
                    currentFilters={filters}
                    onUpdateFilter={updateFilter}
                    onClearFilters={clearFilters}
                    shouldShowFilter={shouldShowFilter} // Prevents untoggling Used/Laptops
                    products={products}
                  />
                </div>

                <div className="xl:hidden p-6 border-t border-gray-100 bg-white">
                  <button onClick={() => setShowFilters(false)} className="w-full py-3 bg-black text-white font-medium rounded-lg">
                    Show Results
                  </button>
                </div>
             </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-h-[500px]">
            {loading && products.length > 0 && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10" />
            )}

            {products.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl">💻</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No used laptops found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your price range or brand filters.</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium">
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-20 border-t border-gray-100 pt-10">
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

export default UsedLaptopsPage;