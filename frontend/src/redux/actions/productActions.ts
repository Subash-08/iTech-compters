// redux/actions/productActions.ts
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { Product, ProductsResponse, ProductFilters, AvailableFilters } from '../types/productTypes';

// Enhanced API Service with Price Range Support
export const productAPI = {
  getProducts: async (filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      const params: Record<string, any> = {
        page: filters.page || 1,
        limit: filters.limit || 12,
        status: 'Published',
      };

      // ✅ Use the correct parameter names
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.condition) params.condition = filters.condition;
      if (filters.inStock) params.inStock = 'true';
      if (filters.minPrice) params.minPrice = filters.minPrice;
      
      // ✅ CRITICAL FIX: Only send maxPrice if it's greater than 0
      if (filters.maxPrice && filters.maxPrice > 0) {
        params.maxPrice = filters.maxPrice;
      }
      
      if (filters.rating) params.rating = filters.rating;
      if (filters.search) params.search = filters.search;

      // Sort mapping
      const sortMap: Record<string, string> = {
        'featured': 'newest',
        'newest': 'newest', 
        'price-low': 'price-asc',
        'price-high': 'price-desc',
        'rating': 'popular'
      };
      params.sort = sortMap[filters.sortBy || 'featured'] || 'newest';

      const response = await api.get<ProductsResponse>('/products', { params });
      
      return {
        ...response.data,
        hasNext: response.data.currentPage < response.data.totalPages,
        hasPrev: response.data.currentPage > 1
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch products';
      throw new Error(errorMessage);
    }
  },

    searchProducts: async (query: string, limit: number = 5): Promise<Product[]> => {
    try {
      const params: Record<string, any> = {
        search: query,
        limit: limit,
        status: 'Published',
      };

      const response = await api.get<ProductsResponse>('/products', { params });
      return response.data.products;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Search failed';
      throw new Error(errorMessage);
    }
  },

  // ✅ ADD: Advanced search with filters
  advancedSearch: async (query: string, filters: Partial<ProductFilters> = {}): Promise<ProductsResponse> => {
    try {
      const params: Record<string, any> = {
        search: query,
        page: filters.page || 1,
        limit: filters.limit || 12,
        status: 'Published',
      };

      // Add optional filters
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice && filters.maxPrice > 0) params.maxPrice = filters.maxPrice;
      if (filters.rating) params.rating = filters.rating;
      if (filters.inStock) params.inStock = 'true';
      if (filters.condition) params.condition = filters.condition;

      // Sort mapping
      const sortMap: Record<string, string> = {
        'featured': 'createdAt',
        'newest': 'createdAt', 
        'price-low': 'basePrice',
        'price-high': '-basePrice',
        'rating': '-averageRating'
      };
      
      if (filters.sortBy) {
        params.sort = sortMap[filters.sortBy] || 'createdAt';
      }

      const response = await api.get<ProductsResponse>('/products', { params });
      
      return {
        ...response.data,
        hasNext: response.data.currentPage < response.data.totalPages,
        hasPrev: response.data.currentPage > 1
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Advanced search failed';
      throw new Error(errorMessage);
    }
  },

  getProductsByCategory: async (categoryName: string, filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      const params: Record<string, any> = {
        page: filters.page || 1,
        limit: filters.limit || 12,
      };

      // ✅ FIX: Use correct parameter names
      if (filters.brand) params.brand = filters.brand;
      if (filters.condition) params.condition = filters.condition;
      if (filters.inStock) params.inStock = 'true';
      if (filters.minPrice) params.minPrice = filters.minPrice;
      
      // ✅ CRITICAL FIX: Only send maxPrice if it's greater than 0
      if (filters.maxPrice && filters.maxPrice > 0) {
        params.maxPrice = filters.maxPrice;
      }
      
      if (filters.rating) params.rating = filters.rating;
      if (filters.search) params.search = filters.search;

      // ✅ FIXED: Sort parameter - backend expects 'sort' not 'sortBy'
      const sortMap: Record<string, string> = {
        'featured': 'createdAt',
        'newest': 'createdAt', 
        'price-low': 'basePrice',
        'price-high': '-basePrice',
        'rating': '-averageRating'
      };
      
      // Map frontend sortBy to backend sort parameter
      if (filters.sortBy) {
        params.sort = sortMap[filters.sortBy] || 'createdAt';
        console.log('🔀 Frontend sortBy:', filters.sortBy, '-> Backend sort:', params.sort);
      } else {
        // Default sort if not provided
        params.sort = 'createdAt';
      }

      console.log('🚀 API Call - Category:', categoryName, 'Params:', params);
      
      const response = await api.get<ProductsResponse>(`/products/category/${categoryName}`, { params });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch products for category ${categoryName}`;
      throw new Error(errorMessage);
    }
  },

  getProductsByBrand: async (brandName: string, filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      const params: Record<string, any> = {
        page: filters.page || 1,
        limit: filters.limit || 12,
      };

      // ✅ FIX: Use correct parameter names
      if (filters.category) params.category = filters.category;
      if (filters.condition) params.condition = filters.condition;
      if (filters.inStock) params.inStock = 'true';
      if (filters.minPrice) params.minPrice = filters.minPrice;
      
      // ✅ CRITICAL FIX: Only send maxPrice if it's greater than 0
      if (filters.maxPrice && filters.maxPrice > 0) {
        params.maxPrice = filters.maxPrice;
      }
      
      if (filters.rating) params.rating = filters.rating;
      if (filters.search) params.search = filters.search;

      // ✅ FIXED: Sort parameter
      const sortMap: Record<string, string> = {
        'featured': 'createdAt',
        'newest': 'createdAt', 
        'price-low': 'basePrice',
        'price-high': '-basePrice',
        'rating': '-averageRating'
      };
      
      if (filters.sortBy) {
        params.sort = sortMap[filters.sortBy] || 'createdAt';
        console.log('🔀 Frontend sortBy:', filters.sortBy, '-> Backend sort:', params.sort);
      } else {
        params.sort = 'createdAt';
      }

      console.log('🚀 API Call - Brand:', brandName, 'Params:', params);
      
      const response = await api.get<ProductsResponse>(`/products/brand/${brandName}`, { params });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch products for brand ${brandName}`;
      throw new Error(errorMessage);
    }
  },

  // ✅ FIXED: Get accurate price range for current filters
  getPriceRange: async (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }): Promise<{ minPrice: number; maxPrice: number }> => {
    try {
      console.log('💰 Calculating price range with filters:', filters);
      
      // ✅ CRITICAL FIX: Remove price filters for base range calculation
      const rangeFilters = { ...filters };
      delete rangeFilters.minPrice;
      delete rangeFilters.maxPrice;
      
      // ✅ FIX: Use proper parameters for price range calculation
      const priceRangeParams = {
        ...rangeFilters,
        limit: 1000,
        page: 1,
        sortBy: 'price-low' // Get cheapest first for accurate min price
      };

      let response: ProductsResponse;

      // Use the same endpoint as products for accurate range
      if (routeParams?.categoryName) {
        response = await productAPI.getProductsByCategory(routeParams.categoryName, priceRangeParams);
      } else if (routeParams?.brandName) {
        response = await productAPI.getProductsByBrand(routeParams.brandName, priceRangeParams);
      } else {
        response = await productAPI.getProducts(priceRangeParams);
      }

      console.log('📊 Price range calculation found', response.products.length, 'products');

      if (response.products.length > 0) {
        // ✅ FIX: Use basePrice for range calculation, not offerPrice
        const prices = response.products.map(product => product.basePrice);
        
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        
        console.log('💵 Calculated price range:', { minPrice, maxPrice });
        
        return {
          minPrice: Math.max(0, minPrice),
          maxPrice: Math.max(minPrice + 100, maxPrice)
        };
      }

      console.log('⚠️ No products found for price range, using defaults');
      return { minPrice: 0, maxPrice: 5000 };
    } catch (error: any) {
      console.error('❌ Error fetching price range:', error.message);
      return { minPrice: 0, maxPrice: 5000 };
    }
  },

  // ✅ UPDATED: Get max price only (for backward compatibility)
  getMaxPrice: async (filters: Partial<ProductFilters>): Promise<number> => {
    try {
      const priceRange = await productAPI.getPriceRange(filters);
      return priceRange.maxPrice;
    } catch (error: any) {
      console.error('❌ Error fetching max price:', error.message);
      return 5000;
    }
  },
};

