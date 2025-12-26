// src/components/products/ProductList.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
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
const ProductCardShimmerGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardShimmer key={index} />
      ))}
    </div>
  );
};

const FilterShimmer: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3].map((section) => (
        <div key={section} className="border-b border-gray-100 pb-6 last:border-0">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-5"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-3 bg-gray-50 rounded w-4"></div>
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
    <div className="animate-pulse mb-5 border-b border-gray-100 pb-6">
      <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-100 rounded-full w-20"></div>
        <div className="h-8 bg-gray-100 rounded-full w-24"></div>
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

  // --- SEO LOGIC START ---
  const siteUrl = "https://itechcomputers.shop"; 
  const canonicalPath = categoryName 
    ? `/products/category/${categoryName}`
    : brandName 
      ? `/products/brand/${brandName}` 
      : '/products';
  
  const canonicalUrl = `${siteUrl}${canonicalPath}${currentPage > 1 ? `?page=${currentPage}` : ''}`;

  const getSEOTitle = () => {
    if (categoryName) {
      const cleanName = categoryName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `Buy ${cleanName} Online | Best Prices in Salem | iTech Computers`;
    }
    if (brandName) {
      const cleanName = brandName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${cleanName} Products | Official Dealer Salem | iTech Computers`;
    }
    if (lastSearchQuery) {
      return `Search Results for "${lastSearchQuery}" | iTech Computers`;
    }
    return "Shop Computer Parts & Laptops | iTech Computers Salem";
  };

  const getSEODescription = () => {
    if (categoryName) {
      const cleanName = categoryName.replace(/-/g, ' ');
      return `Shop the best range of ${cleanName} at iTech Computers. We offer competitive prices, genuine products, and expert support in Salem.`;
    }
    if (brandName) {
      const cleanName = brandName.replace(/-/g, ' ');
      return `Browse our collection of ${cleanName} products. Laptops, desktops, and accessories available at iTech Computers Salem.`;
    }
    return "Your one-stop shop for custom PCs, laptops, and computer accessories in Salem. Best deals on top tech brands.";
  };

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": "Products", "item": `${siteUrl}/products` },
        (categoryName || brandName) && { 
          "@type": "ListItem", 
          "position": 3, 
          "name": (categoryName || brandName)?.replace(/-/g, ' '), 
          "item": canonicalUrl 
        }
      ].filter(Boolean)
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": getSEOTitle(),
      "description": getSEODescription(),
      "url": canonicalUrl,
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": products.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `${siteUrl}/product/${product.slug}`,
          "name": product.name
        }))
      }
    }
  ];
  // --- SEO LOGIC END ---
  
  const isRouteFilter = useCallback((key: string) => {
    return (key === 'category' && categoryName) || (key === 'brand' && brandName);
  }, [categoryName, brandName]);

  // ✅ 1. INITIAL CLEANUP: Prevent showing stale (Used) products from other pages
  useEffect(() => {
    dispatch(productActions.clearProducts());
    
    // Optional: Also ensure filters start clean to avoid carrying over 'Used' from other pages
    // before the URL logic kicks in.
    return () => {
      dispatch(productActions.clearProducts());
    };
  }, [dispatch]);

  // Handle URL Params
  useEffect(() => {
    const urlFilters: any = {};
    
    searchParams.forEach((value, key) => {
      // 🔒 SECURITY: If user manually types ?condition=Used, ignore it
      if (key === 'condition' && value.toLowerCase().includes('used')) return;
      
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

    // 🔒 DEFAULT: If no condition is selected (or we stripped 'Used'), force New & Refurbished
    if (!urlFilters.condition) {
       urlFilters.condition = 'New,Refurbished';
    }

    dispatch(productActions.updateFilters(urlFilters));
  }, [searchParams, dispatch, brandName, categoryName]);

  // Fetch Products
  useEffect(() => {
    const fetchProductsWithAuth = async () => {
      
      // ✅ 2. GUARD CLAUSE: Strict Check
      // If the filters are empty (initial load) OR if they contain 'Used' (stale state),
      // DO NOT FETCH. Wait for the URL useEffect to set 'New,Refurbished'.
      if (!filters.condition || filters.condition.includes('Used')) {
         return;
      }

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

  // ✅ 3. CLEAR FILTERS FIX: Force condition immediately
  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
    
    // We manually update Redux *immediately* to prevent a flash of "All Products"
    // while the URL params are being processed.
    dispatch(productActions.updateFilters({
      minPrice: 0,
      maxPrice: 0,
      rating: 0,
      inStock: false,
      search: '',
      page: 1,
      brand: brandName ? brandName.replace(/-/g, ' ') : '',
      category: categoryName ? categoryName.replace(/-/g, ' ') : '',
      condition: 'New,Refurbished' // 🔒 Lock it down
    }));

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateFilter]);

  const getPageTitle = useCallback(() => {
    if (brandName) return `${brandName.replace(/-/g, ' ')}`;
    if (categoryName) return `${categoryName.replace(/-/g, ' ')}`;
    if (lastSearchQuery) return `"${lastSearchQuery}"`;
    return 'Latest Arrivals';
  }, [brandName, categoryName, lastSearchQuery]);

  const shouldShowFilter = useCallback((filterType: string) => {
    if (filterType === 'brand' && brandName) return false;
    if (filterType === 'category' && categoryName) return false;
    // ✅ ALLOW 'condition' to return true here so the UI shows up
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
      toast.error('Failed to load products.');
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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-white min-h-screen">
        <HeaderShimmer />
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-64 hidden lg:block">
            <FilterShimmer />
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
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 text-red-500 rounded-xl mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4 text-sm leading-relaxed">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleRetry} className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Try Again
            </button>
            <Link to="/" className="px-6 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Content ---
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-900 selection:text-white">
      {/* ✅ SEO: Metadata Injection */}
      <Helmet>
        <title>{getSEOTitle()}</title>
        <meta name="description" content={getSEODescription()} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={getSEOTitle()} />
        <meta property="og:description" content={getSEODescription()} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        
        {/* Don't index search result pages to avoid crawl budget waste */}
        {lastSearchQuery && <meta name="robots" content="noindex, follow" />}

        {/* Structured Data */}
        {structuredData.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* --- Header & Controls --- */}
        <div className="flex flex-col gap-4 mb-6 md:mb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            {/* Title Section */}
            <div className="relative">
               {/* Breadcrumb-ish / Overline */}
              {(brandName || categoryName) && (
                <span className="block text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">
                   {brandName ? 'Brand' : 'Collection'}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 capitalize leading-tight">
                {getPageTitle()}
              </h1>
              <p className="mt-2 text-gray-500 text-sm md:text-base font-normal">
                {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
              </p>
            </div>

            {/* Controls (Sort & Mobile Filter Trigger) */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                // Changed lg:hidden to xl:hidden so it shows on screens < 1280px
                className="xl:hidden flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>

              <div className="relative flex-1 md:flex-none md:min-w-[200px] group">
                <select
                  value={filters.sortBy || 'featured'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors cursor-pointer"
                  disabled={loading}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Bar */}
          {(hasActiveFilters || lastSearchQuery) && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {getRemovableActiveFilters().map(filter => (
                <button
                  key={filter.key}
                  onClick={() => removeFilter(filter.key)}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-500 font-normal">{filter.label.split(':')[0]}:</span>
                  <span>{filter.label.split(':')[1]}</span>
                  <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}

              {lastSearchQuery && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-900 text-white">
                  Search: {lastSearchQuery}
                  <button onClick={clearSearch} className="hover:text-gray-300">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              )}

              {(hasRemovableFilters || lastSearchQuery) && (
                <button
                  onClick={() => { clearFilters(); if(lastSearchQuery) clearSearch(); }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 hover:underline ml-2 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* --- Main Layout: Changed lg to xl breakpoints --- */}
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-16 relative">
          
          {/* --- Sidebar Filters --- */}
          {/* Changed lg:w-64 to xl:w-80 (Wider Sidebar)
              Changed lg:block to xl:block (Hidden on 1200px) 
          */}
          <div className={`
            fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
            xl:relative xl:transform-none xl:z-0 xl:w-80 xl:block
            ${showFilters ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
          `}>
             {/* Mobile Backdrop & Container */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm xl:hidden" onClick={() => setShowFilters(false)}></div>
            
            <div className="relative h-full w-[85%] max-w-xs bg-white xl:bg-transparent xl:w-full xl:max-w-none shadow-2xl xl:shadow-none overflow-hidden flex flex-col">
              
              {/* Mobile Header */}
              <div className="xl:hidden px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                <span className="text-lg font-semibold text-gray-900">Filters</span>
                <button onClick={() => setShowFilters(false)} className="p-2 -mr-2 text-gray-400 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-6 xl:p-0 xl:sticky xl:top-24">
                 <ProductDetailFilters
                   showFilters={true}
                   availableFilters={{
                    ...availableFilters,
                    conditions: ['New', 'Refurbished'] 
                   }}
                   currentFilters={filters}
                   onUpdateFilter={updateFilter}
                   onClearFilters={clearFilters}
                   shouldShowFilter={shouldShowFilter}
                   products={products}
                 />
              </div>

              {/* Mobile Footer Actions */}
              <div className="xl:hidden p-6 border-t border-gray-100 bg-white">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 bg-black text-white font-medium rounded-lg active:scale-95 transition-transform"
                >
                  Show {products.length} Results
                </button>
              </div>
            </div>
          </div>

          {/* --- Product Grid Section --- */}
          <div className="flex-1 min-h-[500px]">
            
            {/* Soft Loading State Overlay */}
            {loading && products.length > 0 && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 transition-opacity duration-300" />
            )}

            {products.length === 0 && !loading ? (
              // --- Empty State ---
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-4 text-sm">
                  {lastSearchQuery 
                    ? `We couldn't find any matches for "${lastSearchQuery}". Try adjusting your keywords.`
                    : 'Try adjusting your filters to find what you are looking for.'
                  }
                </p>
                {hasRemovableFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              // --- Products Grid ---
              <div className="animate-fade-in">
                {/* Layout Rules:
                  1. items-stretch: Forces equal height for all cards.
                  2. grid-cols-4: Default desktop columns.
                  3. gap-4 md:gap-6: Standardized gap.
                */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-4 items-stretch">
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

export default ProductList;