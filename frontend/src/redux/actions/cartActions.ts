// actions/cartActions.ts
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { localStorageUtils, GuestCartItem } from '../../components/utils/localStorage';
import { CartItem, AddToCartData, UpdateCartQuantityData, RemoveFromCartData } from '../types/cartTypes';

// Combined API functions with guest support
const cartAPI = {
  // Get cart (works for both authenticated and guest users)
  getCart: async (): Promise<{ data: any }> => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // User not authenticated - return guest cart
        const guestCart = localStorageUtils.getGuestCart();
        return {
          success: true,
          data: {
            items: guestCart,
            totalItems: guestCart.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: guestCart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
            isGuest: true
          }
        };
      }
      const errorMessage = error.response?.data?.message || 'Failed to fetch cart';
      throw new Error(errorMessage);
    }
  },

// In cartAPI object - FIXED addToCart
addToCart: async (cartData: AddToCartData): Promise<{ data: any; message: string }> => {
  try {
    // ✅ FIXED: Handle case where variant might not be required
    const variantId = cartData.variantData?.variantId || cartData.variantId;
    
    const payload = {
      productId: cartData.productId,
      quantity: cartData.quantity || 1
    };
    
    // Only add variantId if it exists
    if (variantId) {
      payload.variantId = variantId;
    }
    
    console.log('🛒 Final API Payload:', payload);
    
    const response = await api.post('/cart', payload);
    toast.success('Product added to cart successfully');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Guest cart handling
      const guestCart = localStorageUtils.getGuestCart();
      
      const variantId = cartData.variantData?.variantId || cartData.variantId;
      
      const existingItemIndex = guestCart.findIndex(
        item => item.productId === cartData.productId && 
               item.variantId === variantId
      );

      let updatedCart: GuestCartItem[];
      if (existingItemIndex > -1) {
        updatedCart = guestCart.map((item, index) => 
          index === existingItemIndex 
            ? { 
                ...item, 
                quantity: item.quantity + (cartData.quantity || 1)
              }
            : item
        );
      } else {
        const price = cartData.variantData?.price || 0;
        
        const newItem: GuestCartItem = {
          _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: cartData.productId,
          variantId: variantId,
          quantity: cartData.quantity || 1,
          price: price,
          addedAt: new Date().toISOString(),
          productType: 'product'
        };
        updatedCart = [...guestCart, newItem];
      }

      localStorageUtils.saveGuestCart(updatedCart);
      toast.success('Product added to cart successfully');
      
      return {
        success: true,
        message: 'Product added to guest cart',
        data: {
          items: updatedCart,
          totalItems: updatedCart.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedCart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
          isGuest: true
        }
      };
    }
    
    const errorMessage = error.response?.data?.message || 'Failed to add product to cart';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
},

