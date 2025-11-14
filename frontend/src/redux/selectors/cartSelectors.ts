// redux/selectors/cartSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectCartState = (state: RootState) => state.cartState;

// Base selectors
export const selectCartItems = createSelector(
  [selectCartState],
  (cartState) => {
    return Array.isArray(cartState.items) ? cartState.items : [];
  }
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

export const selectIsGuestCart = createSelector(
  [selectCartState],
  (cartState) => cartState.isGuest || false
);

// Derived selectors
export const selectCartItemsCount = createSelector(
  [selectCartItems],
  (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      return total + quantity;
    }, 0);
  }
);

export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return total + (quantity * price);
    }, 0);
  }
);

export const selectCartItemById = (productId: string, variantId?: string) => 
  createSelector(
    [selectCartItems],
    (items) => {
      if (!Array.isArray(items)) return undefined;
      return items.find(item => {
        const itemProductId = item.product?._id || item.productId;
        const itemVariantId = item.variant?._id || item.variantId;
        return itemProductId === productId && itemVariantId === variantId;
      });
    }
  );

export const selectIsItemInCart = (productId: string, variantId?: string) => 
  createSelector(
    [selectCartItems],
    (items) => {
      if (!Array.isArray(items)) return false;
      return items.some(item => {
        const itemProductId = item.product?._id || item.productId;
        const itemVariantId = item.variant?._id || item.variantId;
        return itemProductId === productId && itemVariantId === variantId;
      });
    }
  );

// Pre-built PC cart selectors
export const selectPreBuiltPCItems = createSelector(
  [selectCartItems],
  (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => item.productType === 'prebuilt-pc' || item.preBuiltPC || item.pcId);
  }
);

export const selectProductItems = createSelector(
  [selectCartItems],
  (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => !item.productType || item.productType === 'product' || item.product);
  }
);

export const selectPreBuiltPCItemById = (pcId: string) => 
  createSelector(
    [selectCartItems],
    (items) => {
      if (!Array.isArray(items)) return undefined;
      return items.find(item => {
        const itemPCId = item.preBuiltPC?._id || item.pcId;
        return (item.productType === 'prebuilt-pc' || item.preBuiltPC) && itemPCId === pcId;
      });
    }
  );

export const selectIsPreBuiltPCInCart = (pcId: string) => 
  createSelector(
    [selectCartItems],
    (items) => {
      if (!Array.isArray(items)) return false;
      return items.some(item => {
        const itemPCId = item.preBuiltPC?._id || item.pcId;
        return (item.productType === 'prebuilt-pc' || item.preBuiltPC) && itemPCId === pcId;
      });
    }
  );

// Enhanced cart summary
export const selectCartSummary = createSelector(
  [selectCartItems, selectCartTotal, selectCartItemsCount, selectIsGuestCart],
  (items, total, count, isGuest) => ({
    items: Array.isArray(items) ? items : [],
    total: Number(total) || 0,
    count: Number(count) || 0,
    itemCount: Array.isArray(items) ? items.length : 0,
    isGuest: Boolean(isGuest)
  })
);

export const selectEnhancedCartSummary = createSelector(
  [selectCartItems, selectCartTotal, selectCartItemsCount, selectIsGuestCart],
  (items, total, count, isGuest) => {
    const productItems = items.filter(item => !item.productType || item.productType === 'product' || item.product);
    const preBuiltPCItems = items.filter(item => item.productType === 'prebuilt-pc' || item.preBuiltPC || item.pcId);
    
    return {
      items: Array.isArray(items) ? items : [],
      productItems,
      preBuiltPCItems,
      total: Number(total) || 0,
      count: Number(count) || 0,
      productCount: productItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
      preBuiltPCCount: preBuiltPCItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
      itemCount: Array.isArray(items) ? items.length : 0,
      isGuest: Boolean(isGuest)
    };
  }
);