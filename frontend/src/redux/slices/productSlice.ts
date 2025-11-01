import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductState, Product, ProductFilters, AvailableFilters } from '../types/productTypes';

// In your productSlice.ts
// redux/slices/productSlice.ts - Add base price fields
const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    brand: '',
    condition: '',
    inStock: false,
    minPrice: 0,
    maxPrice: 0,
    rating: 0,
    sortBy: 'featured',
    page: 1,
    limit: 12,
  },
  availableFilters: {
    brands: [],
    categories: [],
    conditions: ['New', 'Refurbished', 'Used'],
    minPrice: 0,
    maxPrice: 5000,
    baseMinPrice: 0, // ✅ NEW
    baseMaxPrice: 5000, // ✅ NEW
  },
  totalPages: 1,
  totalProducts: 0,
  currentPage: 1,
};
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Fetch products actions
    fetchProductsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
      // In your productSlice, update the success case:
      fetchProductsSuccess: (state, action: PayloadAction<{
        products: Product[];
        totalPages: number;
        totalProducts: number;
        currentPage: number;
      }>) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPages = action.payload.totalPages;
        state.totalProducts = action.payload.totalProducts;
        state.currentPage = action.payload.currentPage;
        
        // Update page in filters too
        state.filters.page = action.payload.currentPage;
      },
    fetchProductsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

   updateFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      console.log('🔄 Redux - Updating filters with:', action.payload);
      
      // Only update the filters that are provided in the payload
      // This prevents keeping old filter values when URL changes
      Object.keys(action.payload).forEach(key => {
        if (key in state.filters) {
          (state.filters as any)[key] = (action.payload as any)[key];
        }
      });
      
      // Reset page to 1 when filters change (except page changes)
      if (action.payload.page === undefined) {
        state.filters.page = 1;
        state.currentPage = 1;
      }
      
      console.log('✅ Redux - Updated filters:', state.filters);
    },

    // ✅ FIXED: Clear filters properly
    clearFilters: (state, action: PayloadAction<{ brandName?: string; categoryName?: string } | undefined>) => {
      const routeParams = action.payload;
      
      console.log('🧹 Redux - Clearing filters, route params:', routeParams);
      
      // Reset all filters except route-based ones
      state.filters = {
        category: routeParams?.categoryName ? routeParams.categoryName.replace(/-/g, ' ') : '',
        brand: routeParams?.brandName ? routeParams.brandName.replace(/-/g, ' ') : '',
        condition: '',
        inStock: false,
        minPrice: state.availableFilters.baseMinPrice || 0,
        maxPrice: state.availableFilters.baseMaxPrice || 5000,
        rating: 0,
        sortBy: 'featured',
        page: 1,
        limit: 12,
      };
      state.currentPage = 1;
      
      console.log('✅ Redux - Cleared filters:', state.filters);
    },

    // Pagination actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
      state.filters.page = action.payload;
    },

    // Sort actions
    setSortBy: (state, action: PayloadAction<string>) => {
      state.filters.sortBy = action.payload;
      state.currentPage = 1;
    },

    // Available filters actions
    updateAvailableFilters: (state, action: PayloadAction<Partial<AvailableFilters>>) => {
      state.availableFilters = { ...state.availableFilters, ...action.payload };
      
      // Adjust max price filter if needed
      if (action.payload.maxPrice && state.filters.maxPrice > action.payload.maxPrice) {
        state.filters.maxPrice = action.payload.maxPrice;
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  updateFilters,
  clearFilters,
  setCurrentPage,
  setSortBy,
  updateAvailableFilters,
  clearError,
} = productSlice.actions;

export default productSlice.reducer;