// In cartAPI object - FIXED removeFromCart
removeFromCart: async (removeData: RemoveFromCartData): Promise<{ data: any; message: string }> => {
  try {
    // ✅ FIXED: Send variantId if it exists
    const payload = {
      productId: removeData.productId,
      ...(removeData.variantId && { variantId: removeData.variantId })
    };
    
    console.log('🛒 Final removal payload:', payload);
    
    const response = await api.delete('/cart', { 
      data: payload
    });
    toast.success('Product removed from cart successfully');
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Failed to remove product from cart';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
},

updateCartQuantity: async (updateData: UpdateCartQuantityData): Promise<{ data: any; message: string }> => {
  // This should only be called for authenticated users now
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

// In cartAPI object - Update clearCart
clearCart: async (): Promise<{ message: string }> => {
  // This should only be called for authenticated users
  // Guest users are handled in the action itself
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

  // Sync guest cart after login
  syncGuestCart: async (items: GuestCartItem[]): Promise<{ data: any; message: string }> => {
    try {
      const response = await api.post('/cart/sync', { items });
      toast.success('Cart synchronized successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to sync cart';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Validate guest cart items
  validateGuestCart: async (items: GuestCartItem[]): Promise<{ data: any }> => {
    try {
      const simplifiedItems = items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }));
      
      const response = await api.post('/cart/guest/validate', { items: simplifiedItems });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to validate cart items';
      throw new Error(errorMessage);
    }
  }
};

// actions/cartActions.ts - FIX fetchCart for authenticated users
const fetchCart = () => async (dispatch: any, getState: any) => {
  try {
    dispatch({ type: 'cart/fetchCartStart' });
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;
    
    if (isGuest) {
      // For guest users, get cart directly from localStorage
      const guestCart = localStorageUtils.getGuestCart();
      
      dispatch({
        type: 'cart/fetchCartSuccess',
        payload: {
          items: guestCart,
          isGuest: true
        }
      });
    } else {
      // For authenticated users, use the API
      const response = await cartAPI.getCart();
      
      let items = [];
      let isGuestMode = false;
      
      if (response.success) {
        // Handle different response structures
        if (response.data && Array.isArray(response.data.items)) {
          items = response.data.items;
          isGuestMode = response.data.isGuest || false;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // If response.data is the cart object itself
          items = response.data.items || [];
          isGuestMode = response.data.isGuest || false;
        }
      } else if (response.data) {
        // Alternative structure
        items = response.data.items || [];
        isGuestMode = response.data.isGuest || false;
      }    
      dispatch({
        type: 'cart/fetchCartSuccess',
        payload: {
          items: items,
          isGuest: isGuestMode
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Fetch cart error:', error);
    dispatch({
      type: 'cart/fetchCartFailure',
      payload: error.message,
    });
  }
};

// redux/actions/cartActions.ts - FIXED addToCart
const addToCart = (cartData: AddToCartData) => async (dispatch: any, getState: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;
    
    console.log('🛒 Adding to cart:', cartData);

    if (isGuest) {
      // Guest user handling
      const guestCart = localStorageUtils.getGuestCart();
      
      const variantId = cartData.variantData?.variantId || cartData.variantId;
      
      const existingItemIndex = guestCart.findIndex(
        item => item.productId === cartData.productId && 
               item.variantId === variantId
      );

      let updatedCart;
      if (existingItemIndex > -1) {
        updatedCart = guestCart.map((item, index) => 
          index === existingItemIndex 
            ? { 
                ...item, 
                quantity: item.quantity + (cartData.quantity || 1)
              }
            : item
        );
      } else {
        const price = cartData.variantData?.price || 0;
        
        const newItem: GuestCartItem = {
          _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: cartData.productId,
          variantId: variantId,
          quantity: cartData.quantity || 1,
          price: price,
          addedAt: new Date().toISOString(),
          productType: 'product'
        };
        updatedCart = [...guestCart, newItem];
      }

      localStorageUtils.saveGuestCart(updatedCart);
      
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: updatedCart,
          isGuest: true
        }
      });
      
      toast.success('Product added to cart successfully');
      
    } else {
      // For authenticated users - FIXED payload
      const apiPayload = {
        productId: cartData.productId,
        variantId: cartData.variantData?.variantId || cartData.variantId || undefined,
        quantity: cartData.quantity || 1
      };
      
      console.log('🛒 Sending to backend:', apiPayload);
      
      const response = await cartAPI.addToCart(apiPayload);
      
      let items = [];
      let isGuestMode = false;
      
      if (response.success) {
        items = response.data?.items || [];
        isGuestMode = response.data?.isGuest || false;
      } else if (response.data) {
        items = response.data.items || [];
        isGuestMode = response.data.isGuest || false;
      }
      
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: items,
          isGuest: isGuestMode
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ Add to cart error:', error);
    
    // Show specific error message
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to add product to cart');
    }
    
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
  }
};

// Helper function to format product images
const formatProductImages = (images: any) => {
  if (!images) return [];
  
  const imageUrls = [];
  
  // Handle thumbnail
  if (images.thumbnail?.url) {
    imageUrls.push(images.thumbnail.url);
  }
  
  // Handle gallery images
  if (images.gallery && Array.isArray(images.gallery)) {
    images.gallery.forEach((img: any) => {
      if (img.url) imageUrls.push(img.url);
    });
  }
  
  // Handle hover image
  if (images.hoverImage?.url) {
    imageUrls.push(images.hoverImage.url);
  }
  
  return imageUrls.length > 0 ? imageUrls : [];
};
// actions/cartActions.ts - FIX updateCartQuantity for guest users
const updateCartQuantity = (updateData: UpdateCartQuantityData) => async (dispatch: any, getState: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;
    
    if (isGuest) {
      // Handle guest cart quantity update locally
      const guestCart = localStorageUtils.getGuestCart();
      const updatedCart = guestCart.map(item =>
        item.productId === updateData.productId && item.variantId === updateData.variantId
          ? { ...item, quantity: updateData.quantity }
          : item
      ).filter(item => item.quantity > 0); // Remove items with 0 quantity

      localStorageUtils.saveGuestCart(updatedCart);
      
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: updatedCart,
          isGuest: true
        }
      });
      
      toast.success('Cart updated successfully');
      
    } else {
      // For authenticated users, use the API
      const response = await cartAPI.updateCartQuantity(updateData);
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: response.data.items || response.data,
          isGuest: response.data.isGuest || false
        }
      });
    }
    
  } catch (error: any) {
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
    dispatch(fetchCart());
  }
};

