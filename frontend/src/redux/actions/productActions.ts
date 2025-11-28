// redux/actions/productActions.ts - FIXED VERSION
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { Product, ProductsResponse, ProductFilters, AvailableFilters } from '../types/productTypes';

// Enhanced API Service with Proper Parameter Formatting
export const productAPI = {
  getProducts: async (filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      // 🛑 FIX: Use proper parameter names that backend expects
      const params: Record<string, any> = {
        page: filters.page || 1,
        limit: filters.limit || 12,
        status: 'Published',
      };

      // 🛑 CRITICAL FIX: Use array format for brands and categories
      if (filters.brand) params.brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      if (filters.category) params.categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      
      if (filters.condition) params.condition = filters.condition;
      if (filters.inStock) params.inStock = 'true';
      if (filters.minPrice) params.minPrice = filters.minPrice;
      
      // Only send maxPrice if it's greater than 0
      if (filters.maxPrice && filters.maxPrice > 0) {
        params.maxPrice = filters.maxPrice;
      }
      
      if (filters.rating) params.rating = filters.rating;
      if (filters.search) params.search = filters.search;

      // 🛑 FIX: Use 'sort' parameter (not 'sortBy')
      const sortMap: Record<string, string> = {
        'featured': '-createdAt',
        'newest': '-createdAt', 
        'price-low': 'basePrice',
        'price-high': '-basePrice',
        'rating': '-averageRating'
      };
      
      params.sort = sortMap[filters.sortBy || 'featured'] || '-createdAt';

      console.log('🔄 Sending API request with params:', params);

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

  // Advanced search with filters
  advancedSearch: async (query: string, filters: Partial<ProductFilters> = {}): Promise<ProductsResponse> => {
    try {
      const params: Record<string, any> = {
        search: query,
        page: filters.page || 1,
        limit: filters.limit || 12,
        status: 'Published',
      };

      // 🛑 FIX: Use array format
      if (filters.brand) params.brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      if (filters.category) params.categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice && filters.maxPrice > 0) params.maxPrice = filters.maxPrice;
      if (filters.rating) params.rating = filters.rating;
      if (filters.inStock) params.inStock = 'true';
      if (filters.condition) params.condition = filters.condition;

      // 🛑 FIX: Use 'sort' parameter
      const sortMap: Record<string, string> = {
        'featured': '-createdAt',
        'newest': '-createdAt', 
        'price-low': 'basePrice',
        'price-high': '-basePrice',
        'rating': '-averageRating'
      };
      
      if (filters.sortBy) {
        params.sort = sortMap[filters.sortBy] || '-createdAt';
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

      // 🛑 FIX: Use array format for brands
      if (filters.brand) params.brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      
      if (filters.condition) params.condition = filters.condition;
      if (filters.inStock) params.inStock = 'true';
      if (filters.minPrice) params.minPrice = filters.minPrice;
      
      if (filters.maxPrice && filters.maxPrice > 0) {
        params.maxPrice = filters.maxPrice;
      }
      
      if (filters.rating) params.rating = filters.rating;
      if (filters.search) params.search = filters.search;

      // 🛑 FIX: Use 'sort' parameter
      const sortMap: Record<string, string> = {
        'featured': '-createdAt',
        'newest': '-createdAt', 
        'price-low': 'basePrice',
        'price-high': '-basePrice',
        'rating': '-averageRating'
      };
      
      if (filters.sortBy) {
        params.sort = sortMap[filters.sortBy] || '-createdAt';
      } else {
        params.sort = '-createdAt';
      }      
      
      console.log('🔄 Sending category request with params:', params);
      
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

      // 🛑 FIX: Use array format for categories
      if (filters.category) params.categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      
      if (filters.condition) params.condition = filters.condition;
      if (filters.inStock) params.inStock = 'true';
      if (filters.minPrice) params.minPrice = filters.minPrice;
      
      if (filters.maxPrice && filters.maxPrice > 0) {
        params.maxPrice = filters.maxPrice;
      }
      
      if (filters.rating) params.rating = filters.rating;
      if (filters.search) params.search = filters.search;

      // 🛑 FIX: Use 'sort' parameter
      const sortMap: Record<string, string> = {
        'featured': '-createdAt',
        'newest': '-createdAt', 
        'price-low': 'basePrice',
        'price-high': '-basePrice',
        'rating': '-averageRating'
      };
      
      if (filters.sortBy) {
        params.sort = sortMap[filters.sortBy] || '-createdAt';
      } else {
        params.sort = '-createdAt';
      }      
      
      console.log('🔄 Sending brand request with params:', params);
      
      const response = await api.get<ProductsResponse>(`/products/brand/${brandName}`, { params });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch products for brand ${brandName}`;
      throw new Error(errorMessage);
    }
  },

  // Get accurate price range for current filters
  getPriceRange: async (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }): Promise<{ minPrice: number; maxPrice: number }> => {
    try {
      const rangeFilters = { ...filters };
      delete rangeFilters.minPrice;
      delete rangeFilters.maxPrice;
      
      const priceRangeParams = {
        ...rangeFilters,
        limit: 1000,
        page: 1,
        sortBy: 'price-low'
      };

      let response: ProductsResponse;

      if (routeParams?.categoryName) {
        response = await productAPI.getProductsByCategory(routeParams.categoryName, priceRangeParams);
      } else if (routeParams?.brandName) {
        response = await productAPI.getProductsByBrand(routeParams.brandName, priceRangeParams);
      } else {
        response = await productAPI.getProducts(priceRangeParams);
      }
      
      if (response.products.length > 0) {
        const prices = response.products.map(product => product.basePrice);
        
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));        
        return {
          minPrice: Math.max(0, minPrice),
          maxPrice: Math.max(minPrice + 100, maxPrice)
        };
      }
      return { minPrice: 0, maxPrice: 5000 };
    } catch (error: any) {
      console.error('❌ Error fetching price range:', error.message);
      return { minPrice: 0, maxPrice: 5000 };
    }
  },

  // Get max price only (for backward compatibility)
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

// Enhanced Action Creators with Proper Parameter Handling
export const productActions = {
  // 🛑 FIXED: Fetch products with proper parameter formatting
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
          // 🛑 FIX: Include search query in response
          searchQuery: filters.search || null,
        },
      });

      // Extract available filters from products
      dispatch(productActions.extractAvailableFilters(response.products, routeParams));
      
      // Fetch base price range WITHOUT current price filters
      const baseFilters = { 
        ...filters,
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

  // Fetch base price range with explicit filters
  fetchBasePriceRange: (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }) => async (dispatch: any) => {
    try {
      const baseRangeFilters = {
        limit: 1000,
        page: 1,
        sortBy: 'price-low'
      };
      
      const priceRange = await productAPI.getPriceRange(baseRangeFilters, routeParams);    
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

  // Extract available filters with ALL options for current route
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

  // Fetch price range - both min and max
  fetchPriceRange: (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }) => async (dispatch: any) => {
    try {
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

  // Clear search results
  clearSearchResults: () => ({
    type: 'products/clearSearchResults',
  }),

  // Advanced search with filters
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
          searchQuery: query,
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