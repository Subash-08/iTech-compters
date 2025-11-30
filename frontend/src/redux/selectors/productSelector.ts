// redux/selectors/productSelectors.ts - MINIMAL UPDATES
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectProductState = (state: RootState) => state.productState;

// 🎯 KEEP ALL BASE SELECTORS - NO CHANGES NEEDED
export const selectProducts = createSelector(
  [selectProductState],
  (productState) => productState.products
);

export const selectProductsLoading = createSelector(
  [selectProductState],
  (productState) => productState.loading
);

export const selectProductsError = createSelector(
  [selectProductState],
  (productState) => productState.error
);

export const selectProductFilters = createSelector(
  [selectProductState],
  (productState) => productState.filters
);

export const selectAvailableFilters = createSelector(
  [selectProductState],
  (productState) => productState.availableFilters
);

export const selectTotalPages = createSelector(
  [selectProductState],
  (productState) => productState.totalPages
);

export const selectTotalProducts = createSelector(
  [selectProductState],
  (productState) => productState.totalProducts
);

export const selectCurrentPage = createSelector(
  [selectProductState],
  (productState) => productState.currentPage
);

export const selectSearchResults = createSelector(
  [selectProductState],
  (productState) => productState.searchResults
);

export const selectSearchLoading = createSelector(
  [selectProductState],
  (productState) => productState.searchLoading
);

export const selectSearchError = createSelector(
  [selectProductState],
  (productState) => productState.searchError
);

export const selectLastSearchQuery = createSelector(
  [selectProductState],
  (productState) => productState.lastSearchQuery
);

export const selectSearchQuery = createSelector(
  [selectProductFilters],
  (filters) => filters.search || ''
);

// 🎯 UPDATED: Active filters selector to handle new price parameters
export const selectActiveFilters = createSelector(
  [selectProductFilters],
  (filters) => {
    const active: { key: string; value: any; label: string }[] = [];
    
    if (filters.category) {
      active.push({ key: 'category', value: filters.category, label: `Category: ${filters.category}` });
    }
    if (filters.brand) {
      active.push({ key: 'brand', value: filters.brand, label: `Brand: ${filters.brand}` });
    }
    if (filters.condition) {
      active.push({ key: 'condition', value: filters.condition, label: `Condition: ${filters.condition}` });
    }
    if (filters.inStock) {
      active.push({ key: 'inStock', value: filters.inStock, label: 'In Stock Only' });
    }
    if (filters.rating > 0) {
      active.push({ key: 'rating', value: filters.rating, label: `${filters.rating}+ Stars` });
    }
    // 🎯 UPDATED: Handle both legacy and new price parameters
    const minPrice = filters.minPrice || 0;
    const maxPrice = filters.maxPrice || 5000;
    
    if (minPrice > 0) {
      active.push({ key: 'minPrice', value: minPrice, label: `Min: ₹${minPrice}` });
    }
    if (maxPrice < 5000) {
      active.push({ key: 'maxPrice', value: maxPrice, label: `Max: ₹${maxPrice}` });
    }

    return active;
  }
);

// 🎯 KEEP: Has active filters selector
export const selectHasActiveFilters = createSelector(
  [selectProductFilters],
  (filters) => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'page' || key === 'limit' || key === 'sortBy') return false;
      if (key === 'minPrice' && value === 0) return false;
      if (key === 'maxPrice' && value === 5000) return false;
      return !!value;
    });
  }
);