import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { Product, ProductsResponse, ProductFilters, AvailableFilters } from '../types/productTypes';

// API Calls
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
    } else {
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


  getMaxPrice: async (filters: Partial<ProductFilters>): Promise<number> => {
    try {
      const params: Record<string, any> = {
        limit: 1,
        sort: 'price-desc',
        status: 'Published',
      };

      // Only include category and brand, NOT price filters
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      const response = await api.get<ProductsResponse>('/products', { params });
      
      if (response.data.products.length > 0) {
        const maxProduct = response.data.products[0];
        const maxPrice = maxProduct.offerPrice || maxProduct.basePrice;
        return maxPrice;
      }
      return 5000;
    } catch (error: any) {
      console.error('❌ Error fetching max price:', error.message);
      return 5000;
    }
  },
};

// Action creators
export const productActions = {
  // Fetch products
  fetchProducts: (filters: ProductFilters) => async (dispatch: any) => {
    try {
      dispatch({ type: 'products/fetchProductsStart' });
      const response = await productAPI.getProducts(filters);
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

  // Update filters
  updateFilters: (filters: Partial<ProductFilters>) => ({
    type: 'products/updateFilters',
    payload: filters,
  }),

  // Clear filters
  clearFilters: () => ({
    type: 'products/clearFilters',
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

  // ✅ FIXED: Extract available filters from products WITHOUT maxPrice
  extractAvailableFilters: (products: Product[]) => (dispatch: any) => {
    const brands = new Set<string>();
    const categories = new Set<string>();
    // REMOVED: maxPrice calculation from here

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

    dispatch({
      type: 'products/updateAvailableFilters',
      payload: {
        brands: Array.from(brands).sort(),
        categories: Array.from(categories).sort(),
        // REMOVED: maxPrice from here - it should only come from getMaxPrice
        conditions: ['New', 'Refurbished', 'Used'],
      },
    });
  },

  // ✅ FIXED: Fetch max price - only update maxPrice
  fetchMaxPrice: (filters: Partial<ProductFilters>) => async (dispatch: any) => {
    try {
      const maxPrice = await productAPI.getMaxPrice(filters);
      dispatch({
        type: 'products/updateAvailableFilters',
        payload: {
          maxPrice: Math.ceil(maxPrice / 100) * 100,
        },
      });
    } catch (error) {
      console.error('Error fetching max price:', error);
    }
  },

  // Clear error
  clearError: () => ({
    type: 'products/clearError',
  }),
};