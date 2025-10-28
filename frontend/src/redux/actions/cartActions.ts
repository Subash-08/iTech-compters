import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { CartItem, AddToCartData, UpdateCartQuantityData, RemoveFromCartData } from '../types/cartTypes';

// API Calls
export const cartAPI = {
  // Get user cart
  getCart: async (): Promise<{ cart: CartItem[] }> => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch cart';
      throw new Error(errorMessage);
    }
  },

  // Add to cart
  addToCart: async (cartData: AddToCartData): Promise<{ cart: CartItem[]; message: string }> => {
    try {
      const response = await api.post('/cart', cartData);
      toast.success('Product added to cart successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add product to cart';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Update cart quantity
  updateCartQuantity: async (updateData: UpdateCartQuantityData): Promise<{ cart: CartItem[]; message: string }> => {
    try {
      const response = await api.put('/cart', updateData);
      toast.success('Cart updated successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update cart';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Remove from cart
  removeFromCart: async (removeData: RemoveFromCartData): Promise<{ cart: CartItem[]; message: string }> => {
    try {
      const response = await api.delete('/cart', { data: removeData });
      toast.success('Product removed from cart successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove product from cart';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Clear cart
  clearCart: async (): Promise<{ message: string }> => {
    try {
      const response = await api.delete('/cart/clear');
      toast.success('Cart cleared successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to clear cart';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
};

// Action creators
export const cartActions = {
  // Fetch cart
  fetchCart: () => async (dispatch: any) => {
    try {
      dispatch({ type: 'cart/fetchCartStart' });
      const response = await cartAPI.getCart();
      dispatch({
        type: 'cart/fetchCartSuccess',
        payload: response.cart,
      });
    } catch (error: any) {
      dispatch({
        type: 'cart/fetchCartFailure',
        payload: error.message,
      });
    }
  },

  // Add to cart
  addToCart: (cartData: AddToCartData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'cart/updateCartStart' });
      const response = await cartAPI.addToCart(cartData);
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: response.cart,
      });
    } catch (error: any) {
      dispatch({
        type: 'cart/updateCartFailure',
        payload: error.message,
      });
    }
  },

  // Update cart quantity
  updateCartQuantity: (updateData: UpdateCartQuantityData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'cart/updateCartStart' });
      const response = await cartAPI.updateCartQuantity(updateData);
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: response.cart,
      });
    } catch (error: any) {
      dispatch({
        type: 'cart/updateCartFailure',
        payload: error.message,
      });
    }
  },

  // Remove from cart
  removeFromCart: (removeData: RemoveFromCartData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'cart/updateCartStart' });
      const response = await cartAPI.removeFromCart(removeData);
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: response.cart,
      });
    } catch (error: any) {
      dispatch({
        type: 'cart/updateCartFailure',
        payload: error.message,
      });
    }
  },

  // Clear cart
  clearCart: () => async (dispatch: any) => {
    try {
      dispatch({ type: 'cart/updateCartStart' });
      await cartAPI.clearCart();
      dispatch({
        type: 'cart/clearCartSuccess',
      });
    } catch (error: any) {
      dispatch({
        type: 'cart/updateCartFailure',
        payload: error.message,
      });
    }
  },

  // Clear error
  clearCartError: () => ({
    type: 'cart/clearError',
  }),
};