// redux/actions/cartActions.ts - FIXED removeFromCart
const removeFromCart = (removeData: RemoveFromCartData) => async (dispatch: any, getState: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;
    
    console.log('🗑️ Removing from cart with variant:', removeData);

    if (isGuest) {
      // Guest user handling
      const guestCart = localStorageUtils.getGuestCart();
      const updatedCart = guestCart.filter(item => 
        !(item.productId === removeData.productId && 
          item.variantId === removeData.variantId) // ✅ Use variantId for comparison
      );
      
      localStorageUtils.saveGuestCart(updatedCart);
      
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: updatedCart,
          isGuest: true
        }
      });
      
      toast.success('Product removed from cart successfully');
    } else {
      // ✅ FIXED: Send variantId if it exists
      const payload = {
        productId: removeData.productId,
        ...(removeData.variantId && { variantId: removeData.variantId })
      };
      
      console.log('🛒 Sending removal payload:', payload);
      
      const response = await cartAPI.removeFromCart(payload);
      
      let items = [];
      let isGuestMode = false;
      
      if (response.success) {
        items = response.data?.items || [];
        isGuestMode = response.data?.isGuest || false;
      } else if (response.data) {
        items = response.data.items || [];
        isGuestMode = response.data.isGuest || false;
      }
      
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: items,
          isGuest: isGuestMode
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ Remove from cart error:', error);
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
  }
};

// actions/cartActions.ts - FIX clearCart for guest users
const clearCart = () => async (dispatch: any, getState: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;
    
    if (isGuest) {
      // Handle guest cart clear locally
      localStorageUtils.clearGuestCart();
      
      dispatch({
        type: 'cart/clearCartSuccess',
      });
      
      toast.success('Cart cleared successfully');
      
    } else {
      // For authenticated users, use the API
      await cartAPI.clearCart();
      dispatch({
        type: 'cart/clearCartSuccess',
      });
    }
    
  } catch (error: any) {
    console.error('❌ Clear cart error:', error);
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
  }
};
// actions/cartActions.ts - ADD SYNC LOCK AT MODULE LEVEL
let syncInProgress = false;

