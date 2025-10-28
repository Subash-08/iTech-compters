import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectCartState = (state: RootState) => state.cartState;

// Base selectors
export const selectCartItems = createSelector(
  [selectCartState],
  (cartState) => cartState.items
);

export const selectCartLoading = createSelector(
  [selectCartState],
  (cartState) => cartState.loading
);

export const selectCartError = createSelector(
  [selectCartState],
  (cartState) => cartState.error
);

export const selectCartUpdating = createSelector(
  [selectCartState],
  (cartState) => cartState.updating
);

// Derived selectors
export const selectCartItemsCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => {
    const price = item.variant?.price || item.product.price;
    return total + (price * item.quantity);
  }, 0)
);

export const selectCartItemById = (productId: string, variantId?: string) => 
  createSelector(
    [selectCartItems],
    (items) => items.find(item => 
      item.product._id === productId && 
      item.variant?._id === variantId
    )
  );

export const selectIsItemInCart = (productId: string, variantId?: string) => 
  createSelector(
    [selectCartItems],
    (items) => items.some(item => 
      item.product._id === productId && 
      item.variant?._id === variantId
    )
  );

// Cart summary
export const selectCartSummary = createSelector(
  [selectCartItems, selectCartTotal, selectCartItemsCount],
  (items, total, count) => ({
    items,
    total,
    count,
    itemCount: items.length,
  })
);