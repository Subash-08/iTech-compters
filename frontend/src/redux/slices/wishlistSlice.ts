// slices/wishlistSlice.ts - SUPER DEFENSIVE VERSION
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WishlistState, WishlistItem } from '../types/wishlistTypes';

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
  updating: false,
  checkedItems: [],
  isGuest: false,
  lastSynced: null,
  
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // Fetch wishlist actions
    fetchWishlistStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
fetchWishlistSuccess: (state, action: PayloadAction<{ items: WishlistItem[]; isGuest: boolean }>) => {
  state.loading = false;
  
  // ✅ FIX: Handle case where action or payload is undefined
  if (!action || !action.payload) {
    console.error('❌ fetchWishlistSuccess: action or payload is undefined');
    state.items = [];
    state.isGuest = false;
    state.checkedItems = [];
    return;
  }
  
  // ✅ DEFENSIVE CHECK: Ensure items is always an array
  const items = Array.isArray(action.payload.items) ? action.payload.items : [];
  
  // ✅ FIXED: Deep clone items to preserve nested objects
  state.items = items.map(item => ({
    ...item,
    // Preserve variant - ensure it's not lost
    variant: item.variant ? { ...item.variant } : item.variant,
    // Preserve product with nested images
    product: item.product ? { 
      ...item.product,
      // Deep clone images object
      images: item.product.images ? { ...item.product.images } : item.product.images
    } : item.product
  }));
  
  state.isGuest = Boolean(action.payload.isGuest);
  
  // ✅ DEFENSIVE CHECK: Safe mapping for checkedItems
  state.checkedItems = items
    .map(item => item?.product?._id)
    .filter((id): id is string => Boolean(id));
},
    
    fetchWishlistFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update wishlist actions
    updateWishlistStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    
updateWishlistSuccess: (state, action: PayloadAction<{ items: WishlistItem[]; isGuest: boolean }>) => {
  state.updating = false;
  
  if (!action.payload) {
    console.error('❌ updateWishlistSuccess: action.payload is undefined');
    return;
  }
  
  const items = Array.isArray(action.payload.items) ? action.payload.items : [];
  
  // ✅ FIXED: Deep clone items
  state.items = items.map(item => ({
    ...item,
    variant: item.variant ? { ...item.variant } : item.variant,
    product: item.product ? { 
      ...item.product,
      images: item.product.images ? { ...item.product.images } : item.product.images
    } : item.product
  }));
  
  state.isGuest = Boolean(action.payload.isGuest);
  state.checkedItems = items
    .map(item => item?.product?._id)
    .filter((id): id is string => Boolean(id));
},

syncWishlistSuccess: (state, action: PayloadAction<{ items: WishlistItem[]; isGuest: boolean }>) => {
  state.updating = false;
  
  if (!action.payload) {
    console.error('❌ syncWishlistSuccess: action.payload is undefined');
    return;
  }
  
  const items = Array.isArray(action.payload.items) ? action.payload.items : [];
  
  // ✅ FIXED: Deep clone items
  state.items = items.map(item => ({
    ...item,
    variant: item.variant ? { ...item.variant } : item.variant,
    product: item.product ? { 
      ...item.product,
      images: item.product.images ? { ...item.product.images } : item.product.images
    } : item.product
  }));
  
  state.checkedItems = items
    .map(item => item?.product?._id)
    .filter((id): id is string => Boolean(id));
  state.isGuest = Boolean(action.payload.isGuest);
  state.lastSynced = new Date().toISOString();
},
    updateWishlistFailure: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },

    // Clear wishlist action
    clearWishlistSuccess: (state) => {
      state.updating = false;
      state.items = [];
      state.checkedItems = [];
      state.isGuest = false;
      state.error = null;
    },

    // Check wishlist item
    checkWishlistItemSuccess: (state, action: PayloadAction<{ productId: string; isInWishlist: boolean }>) => {
      if (!action.payload) return;
      
      const { productId, isInWishlist } = action.payload;
      
      if (isInWishlist) {
        // Add to checkedItems if not already present
        if (!state.checkedItems.includes(productId)) {
          state.checkedItems.push(productId);
        }
      } else {
        // Remove from checkedItems
        state.checkedItems = state.checkedItems.filter(id => id !== productId);
      }
    },

    // Clear error
    clearWishlistError: (state) => {
      state.error = null;
    },

    // Local wishlist actions (for optimistic updates)
    addItemToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      if (!action.payload?.product?._id) return;
      
      const existingItem = state.items.find(item => 
        item.product._id === action.payload.product._id
      );

      if (!existingItem) {
        state.items.push(action.payload);
        // Add to checkedItems if not already present
        if (!state.checkedItems.includes(action.payload.product._id)) {
          state.checkedItems.push(action.payload.product._id);
        }
      }
    },

// In wishlistSlice.ts - Update removeItemFromWishlist
removeItemFromWishlist: (state, action: PayloadAction<{ productId: string }>) => {
    if (!action.payload?.productId) return;
    
    // ✅ Handle both regular productId and guest itemId format
    const idToRemove = action.payload.productId;
    
    state.items = state.items.filter(item => {
        // Check if this is the item to remove
        // Could be matching by item._id (guest-xxx) or product._id
        return item._id !== idToRemove && item.product._id !== idToRemove;
    });
    
    state.checkedItems = state.checkedItems.filter(id => id !== idToRemove);
},

    // Batch check items
    batchCheckWishlistItems: (state, action: PayloadAction<{ productIds: string[]; allInWishlist: boolean }>) => {
      if (!action.payload?.productIds) return;
      
      if (action.payload.allInWishlist) {
        // Add all productIds that are not already in checkedItems
        action.payload.productIds.forEach(id => {
          if (!state.checkedItems.includes(id)) {
            state.checkedItems.push(id);
          }
        });
      } else {
        // Remove all productIds from checkedItems
        state.checkedItems = state.checkedItems.filter(id => 
          !action.payload.productIds.includes(id)
        );
      }
    },

    // ✅ Guest wishlist actions
    setGuestWishlist: (state, action: PayloadAction<WishlistItem[]>) => {
      const items = Array.isArray(action.payload) ? action.payload : [];
      state.items = items;
      state.checkedItems = items
        .map(item => item?.product?._id)
        .filter((id): id is string => Boolean(id));
      state.isGuest = true;
    },

    // ✅ Sync actions
    syncWishlistStart: (state) => {
      state.updating = true;
      state.error = null;
    },

    syncWishlistFailure: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },

    // ✅ Toggle guest mode
    setWishlistMode: (state, action: PayloadAction<'guest' | 'authenticated'>) => {
      state.isGuest = action.payload === 'guest';
    },
  },
});

export const {
  fetchWishlistStart,
  fetchWishlistSuccess,
  fetchWishlistFailure,
  updateWishlistStart,
  updateWishlistSuccess,
  updateWishlistFailure,
  clearWishlistSuccess,
  checkWishlistItemSuccess,
  clearWishlistError,
  addItemToWishlist,
  removeItemFromWishlist,
  batchCheckWishlistItems,
  syncWishlistFailure,
  syncWishlistStart,
  syncWishlistSuccess,
  setGuestWishlist,
  setWishlistMode,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;