import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WishlistState, WishlistItem } from '../types/wishlistTypes';

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
  updating: false,
  checkedItems: [], // Use array instead of Set
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
    fetchWishlistSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
      
      // ✅ Handle both response formats
      if (action.payload && action.payload.items) {
        // If it's the wishlist object with items array
        state.items = action.payload.items;
        state.checkedItems = action.payload.items.map((item: any) => item.product?._id).filter(Boolean);
      } else if (Array.isArray(action.payload)) {
        // If it's directly the items array
        state.items = action.payload;
        state.checkedItems = action.payload.map((item: any) => item.product?._id).filter(Boolean);
      } else {
        // Fallback
        state.items = [];
        state.checkedItems = [];
      }
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
    updateWishlistSuccess: (state, action: PayloadAction<WishlistItem[]>) => {
      state.updating = false;
      state.items = action.payload;
      // Update checked items array
      state.checkedItems = action.payload.map(item => item.product._id);
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
    },

    // Check wishlist item
    checkWishlistItemSuccess: (state, action: PayloadAction<{ productId: string; isInWishlist: boolean }>) => {
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

    removeItemFromWishlist: (state, action: PayloadAction<{ productId: string }>) => {
      state.items = state.items.filter(item => 
        item.product._id !== action.payload.productId
      );
      state.checkedItems = state.checkedItems.filter(id => id !== action.payload.productId);
    },

    // Batch check items
    batchCheckWishlistItems: (state, action: PayloadAction<{ productIds: string[]; allInWishlist: boolean }>) => {
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
} = wishlistSlice.actions;

export default wishlistSlice.reducer;