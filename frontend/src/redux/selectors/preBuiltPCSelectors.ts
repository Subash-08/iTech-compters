// redux/selectors/preBuiltPCSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Basic selectors
export const selectPreBuiltPCs = (state: RootState) => state.preBuiltPCs.preBuiltPCs;
export const selectFeaturedPCs = (state: RootState) => state.preBuiltPCs.featuredPCs;
export const selectCurrentPC = (state: RootState) => state.preBuiltPCs.currentPC;
export const selectLoading = (state: RootState) => state.preBuiltPCs.loading;
export const selectError = (state: RootState) => state.preBuiltPCs.error;
export const selectFilters = (state: RootState) => state.preBuiltPCs.filters;
export const selectAvailableFilters = (state: RootState) => state.preBuiltPCs.availableFilters;
export const selectTotalPages = (state: RootState) => state.preBuiltPCs.totalPages;
export const selectTotalProducts = (state: RootState) => state.preBuiltPCs.totalProducts;
export const selectCurrentPage = (state: RootState) => state.preBuiltPCs.currentPage;
export const selectSearchResults = (state: RootState) => state.preBuiltPCs.searchResults;
export const selectSearchLoading = (state: RootState) => state.preBuiltPCs.searchLoading;

// Memoized selectors
export const selectFilteredPreBuiltPCs = createSelector(
  [selectPreBuiltPCs, selectFilters],
  (preBuiltPCs, filters) => {
    let filtered = [...preBuiltPCs];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(pc => 
        pc.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    // Apply price filter
    if (filters.minPrice || filters.maxPrice) {
      const minPrice = filters.minPrice || 0;
      const maxPrice = filters.maxPrice || Number.MAX_SAFE_INTEGER;
      
      filtered = filtered.filter(pc => {
        const price = pc.discountPrice || pc.totalPrice;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Apply rating filter
    if (filters.minRating) {
      filtered = filtered.filter(pc => pc.performanceRating >= filters.minRating!);
    }

    // Apply in-stock filter
    if (filters.inStock) {
      filtered = filtered.filter(pc => pc.stockQuantity > 0);
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(pc =>
        pc.name.toLowerCase().includes(searchTerm) ||
        pc.description.toLowerCase().includes(searchTerm) ||
        (pc.tags && pc.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (pc.components && pc.components.some(component => 
          component.name.toLowerCase().includes(searchTerm) ||
          component.brand.toLowerCase().includes(searchTerm)
        ))
      );
    }

    return filtered;
  }
);

export const selectGamingPCs = createSelector(
  [selectPreBuiltPCs],
  (preBuiltPCs) => preBuiltPCs.filter(pc => pc.category === 'Gaming')
);

export const selectBudgetPCs = createSelector(
  [selectPreBuiltPCs],
  (preBuiltPCs) => preBuiltPCs.filter(pc => pc.category === 'Budget')
);

export const selectFeaturedGamingPCs = createSelector(
  [selectFeaturedPCs],
  (featuredPCs) => featuredPCs.filter(pc => pc.category === 'Gaming')
);

export const selectPCsInStock = createSelector(
  [selectPreBuiltPCs],
  (preBuiltPCs) => preBuiltPCs.filter(pc => pc.stockQuantity > 0)
);

export const selectHighPerformancePCs = createSelector(
  [selectPreBuiltPCs],
  (preBuiltPCs) => preBuiltPCs.filter(pc => pc.performanceRating >= 8)
);

// Selector for PC components breakdown
export const selectPCComponents = createSelector(
  [selectCurrentPC],
  (currentPC) => currentPC?.components || []
);

// Selector for benchmark tests
export const selectBenchmarkTests = createSelector(
  [selectCurrentPC],
  (currentPC) => currentPC?.benchmarkTests || []
);

// Selector for performance summary
export const selectPerformanceSummary = createSelector(
  [selectCurrentPC],
  (currentPC) => currentPC?.performanceSummary
);

// Selector for similar PCs (by category)
export const selectSimilarPCs = createSelector(
  [selectPreBuiltPCs, selectCurrentPC],
  (preBuiltPCs, currentPC) => {
    if (!currentPC) return [];
    
    return preBuiltPCs
      .filter(pc => 
        pc._id !== currentPC._id && 
        pc.category === currentPC.category
      )
      .slice(0, 4);
  }
);