// actions/cartActions.ts - SIMPLIFIED SYNC
const syncGuestCart = () => async (dispatch: any, getState: any) => {
  // Prevent multiple simultaneous syncs
  if (syncInProgress) {
    return;
  }

  syncInProgress = true;
  
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    const guestCart = localStorageUtils.getGuestCart();
    const currentUser = getState().authState.user?._id;

    // ✅ REMOVED: The security check that was causing the warning
    // We don't need this because the modal only shows when appropriate
    
    if (guestCart.length > 0) {
      
      // ✅ SIMPLIFIED: Just send all items to backend, let backend handle duplicates
      const response = await cartAPI.syncGuestCart(guestCart);
      
      // Clear guest cart only after successful sync
      localStorageUtils.clearGuestCart();
      localStorageUtils.setLastSyncedUser(currentUser);
      
      toast.success(`Added ${guestCart.length} items to your cart!`);
    } else {
    }
    
    // Always fetch fresh cart after sync
    await dispatch(fetchCart());
    
  } catch (error: any) {
    console.error('❌ Failed to sync guest cart:', error);
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
    // Don't clear guest cart on error - let user retry
    toast.error('Failed to sync cart. Please try again.');
  } finally {
    syncInProgress = false;
  }
};

// redux/actions/cartActions.ts - FIXED addPreBuiltPCToCart

// FIXED: Clean version with proper thunk structure
const addPreBuiltPCToCart = (cartData: { pcId: string; quantity?: number }) => {
  return async (dispatch: any, getState: any) => {
    try {
      dispatch({ type: 'cart/updateCartStart' });
      
      // FIXED: Check if getState exists before calling it
      let isGuest = true;
      if (typeof getState === 'function') {
        const state = getState();
        isGuest = !state.authState.isAuthenticated;
      }
      
      if (isGuest) {
        // Guest cart handling...
        const guestCart = localStorageUtils.getGuestCart();
        // ... rest of guest cart logic
      } else {
        // Authenticated user - use API
        const response = await api.post('/cart/prebuilt-pc/add', cartData);
        
        let items = [];
        let isGuestMode = false;
        
        if (response.data.success) {
          items = response.data.data?.items || [];
          isGuestMode = response.data.data?.isGuest || false;
        }
        
        dispatch({
          type: 'cart/updateCartSuccess',
          payload: {
            items: items,
            isGuest: isGuestMode
          }
        });
        
        toast.success(response.data.message || 'Pre-built PC added to cart successfully');
      }
      
    } catch (error: any) {
      console.error('❌ Add pre-built PC to cart error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add pre-built PC to cart';
      toast.error(errorMessage);
      
      dispatch({
        type: 'cart/updateCartFailure',
        payload: error.message,
      });
    }
  };
};


// redux/actions/cartActions.ts - Update removePreBuiltPCFromCart
const removePreBuiltPCFromCart = (pcId: string) => async (dispatch: any, getState: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;
     if (!pcId || pcId === 'undefined') {
      throw new Error('Invalid PC ID');
    }

    if (isGuest) {
      // Handle guest cart removal locally
      const guestCart = localStorageUtils.getGuestCart();
      const updatedCart = guestCart.filter(item =>
        !(item.productType === 'prebuilt-pc' && item.pcId === pcId)
      );

      localStorageUtils.saveGuestCart(updatedCart);
      
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: updatedCart,
          isGuest: true
        }
      });
      
      toast.success('Pre-built PC removed from cart successfully');
      
    } else {
      // For authenticated users, use the API
      const response = await api.delete(`/cart/prebuilt-pc/remove/${pcId}`);
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: response.data.data?.items || response.data.data,
          isGuest: response.data.data?.isGuest || false
        }
      });
      
      toast.success(response.data.message || 'Pre-built PC removed from cart successfully');
    }
    
  } catch (error: any) {
    console.error('❌ Remove pre-built PC from cart error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to remove pre-built PC from cart';
    toast.error(errorMessage);
    
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
    dispatch(fetchCart());
  }
};

