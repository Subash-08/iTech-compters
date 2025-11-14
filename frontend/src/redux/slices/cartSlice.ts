// slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartState, CartItem } from '../types/cartTypes';

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  updating: false,
  isGuest: false, // NEW: Track if cart is in guest mode
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Fetch cart actions
    fetchCartStart: (state) => {
      state.loading = true;
      state.error = null;
    },
// slices/cartSlice.ts - Check this part
fetchCartSuccess: (state, action: PayloadAction<{ items: CartItem[]; isGuest: boolean }>) => {
  state.loading = false;
  state.items = action.payload.items; // This should update the items
  state.isGuest = action.payload.isGuest;
},


    fetchCartFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update cart actions
    updateCartStart: (state) => {
      state.updating = true;
      state.error = null;
    },
updateCartSuccess: (state, action: PayloadAction<{ items: CartItem[]; isGuest: boolean }>) => {
  state.updating = false;
  state.items = action.payload.items; // This should update the items
  state.isGuest = action.payload.isGuest;
},
    updateCartFailure: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },

    // Clear cart action
    clearCartSuccess: (state) => {
      state.updating = false;
      state.items = [];
      state.isGuest = false;
    },

    // Clear error
    clearCartError: (state) => {
      state.error = null;
    },

    // Set guest mode
    setGuestMode: (state, action: PayloadAction<boolean>) => {
      state.isGuest = action.payload;
    },

    // Local cart actions (for optimistic updates)
    addItemToCart: (state, action: PayloadAction<any>) => {
      const existingItem = state.items.find(item => 
        item.product._id === action.payload.productId &&
        item.variant?._id === action.payload.variantId
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        // For guest items, we need to create a proper structure
        const newItem: CartItem = {
          _id: action.payload._id,
          product: { _id: action.payload.productId } as any,
          variant: action.payload.variantId ? { _id: action.payload.variantId } as any : undefined,
          quantity: action.payload.quantity,
          price: action.payload.price,
          addedAt: action.payload.addedAt,
        };
        state.items.push(newItem);
      }
    },

    updateItemQuantity: (state, action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>) => {
      const item = state.items.find(item => 
        item.product._id === action.payload.productId &&
        item.variant?._id === action.payload.variantId
      );

      if (item) {
        item.quantity = action.payload.quantity;
      }
    },

    removeItemFromCart: (state, action: PayloadAction<{ productId: string; variantId?: string }>) => {
      state.items = state.items.filter(item => 
        !(item.product._id === action.payload.productId && 
          item.variant?._id === action.payload.variantId)
      );
    },
  },
});

export const {
  fetchCartStart,
  fetchCartSuccess,
  fetchCartFailure,
  updateCartStart,
  updateCartSuccess,
  updateCartFailure,
  clearCartSuccess,
  clearCartError,
  setGuestMode,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} = cartSlice.actions;

export default cartSlice.reducer;