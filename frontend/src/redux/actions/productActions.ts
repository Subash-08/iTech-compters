// redux/actions/productActions.ts - UPDATED FOR UNIFIED BACKEND
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { Product, ProductsResponse, ProductFilters, AvailableFilters } from '../types/productTypes';

export const productAPI = {
  getProducts: async (filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      const params: Record<string, any> = {
        page: filters.page || 1,
        limit: filters.limit || 12,
      };

      // Direct mapping
      if (filters.search) params.search = filters.search;
      if (filters.brand) params.brand = filters.brand;
      if (filters.category) params.category = filters.category;
      if (filters.condition) params.condition = filters.condition;
      if (filters.inStock) params.inStock = 'true';

      // 🎯 FIX: Send BOTH minPrice and maxPrice
      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        params['minPrice'] = filters.minPrice; // Send as minPrice
        params['price[gte]'] = filters.minPrice; // Also send as price[gte] for backend
      }
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
        params['maxPrice'] = filters.maxPrice; // Send as maxPrice  
        params['price[lte]'] = filters.maxPrice; // Also send as price[lte] for backend
      }

      if (filters.rating) params['rating[gte]'] = filters.rating;

      const sortMap: Record<string, string> = {
        'featured': 'newest',
        'newest': 'newest',
        'price-low': 'price-low',
        'price-high': 'price-high',
        'rating': 'rating',
        'popular': 'popular'
      };

      params.sort = sortMap[filters.sortBy || 'featured'] || 'newest';
      const response = await api.get<ProductsResponse>('/products', { params });

      return response.data;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch products';
      throw new Error(errorMessage);
    }
  },

  // 🎯 UPDATED: Quick search uses unified endpoint
  searchProducts: async (query: string, limit: number = 5): Promise<Product[]> => {
    try {
      const params = {
        search: query,
        limit: limit,
      };

      const response = await api.get<ProductsResponse>('/products', { params });
      return response.data.data.products; // 🎯 NEW: Access products from data property
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Search failed';
      throw new Error(errorMessage);
    }
  },

  // 🎯 UPDATED: Category products redirect to unified endpoint
  getProductsByCategory: async (categoryName: string, filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      // Just add category to filters and use unified endpoint
      const unifiedFilters = {
        ...filters,
        category: categoryName
      };
      return await productAPI.getProducts(unifiedFilters);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch products for category ${categoryName}`;
      throw new Error(errorMessage);
    }
  },

  // 🎯 UPDATED: Brand products redirect to unified endpoint
  getProductsByBrand: async (brandName: string, filters: ProductFilters): Promise<ProductsResponse> => {
    try {
      // Just add brand to filters and use unified endpoint
      const unifiedFilters = {
        ...filters,
        brand: brandName
      };
      return await productAPI.getProducts(unifiedFilters);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch products for brand ${brandName}`;
      throw new Error(errorMessage);
    }
  },

  // 🎯 KEEP: Price range function (updated internally)
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

      // 🎯 UPDATED: Use effectivePrice instead of basePrice
      if (response.data.products.length > 0) {
        const prices = response.data.products.map(product => product.effectivePrice || product.basePrice);

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

  // 🎯 KEEP: Get max price (updated internally)
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

// 🎯 NEW: Parameter mapper for URL compatibility
const mapToNewResponseFormat = (response: ProductsResponse) => {
  return {
    products: response.data.products,
    totalPages: response.data.pagination.totalPages,
    totalProducts: response.data.pagination.totalProducts,
    currentPage: response.data.pagination.currentPage,
    hasNext: response.data.pagination.hasNextPage,
    hasPrev: response.data.pagination.hasPrevPage
  };
};

// 🎯 UPDATED: Enhanced Action Creators
export const productActions = {
  // 🎯 UPDATED: Main fetch products action
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

      // 🎯 NEW: Extract data from unified response
      const responseData = mapToNewResponseFormat(response);

      dispatch({
        type: 'products/fetchProductsSuccess',
        payload: {
          products: responseData.products,
          totalPages: responseData.totalPages,
          totalProducts: responseData.totalProducts,
          currentPage: responseData.currentPage,
          searchQuery: filters.search || null,
        },
      });

      // 🎯 NEW: Update available filters from backend metadata
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
          minPrice: response.data.filters.minPrice,
          maxPrice: response.data.filters.maxPrice,
          availableBrands: response.data.filters.availableBrands,
          availableCategories: response.data.filters.availableCategories,
          conditions: response.data.filters.conditions,
          ratingOptions: response.data.filters.ratingOptions,
          inStockCount: response.data.filters.inStockCount,
          totalProducts: response.data.filters.totalProducts,
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

  // 🎯 KEEP ALL OTHER ACTIONS (they work with the mapped response)
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

  extractAvailableFilters: (products: Product[], routeParams?: { brandName?: string; categoryName?: string }) => (dispatch: any) => {
    const brands = new Set<string>();
    const categories = new Set<string>();

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

  // 🎯 KEEP ALL THESE ACTIONS - NO CHANGES NEEDED
  updateFilters: (filters: Partial<ProductFilters>) => ({
    type: 'products/updateFilters',
    payload: filters,
  }),

  clearFilters: (routeParams?: { brandName?: string; categoryName?: string }) => ({
    type: 'products/clearFilters',
    payload: routeParams,
  }),

  setCurrentPage: (page: number) => ({
    type: 'products/setCurrentPage',
    payload: page,
  }),

  setSortBy: (sortBy: string) => ({
    type: 'products/setSortBy',
    payload: sortBy,
  }),

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

  clearSearchResults: () => ({
    type: 'products/clearSearchResults',
  }),

  advancedSearch: (query: string, filters: ProductFilters) => async (dispatch: any) => {
    try {
      dispatch({ type: 'products/fetchProductsStart' });

      const response = await productAPI.getProducts({ ...filters, search: query });
      const responseData = mapToNewResponseFormat(response);

      dispatch({
        type: 'products/fetchProductsSuccess',
        payload: {
          products: responseData.products,
          totalPages: responseData.totalPages,
          totalProducts: responseData.totalProducts,
          currentPage: responseData.currentPage,
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

  clearError: () => ({
    type: 'products/clearError',
  }),
  clearProducts: () => ({
    type: 'products/clearProducts',
  }),
};