import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductState, Product, ProductFilters, AvailableFilters } from '../types/productTypes';

// In your productSlice.ts
// redux/slices/productSlice.ts - Add base price fields
// Update your productSlice.ts initialState
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
    search: '', // ✅ ADD: Search query
  },
  availableFilters: {
    brands: [],
    categories: [],
    conditions: ['New', 'Refurbished', 'Used'],
    minPrice: 0,
    maxPrice: 5000,
    baseMinPrice: 0,
    baseMaxPrice: 5000,
  },
  totalPages: 1,
  totalProducts: 0,
  currentPage: 1,
  // ✅ ADD: Search-specific state
  searchResults: [],
  searchLoading: false,
  searchError: null,
  lastSearchQuery: '',
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

 quickSearchStart: (state) => {
      state.searchLoading = true;
      state.searchError = null;
    },
    quickSearchSuccess: (state, action: PayloadAction<Product[]>) => {
      state.searchLoading = false;
      state.searchResults = action.payload;
      state.searchError = null;
    },
    quickSearchFailure: (state, action: PayloadAction<string>) => {
      state.searchLoading = false;
      state.searchError = action.payload;
      state.searchResults = [];
    },
    
    // ✅ ADD: Clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchLoading = false;
      state.searchError = null;
      state.lastSearchQuery = '';
      state.filters.search = '';
    },

    // ✅ ADD: Update search query in filters
    updateSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.lastSearchQuery = action.payload;
    },
clearProducts: (state) => {
      state.products = [];        // Clear the array
      state.loading = true;       // Set loading true so Shimmer appears
      state.error = null;         // Clear any previous errors
    },
    clearFilters: (state, action) => {
      
      const routeParams = action.payload;
      
      state.filters = {
        ...initialState.filters,
        // Preserve route-based filters if provided
        ...(routeParams?.categoryName && { category: routeParams.categoryName.replace(/-/g, ' ') }),
        ...(routeParams?.brandName && { brand: routeParams.brandName.replace(/-/g, ' ') }),
      };
    },
    
    // ✅ FIXED: Update filters with proper merging
    updateFilters: (state, action) => {
      
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
      
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
  clearProducts,
  updateFilters,
  clearFilters,
  setCurrentPage,
  setSortBy,
  updateAvailableFilters,
  clearError,
    quickSearchStart,
  quickSearchSuccess,
  quickSearchFailure,
  clearSearchResults,
  updateSearchQuery,
} = productSlice.actions;

export default productSlice.reducer;