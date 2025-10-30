import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartState, CartItem } from '../types/cartTypes';

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  updating: false,
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
    fetchCartSuccess: (state, action: PayloadAction<CartItem[]>) => {
      state.loading = false;
      state.items = action.payload;
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
    updateCartSuccess: (state, action: PayloadAction<CartItem[]>) => {
      state.updating = false;
      state.items = action.payload;
    },
    updateCartFailure: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },

    // Clear cart action
    clearCartSuccess: (state) => {
      state.updating = false;
      state.items = [];
    },

    // Clear error
    clearCartError: (state) => {
      state.error = null;
    },

    // Local cart actions (for optimistic updates)
    addItemToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(item => 
        item.product._id === action.payload.product._id &&
        item.variant?._id === action.payload.variant?._id
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
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
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} = cartSlice.actions;

export default cartSlice.reducer;