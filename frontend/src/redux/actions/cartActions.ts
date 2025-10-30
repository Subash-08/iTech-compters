import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { CartItem, AddToCartData, UpdateCartQuantityData, RemoveFromCartData } from '../types/cartTypes';

// API Calls
export const cartAPI = {
  // Get user cart
  getCart: async (): Promise<{ data: CartItem[] }> => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch cart';
      throw new Error(errorMessage);
    }
  },

  // Add to cart
  addToCart: async (cartData: AddToCartData): Promise<{ data: CartItem[]; message: string }> => {
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
  updateCartQuantity: async (updateData: UpdateCartQuantityData): Promise<{ data: CartItem[]; message: string }> => {
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
  removeFromCart: async (removeData: RemoveFromCartData): Promise<{ data: CartItem[]; message: string }> => {
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
// actions/cartActions.ts - UPDATE fetchCart function
export const fetchCart = () => async (dispatch: any) => {
  try {
    dispatch({ type: 'cart/fetchCartStart' });
    const response = await cartAPI.getCart();
    
    console.log('Cart API Response:', response); // Debug log
    
    // ✅ Handle different response structures
    const cartData = response.data || response;
    
    // The items might be in cartData.items or directly in cartData
    const items = cartData.items || cartData;
    
    dispatch({
      type: 'cart/fetchCartSuccess',
      payload: Array.isArray(items) ? items : [],
    });
  } catch (error: any) {
    dispatch({
      type: 'cart/fetchCartFailure',
      payload: error.message,
    });
  }
};

export const addToCart = (cartData: AddToCartData) => async (dispatch: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    // 🆕 Get full product data first to include variant images
    let variantData = null;
    if (cartData.variantId) {
      // You might need to fetch the product to get variant images
      // Or modify your backend to return full variant data in cart response
    }

    // Optimistic update - use minimal data for now
    dispatch({
      type: 'cart/addItemToCart',
      payload: {
        _id: `temp-${Date.now()}`,
        product: { _id: cartData.productId } as any,
        variant: cartData.variantId ? { 
          variantId: cartData.variantId,
          // We'll populate images from the product data later
        } as any : undefined,
        quantity: cartData.quantity || 1,
        price: 0, // Will be updated by backend
        addedAt: new Date().toISOString(),
      },
    });

    const response = await cartAPI.addToCart(cartData);
    const cartDataResponse = response.data || response;
    
    dispatch({
      type: 'cart/updateCartSuccess',
      payload: cartDataResponse.items || cartDataResponse,
    });
  } catch (error: any) {
    // Revert optimistic update on error
    dispatch({
      type: 'cart/removeItemFromCart',
      payload: { productId: cartData.productId, variantId: cartData.variantId },
    });
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
  }
};

export const updateCartQuantity = (updateData: UpdateCartQuantityData) => async (dispatch: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    // Optimistic update
    dispatch({
      type: 'cart/updateItemQuantity',
      payload: updateData,
    });

    const response = await cartAPI.updateCartQuantity(updateData);
    dispatch({
      type: 'cart/updateCartSuccess',
      payload: response.data.items || response.data,
    });
  } catch (error: any) {
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
    // Refetch cart to sync with server
    dispatch(fetchCart());
  }
};

export const removeFromCart = (removeData: RemoveFromCartData) => async (dispatch: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    // Optimistic update
    dispatch({
      type: 'cart/removeItemFromCart',
      payload: removeData,
    });

    const response = await cartAPI.removeFromCart(removeData);
    dispatch({
      type: 'cart/updateCartSuccess',
      payload: response.data.items || response.data,
    });
  } catch (error: any) {
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
    // Refetch cart to sync with server
    dispatch(fetchCart());
  }
};

export const clearCart = () => async (dispatch: any) => {
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
};

export const clearCartError = () => ({
  type: 'cart/clearCartError',
});

// Export as object for consistency
export const cartActions = {
  fetchCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  clearCartError,
};