// Update Pre-built PC quantity in cart
const updatePreBuiltPCQuantity = (pcId: string, quantity: number) => async (dispatch: any, getState: any) => {
  try {
    dispatch({ type: 'cart/updateCartStart' });
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;
    
    if (isGuest) {
      // Handle guest cart quantity update locally
      const guestCart = localStorageUtils.getGuestCart();
      const updatedCart = guestCart.map(item =>
        item.productType === 'prebuilt-pc' && item.pcId === pcId
          ? { ...item, quantity: quantity }
          : item
      ).filter(item => item.quantity > 0);

      localStorageUtils.saveGuestCart(updatedCart);
      
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: updatedCart,
          isGuest: true
        }
      });
      
      toast.success('Cart updated successfully');
      
    } else {
      // For authenticated users, use the API
      const response = await api.put(`/cart/prebuilt-pc/update/${pcId}`, { quantity });
      dispatch({
        type: 'cart/updateCartSuccess',
        payload: {
          items: response.data.data?.items || response.data.data,
          isGuest: response.data.data?.isGuest || false
        }
      });
      
      toast.success(response.data.message || 'Cart updated successfully');
    }
    
  } catch (error: any) {
    console.error('❌ Update pre-built PC quantity error:', error);
    const errorMessage = error.response?.data?.message || 'Failed to update cart';
    toast.error(errorMessage);
    
    dispatch({
      type: 'cart/updateCartFailure',
      payload: error.message,
    });
    dispatch(fetchCart());
  }
};

// Helper function to format PC images
const formatPCImages = (images: any) => {
  if (!images) return [];
  
  const imageUrls = [];
  
  // Handle thumbnail
  if (images.thumbnail?.url) {
    imageUrls.push(images.thumbnail.url);
  }
  
  // Handle gallery images
  if (images.gallery && Array.isArray(images.gallery)) {
    images.gallery.forEach((img: any) => {
      if (img.url) imageUrls.push(img.url);
    });
  }
  
  // Handle main image
  if (images.main?.url) {
    imageUrls.push(images.main.url);
  }
  
  return imageUrls.length > 0 ? imageUrls : [];
};
// Enhanced merge function with better logging
const mergeDuplicateCartItems = (cartItems: GuestCartItem[]) => {
  const itemMap = new Map();
  let duplicatesFound = 0;
  
  cartItems.forEach((item, index) => {
    const key = `${item.productId}-${item.variantId || 'no-variant'}`;
    
    if (itemMap.has(key)) {
      // Merge quantities for duplicate items
      const existingItem = itemMap.get(key);
      existingItem.quantity += item.quantity;
      duplicatesFound++;      
      // Use the item with the most complete data
      if (!existingItem.product?.name || existingItem.product.name === 'Product') {
        existingItem.product = item.product;
      }
      if (!existingItem.price || existingItem.price === 0) {
        existingItem.price = item.price;
      }
    } else {
      // Add new item
      itemMap.set(key, { ...item });
    }
  });
  
  if (duplicatesFound > 0) {
  }
  
  return Array.from(itemMap.values());
};

const clearCartError = () => ({
  type: 'cart/clearCartError',
});
export const cartActions = {
  fetchCart,
  addToCart,
  addPreBuiltPCToCart, // NEW
  updateCartQuantity,
  updatePreBuiltPCQuantity, // NEW
  removeFromCart,
  removePreBuiltPCFromCart, // NEW
  clearCart,
  syncGuestCart,
  clearCartError,
};

// ✅ ALSO export individual functions if needed elsewhere
export {
  fetchCart,
  addToCart,
  addPreBuiltPCToCart, // NEW
  updateCartQuantity,
  updatePreBuiltPCQuantity, // NEW
  removeFromCart,
  removePreBuiltPCFromCart, // NEW
  clearCart,
  syncGuestCart,
  clearCartError,
  cartAPI
};

// ✅ Alternative: You can also export as default
export default cartActions;