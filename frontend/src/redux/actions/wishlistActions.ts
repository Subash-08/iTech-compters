import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { 
  WishlistItem, 
  AddToWishlistData, 
  RemoveFromWishlistData, 
  CheckWishlistItemData 
} from '../types/wishlistTypes';

// API Calls
export const wishlistAPI = {
  // Get user wishlist
  getWishlist: async (): Promise<{ data: WishlistItem[] }> => {
    try {
      const response = await api.get('/wishlist');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch wishlist';
      throw new Error(errorMessage);
    }
  },

  // Add to wishlist
  addToWishlist: async (wishlistData: AddToWishlistData): Promise<{ data: WishlistItem[]; message: string }> => {
    try {
      const response = await api.post('/wishlist/add', wishlistData);
      toast.success('Product added to wishlist successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add product to wishlist';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (removeData: RemoveFromWishlistData): Promise<{ data: WishlistItem[]; message: string }> => {
    try {
      const response = await api.delete(`/wishlist/remove/${removeData.productId}`);
      toast.success('Product removed from wishlist successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove product from wishlist';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Check if item is in wishlist
  checkWishlistItem: async (checkData: CheckWishlistItemData): Promise<{ isInWishlist: boolean; message: string }> => {
    try {
      const response = await api.get(`/wishlist/check/${checkData.productId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to check wishlist item';
      throw new Error(errorMessage);
    }
  },

  // Clear wishlist
  clearWishlist: async (): Promise<{ message: string }> => {
    try {
      const response = await api.delete('/wishlist/clear');
      toast.success('Wishlist cleared successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to clear wishlist';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
};

export const fetchWishlist = () => async (dispatch: any) => {
  try {
    dispatch({ type: 'wishlist/fetchWishlistStart' });
    const response = await wishlistAPI.getWishlist();
    // The response might be { data: wishlistObject } or just wishlistObject
    const wishlistData = response.data || response;
    dispatch({
      type: 'wishlist/fetchWishlistSuccess',
      payload: wishlistData, // This should be the entire wishlist object
    });
  } catch (error: any) {
    dispatch({
      type: 'wishlist/fetchWishlistFailure',
      payload: error.message,
    });
  }
};
export const addToWishlist = (wishlistData: AddToWishlistData) => async (dispatch: any) => {
  try {
    dispatch({ type: 'wishlist/updateWishlistStart' });
    
    // ✅ OPTIMISTIC UPDATE - Add to Redux immediately
    dispatch({
      type: 'wishlist/addItemToWishlist',
      payload: {
        _id: `temp-${Date.now()}`,
        product: { _id: wishlistData.productId }, // Minimal product data
        addedAt: new Date().toISOString(),
      },
    });

    // API call
    const response = await api.post('/wishlist/add', wishlistData);
    
    // ✅ SUCCESS - Update with real data from backend
    dispatch({
      type: 'wishlist/updateWishlistSuccess',
      payload: response.data.data, // Use the populated wishlist from backend
    });

  } catch (error: any) {
    // ✅ ROLLBACK - Remove from Redux if API fails
    dispatch({
      type: 'wishlist/removeItemFromWishlist',
      payload: { productId: wishlistData.productId },
    });
    
    const errorMessage = error.response?.data?.message || 'Failed to add to wishlist';
    toast.error(errorMessage);
    dispatch({
      type: 'wishlist/updateWishlistFailure',
      payload: errorMessage,
    });
  }
};
// actions/wishlistActions.ts - UPDATE removeFromWishlist function
export const removeFromWishlist = (removeData: RemoveFromWishlistData) => async (dispatch: any) => {
  try {
    dispatch({ type: 'wishlist/updateWishlistStart' });
    
    // Optimistic update
    dispatch({
      type: 'wishlist/removeItemFromWishlist',
      payload: removeData,
    });

    // ✅ FIX: Use the correct endpoint - DELETE /wishlist/remove/:productId
    const response = await api.delete(`/wishlist/remove/${removeData.productId}`);
    
    dispatch({
      type: 'wishlist/updateWishlistSuccess',
      payload: response.data.data, // Use the populated wishlist from backend
    });

  } catch (error: any) {
    // On error, we need to refetch the wishlist to get correct state
    dispatch({
      type: 'wishlist/updateWishlistFailure',
      payload: error.message,
    });
    // Refetch wishlist to sync with server
    dispatch(fetchWishlist());
  }
};

export const checkWishlistItem = (checkData: CheckWishlistItemData) => async (dispatch: any) => {
  try {
    const response = await wishlistAPI.checkWishlistItem(checkData);
    dispatch({
      type: 'wishlist/checkWishlistItemSuccess',
      payload: {
        productId: checkData.productId,
        isInWishlist: response.isInWishlist,
      },
    });
  } catch (error: any) {
    console.error('Failed to check wishlist item:', error.message);
  }
};

export const batchCheckWishlistItems = (productIds: string[]) => async (dispatch: any) => {
  try {
    // Check each product individually
    const checkPromises = productIds.map(productId => 
      wishlistAPI.checkWishlistItem({ productId })
    );
    
    const results = await Promise.allSettled(checkPromises);
    
    const allInWishlist = results.every(result => 
      result.status === 'fulfilled' && result.value.isInWishlist
    );

    dispatch({
      type: 'wishlist/batchCheckWishlistItems',
      payload: {
        productIds,
        allInWishlist,
      },
    });
  } catch (error: any) {
    console.error('Failed to batch check wishlist items:', error.message);
  }
};

export const clearWishlist = () => async (dispatch: any) => {
  try {
    dispatch({ type: 'wishlist/updateWishlistStart' });
    await wishlistAPI.clearWishlist();
    dispatch({
      type: 'wishlist/clearWishlistSuccess',
    });
  } catch (error: any) {
    dispatch({
      type: 'wishlist/updateWishlistFailure',
      payload: error.message,
    });
  }
};

export const clearWishlistError = () => ({
  type: 'wishlist/clearWishlistError',
});

// Also export as an object for backward compatibility
export const wishlistActions = {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem,
  batchCheckWishlistItems,
  clearWishlist,
  clearWishlistError,
};