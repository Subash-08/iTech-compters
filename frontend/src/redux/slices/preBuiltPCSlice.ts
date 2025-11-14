// redux/slices/preBuiltPCSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PreBuiltPCState, PreBuiltPC, PreBuiltPCFilters, AvailablePreBuiltPCFilters } from '../types/preBuiltPCTypes';

const initialState: PreBuiltPCState = {
  preBuiltPCs: [],
  featuredPCs: [],
  currentPC: null,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 12,
    sortBy: 'featured'
  },
  availableFilters: {
    categories: [],
    priceRange: { min: 0, max: 5000 },
    baseMinPrice: 0,
    baseMaxPrice: 5000
  },
  totalPages: 0,
  totalProducts: 0,
  currentPage: 1,
  searchResults: [],
  searchLoading: false
};

const preBuiltPCSlice = createSlice({
  name: 'preBuiltPCs',
  initialState,
  reducers: {
    // Fetch operations
    fetchPreBuiltPCsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPreBuiltPCsSuccess: (state, action: PayloadAction<{
      preBuiltPCs: PreBuiltPC[];
      totalPages: number;
      totalProducts: number;
      currentPage: number;
    }>) => {
      state.loading = false;
      state.preBuiltPCs = action.payload.preBuiltPCs;
      state.totalPages = action.payload.totalPages;
      state.totalProducts = action.payload.totalProducts;
      state.currentPage = action.payload.currentPage;
    },
    fetchPreBuiltPCsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Featured PCs
    fetchFeaturedPCsStart: (state) => {
      state.loading = true;
    },
    fetchFeaturedPCsSuccess: (state, action: PayloadAction<PreBuiltPC[]>) => {
      state.loading = false;
      state.featuredPCs = action.payload;
    },
    fetchFeaturedPCsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Single PC operations
    fetchPreBuiltPCStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPreBuiltPCSuccess: (state, action: PayloadAction<PreBuiltPC>) => {
      state.loading = false;
      state.currentPC = action.payload;
    },
    fetchPreBuiltPCFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearCurrentPC: (state) => {
      state.currentPC = null;
    },

    // Filter operations
    updateFilters: (state, action: PayloadAction<Partial<PreBuiltPCFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 12,
        sortBy: 'featured'
      };
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
      state.currentPage = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.filters.sortBy = action.payload;
    },

    // Available filters
    updateAvailableFilters: (state, action: PayloadAction<Partial<AvailablePreBuiltPCFilters>>) => {
      state.availableFilters = { ...state.availableFilters, ...action.payload };
    },

    // Search operations
    searchPreBuiltPCsStart: (state) => {
      state.searchLoading = true;
    },
    searchPreBuiltPCsSuccess: (state, action: PayloadAction<PreBuiltPC[]>) => {
      state.searchLoading = false;
      state.searchResults = action.payload;
    },
    searchPreBuiltPCsFailure: (state, action: PayloadAction<string>) => {
      state.searchLoading = false;
      state.error = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },

    // Performance-based operations
    fetchPCsByPerformanceStart: (state) => {
      state.loading = true;
    },
    fetchPCsByPerformanceSuccess: (state, action: PayloadAction<PreBuiltPC[]>) => {
      state.loading = false;
      state.preBuiltPCs = action.payload;
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  fetchPreBuiltPCsStart,
  fetchPreBuiltPCsSuccess,
  fetchPreBuiltPCsFailure,
  fetchFeaturedPCsStart,
  fetchFeaturedPCsSuccess,
  fetchFeaturedPCsFailure,
  fetchPreBuiltPCStart,
  fetchPreBuiltPCSuccess,
  fetchPreBuiltPCFailure,
  clearCurrentPC,
  updateFilters,
  clearFilters,
  setCurrentPage,
  setSortBy,
  updateAvailableFilters,
  searchPreBuiltPCsStart,
  searchPreBuiltPCsSuccess,
  searchPreBuiltPCsFailure,
  clearSearchResults,
  fetchPCsByPerformanceStart,
  fetchPCsByPerformanceSuccess,
  clearError
} = preBuiltPCSlice.actions;

export default preBuiltPCSlice.reducer;