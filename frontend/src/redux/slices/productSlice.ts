import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductState, Product, ProductFilters, AvailableFilters } from '../types/productTypes';

// In your productSlice.ts
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
    maxPrice: 0, // Set to 0 initially, not 5000
    rating: 0,
    sortBy: 'featured',
    page: 1,
    limit: 12,
  },
  availableFilters: {
    brands: [],
    categories: [],
    conditions: ['New', 'Refurbished', 'Used'],
    maxPrice: 5000, // This is just informational
    minPrice: 0,
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

    // Filter actions
    updateFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset to first page when filters change
    },
    
    clearFilters: (state) => {
      state.filters = {
        category: '',
        brand: '',
        condition: '',
        inStock: false,
        minPrice: 0,
        maxPrice: state.availableFilters.maxPrice,
        rating: 0,
        sortBy: 'featured',
        page: 1,
        limit: 12,
      };
      state.currentPage = 1;
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