// Enhanced Action Creators with Price Range Support
export const productActions = {
  // ✅ FIXED: Fetch products with proper price range handling
  fetchProducts: (filters: ProductFilters, routeParams?: { brandName?: string; categoryName?: string }) => async (dispatch: any) => {
    try {
      dispatch({ type: 'products/fetchProductsStart' });
      
      let response: ProductsResponse;
      
      // Choose the right API call based on route
      if (routeParams?.categoryName) {
        response = await productAPI.getProductsByCategory(routeParams.categoryName, filters);
      } else if (routeParams?.brandName) {
        response = await productAPI.getProductsByBrand(routeParams.brandName, filters);
      } else {
        response = await productAPI.getProducts(filters);
      }
      
      dispatch({
        type: 'products/fetchProductsSuccess',
        payload: {
          products: response.products,
          totalPages: response.totalPages,
          totalProducts: response.totalProducts,
          currentPage: response.currentPage,
        },
      });

      // Extract available filters from products
      dispatch(productActions.extractAvailableFilters(response.products, routeParams));
      
      // ✅ FIXED: Fetch base price range WITHOUT current price filters
      const baseFilters = { 
        ...filters,
        // Remove price filters for base range calculation
        minPrice: undefined,
        maxPrice: undefined,
        limit: 1000, 
        page: 1, 
        sortBy: 'price-low' 
      };
      
      dispatch(productActions.fetchBasePriceRange(baseFilters, routeParams));
      
    } catch (error: any) {
      dispatch({
        type: 'products/fetchProductsFailure',
        payload: error.message,
      });
      toast.error(error.message);
    }
  },

  // ✅ FIXED: Fetch base price range with explicit filters
fetchBasePriceRange: (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }) => async (dispatch: any) => {
  try {
    console.log('🔄 Fetching base price range with filters:', filters);
    
    // ✅ FIXED: Remove ALL filters for base range calculation
    const baseRangeFilters = {
      limit: 1000,
      page: 1,
      sortBy: 'price-low'
    };
    
    const priceRange = await productAPI.getPriceRange(baseRangeFilters, routeParams);
    
    console.log('🎯 Base price range calculated:', priceRange);
    
    dispatch({
      type: 'products/updateAvailableFilters',
      payload: {
        priceRange: {
          min: priceRange.minPrice,
          max: priceRange.maxPrice,
        },
        baseMinPrice: priceRange.minPrice,
        baseMaxPrice: priceRange.maxPrice,
      },
    });
  } catch (error) {
    console.error('Error fetching base price range:', error);
    dispatch({
      type: 'products/updateAvailableFilters',
      payload: {
        priceRange: {
          min: 0,
          max: 5000,
        },
        baseMinPrice: 0,
        baseMaxPrice: 5000,
      },
    });
  }
},

  // ✅ ENHANCED: Extract available filters with ALL options for current route
  extractAvailableFilters: (products: Product[], routeParams?: { brandName?: string; categoryName?: string }) => (dispatch: any) => {
    const brands = new Set<string>();
    const categories = new Set<string>();

    // Collect ALL brands and categories from the current route's products
    products.forEach(product => {
      if (product.brand?.name) {
        brands.add(product.brand.name);
      }

      product.categories?.forEach(cat => {
        if (cat.name) {
          categories.add(cat.name);
        }
      });
    });

    const availableFilters: Partial<AvailableFilters> = {
      brands: Array.from(brands).sort(),
      categories: Array.from(categories).sort(),
      conditions: ['New', 'Refurbished', 'Used'],
    };

    dispatch({
      type: 'products/updateAvailableFilters',
      payload: availableFilters,
    });
  },

  // ✅ FIXED: Fetch price range - both min and max
  fetchPriceRange: (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }) => async (dispatch: any) => {
    try {
      console.log('💰 Fetching price range with filters:', filters);
      const priceRange = await productAPI.getPriceRange(filters, routeParams);
      
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
          priceRange: {
            min: priceRange.minPrice,
            max: priceRange.maxPrice,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching price range:', error);
      // Set default price range on error
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
          priceRange: {
            min: 0,
            max: 5000,
          },
        },
      });
    }
  },

  // Update filters
  updateFilters: (filters: Partial<ProductFilters>) => ({
    type: 'products/updateFilters',
    payload: filters,
  }),

  // Clear filters (preserve route-based filters)
  clearFilters: (routeParams?: { brandName?: string; categoryName?: string }) => ({
    type: 'products/clearFilters',
    payload: routeParams,
  }),

  // Set current page
  setCurrentPage: (page: number) => ({
    type: 'products/setCurrentPage',
    payload: page,
  }),

  // Set sort by
  setSortBy: (sortBy: string) => ({
    type: 'products/setSortBy',
    payload: sortBy,
  }),

  // Update available filters
  updateAvailableFilters: (filters: Partial<AvailableFilters>) => ({
    type: 'products/updateAvailableFilters',
    payload: filters,
  }),

    quickSearch: (query: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'products/quickSearchStart' });
      
      const results = await productAPI.searchProducts(query, 5);
      
      dispatch({
        type: 'products/quickSearchSuccess',
        payload: results,
      });
    } catch (error: any) {
      dispatch({
        type: 'products/quickSearchFailure',
        payload: error.message,
      });
    }
  },

  // ✅ ADD: Clear search results
  clearSearchResults: () => ({
    type: 'products/clearSearchResults',
  }),

  // ✅ ADD: Advanced search with filters
  advancedSearch: (query: string, filters: ProductFilters) => async (dispatch: any) => {
    try {
      dispatch({ type: 'products/fetchProductsStart' });
      
      const response = await productAPI.advancedSearch(query, filters);
      
      dispatch({
        type: 'products/fetchProductsSuccess',
        payload: {
          products: response.products,
          totalPages: response.totalPages,
          totalProducts: response.totalProducts,
          currentPage: response.currentPage,
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'products/fetchProductsFailure',
        payload: error.message,
      });
      toast.error(error.message);
    }
  },

  // Clear error
  clearError: () => ({
    type: 'products/clearError',
  }),
};
