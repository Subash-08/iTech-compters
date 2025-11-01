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
      if (filters.maxPrice && filters.maxPrice > 0) params.maxPrice = filters.maxPrice;
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

  // Do the same for getProductsByBrand
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
      if (filters.maxPrice && filters.maxPrice > 0) params.maxPrice = filters.maxPrice;
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

  // ✅ NEW: Get accurate price range for current filters (min and max)
 getPriceRange: async (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }): Promise<{ minPrice: number; maxPrice: number }> => {
    try {
      console.log('💰 Calculating price range with filters:', filters);
      
      let response: ProductsResponse;

      // Use the same endpoint as products for accurate range
      if (routeParams?.categoryName) {
        response = await productAPI.getProductsByCategory(routeParams.categoryName, { ...filters, limit: 1000, page: 1 });
      } else if (routeParams?.brandName) {
        response = await productAPI.getProductsByBrand(routeParams.brandName, { ...filters, limit: 1000, page: 1 });
      } else {
        response = await productAPI.getProducts({ ...filters, limit: 1000, page: 1 });
      }

      console.log('📊 Price range calculation found', response.products.length, 'products');

      if (response.products.length > 0) {
        const prices = response.products.map(product => 
          product.offerPrice || product.basePrice
        );
        
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
  // ✅ ENHANCED: Fetch products with price range and dynamic filters
  getBasePriceRange: async (routeParams?: { brandName?: string; categoryName?: string }): Promise<{ minPrice: number; maxPrice: number }> => {
    try {
      // Use empty filters to get the base price range for the current route
      const baseFilters = { limit: 1000, page: 1, sortBy: 'price-low' };

      let response: ProductsResponse;

      if (routeParams?.categoryName) {
        response = await productAPI.getProductsByCategory(routeParams.categoryName, baseFilters);
      } else if (routeParams?.brandName) {
        response = await productAPI.getProductsByBrand(routeParams.brandName, baseFilters);
      } else {
        response = await productAPI.getProducts(baseFilters);
      }

      if (response.products.length > 0) {
        const prices = response.products.map(product => 
          product.offerPrice || product.basePrice
        );
        
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        
        return {
          minPrice: Math.max(0, minPrice),
          maxPrice: Math.max(minPrice + 100, maxPrice)
        };
      }

      return { minPrice: 0, maxPrice: 5000 };
    } catch (error: any) {
      console.error('❌ Error fetching base price range:', error.message);
      return { minPrice: 0, maxPrice: 5000 };
    }
  },



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
      
      // ✅ FIXED: Fetch base price range WITHOUT current filters
      // Use empty filters for base price range calculation
      const baseFilters = { 
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
      const priceRange = await productAPI.getPriceRange(filters, routeParams);
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
          baseMinPrice: priceRange.minPrice,
          baseMaxPrice: priceRange.maxPrice,
        },
      });
    } catch (error) {
      console.error('Error fetching base price range:', error);
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
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


  // ✅ NEW: Fetch price range - both min and max
  fetchPriceRange: (filters: Partial<ProductFilters>, routeParams?: { brandName?: string; categoryName?: string }) => async (dispatch: any) => {
    try {
      const priceRange = await productAPI.getPriceRange(filters, routeParams);
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
          minPrice: priceRange.minPrice,
          maxPrice: priceRange.maxPrice,
        },
      });
    } catch (error) {
      console.error('Error fetching price range:', error);
      // Set default price range on error
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
          minPrice: 0,
          maxPrice: 5000,
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

  // Clear error
  clearError: () => ({
    type: 'products/clearError',
  }),
};