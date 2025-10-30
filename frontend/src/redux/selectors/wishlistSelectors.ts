// selectors/wishlistSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectWishlistState = (state: RootState) => state.wishlistState;

// Base selectors
export const selectWishlistData = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.items
);

// Fix: Properly extract items from wishlist data
export const selectWishlistItems = createSelector(
  [selectWishlistData],
  (wishlistData) => {
    // If wishlistData is the entire wishlist object, extract items
    if (wishlistData && wishlistData.items) {
      return wishlistData.items;
    }
    // If wishlistData is already the items array, return it directly
    if (Array.isArray(wishlistData)) {
      return wishlistData;
    }
    // Fallback to empty array
    return [];
  }
);

export const selectWishlistLoading = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.loading
);

export const selectWishlistError = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.error
);

export const selectWishlistUpdating = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.updating
);

export const selectWishlistCheckedItems = createSelector(
  [selectWishlistState],
  (wishlistState) => wishlistState.checkedItems
);

// Derived selectors
export const selectWishlistItemsCount = createSelector(
  [selectWishlistItems],
  (items) => items.length
);

export const selectWishlistItemById = (productId: string) => 
  createSelector(
    [selectWishlistItems],
    (items) => items.find(item => item.product && item.product._id === productId)
  );

export const selectIsInWishlist = (productId: string) => 
  createSelector(
    [selectWishlistCheckedItems],
    (checkedItems) => checkedItems.includes(productId)
  );

export const selectWishlistProductIds = createSelector(
  [selectWishlistItems],
  (items) => items.map(item => item.product?._id).filter(Boolean)
);

// Wishlist summary
export const selectWishlistSummary = createSelector(
  [selectWishlistItems, selectWishlistItemsCount],
  (items, count) => ({
    items,
    count,
    totalValue: items.reduce((total, item) => {
      if (!item.product) return total;
      const price = item.product.discountPrice || item.product.price;
      return total + price;
    }, 0),
  })
);