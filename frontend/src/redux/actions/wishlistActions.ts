// actions/wishlistActions.ts - FIX API RESPONSE HANDLING
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { localStorageUtils, GuestWishlistItem } from '../../components/utils/localStorage';
import { 
  WishlistItem, 
  AddToWishlistData, 
  RemoveFromWishlistData, 
  CheckWishlistItemData
} from '../types/wishlistTypes';
import { 
  fetchWishlistStart, 
  fetchWishlistSuccess, 
  fetchWishlistFailure,
  updateWishlistStart,
  updateWishlistSuccess,
  updateWishlistFailure,
  clearWishlistSuccess,
  checkWishlistItemSuccess,
  addItemToWishlist,
  removeItemFromWishlist,
  setGuestWishlist,
  syncWishlistStart,
  syncWishlistSuccess,
  syncWishlistFailure,
  setWishlistMode
} from '../slices/wishlistSlice';
const wishlistAPI = {
  getWishlist: async (): Promise<{ data: any }> => {
    try {
      const response = await api.get('/wishlist');
      return response.data;
    } catch (error: any) {// Handle 404 and other errors gracefully
      if (error.response?.status === 404 || error.response?.status === 401) {
        const guestWishlist = localStorageUtils.getGuestWishlist();
        const wishlistItems = guestWishlist.map(item => ({
          _id: `guest-${item.productId}`,
          product: { 
            _id: item.productId,
            name: 'Product', // Will be enriched later
            price: 0,
            images: [],
            slug: '',
            stock: 0
          },
          variant: item.variant,
          addedAt: item.addedAt,
          productType: item.productType || 'product'
        }));
        
        return {
          success: true,
          data: {
            items: wishlistItems,
            totalItems: wishlistItems.length,
            isGuest: true
          }
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch wishlist';
      throw new Error(errorMessage);
    }
  },

  addToWishlist: async (wishlistData: AddToWishlistData): Promise<{ data: any; message: string }> => {
    try {
      if (wishlistData.productType === 'prebuilt-pc') {
        throw new Error('Use addPreBuiltPCToWishlist for PreBuiltPC items');
      }
      
      const payload = {
        productId: wishlistData.productId,
        variant: wishlistData.variant
      };
      
      console.log('❤️ Wishlist API Payload:', payload);
      
      const response = await api.post('/wishlist/add', payload);
      toast.success(wishlistData.variant ? 'Product variant added to wishlist successfully' : 'Product added to wishlist successfully');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const guestWishlist = localStorageUtils.getGuestWishlist();
        
        // ✅ FIXED: Use proper unique ID for guest
        const itemId = wishlistData.variant?.variantId 
          ? `${wishlistData.productId}_${wishlistData.variant.variantId}` 
          : wishlistData.productId;
        
        const existingItem = guestWishlist.find(item => item.productId === itemId);

        let updatedWishlist: GuestWishlistItem[];
        if (existingItem) {
          updatedWishlist = guestWishlist;
          toast.info('Product already in wishlist');
        } else {
          const newItem: GuestWishlistItem = {
            productId: itemId,
            originalProductId: wishlistData.productId,
            variant: wishlistData.variant,
            productType: wishlistData.productType || 'product',
            addedAt: new Date().toISOString()
          };
          updatedWishlist = [...guestWishlist, newItem];
        }

        localStorageUtils.saveGuestWishlist(updatedWishlist);
        
        const wishlistItems = updatedWishlist.map(item => ({
          _id: `guest-${item.productId}`,
          product: { 
            _id: item.originalProductId || item.productId,
            name: 'Product',
            price: item.variant?.price || 0,
            images: [],
            slug: '',
            stock: item.variant?.stock || 0
          },
          variant: item.variant,
          addedAt: item.addedAt,
          productType: item.productType
        }));
        
        return {
          success: true,
          message: 'Product added to guest wishlist',
          data: {
            items: wishlistItems,
            totalItems: wishlistItems.length,
            isGuest: true
          }
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to add product to wishlist';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  addPreBuiltPCToWishlist: async (pcId: string): Promise<{ data: any; message: string }> => {
    try {
      const response = await api.post('/prebuilt-pc/add', { pcId });
      toast.success('Pre-built PC added to wishlist successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Failed to add PreBuiltPC:', error);
      
      if (error.response?.status === 401) {
        const guestWishlist = localStorageUtils.getGuestWishlist();
        const existingItem = guestWishlist.find(item => item.productId === pcId);

        if (!existingItem) {
          const newItem: GuestWishlistItem = {
            productId: pcId,
            productType: 'prebuilt-pc',
            addedAt: new Date().toISOString()
          };
          const updatedWishlist = [...guestWishlist, newItem];
          localStorageUtils.saveGuestWishlist(updatedWishlist);
          toast.success('Pre-built PC added to guest wishlist');
        } else {
          toast.info('Pre-built PC already in wishlist');
        }
        
        const wishlistItems = guestWishlist.map(item => ({
          _id: `guest-${item.productId}`,
          product: { 
            _id: item.productId,
            name: 'Pre-built PC',
            price: 0,
            images: [],
            slug: '',
            stock: 0
          },
          addedAt: item.addedAt,
          productType: item.productType
        }));
        
        return {
          success: true,
          message: 'Pre-built PC added to guest wishlist',
          data: {
            items: wishlistItems,
            totalItems: wishlistItems.length,
            isGuest: true
          }
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to add Pre-built PC to wishlist';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // ✅ FIXED: Remove from wishlist - use itemId (wishlist item ID)
  removeFromWishlist: async (itemId: string): Promise<{ data: any; message: string }> => {
    try {
      // ✅ CORRECT: Remove by wishlist item ID
      const response = await api.delete(`/wishlist/remove/${itemId}`);
      toast.success('Product removed from wishlist successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Remove from wishlist API error:', error);
      
      // Handle guest mode
      if (error.response?.status === 401 || error.response?.status === 404) {
        const guestWishlist = localStorageUtils.getGuestWishlist();
        const updatedWishlist = guestWishlist.filter(item => 
          // Remove by guest item ID
          `guest-${item.productId}` !== itemId && item.productId !== itemId.replace('guest-', '')
        );
        localStorageUtils.saveGuestWishlist(updatedWishlist);
        
        return {
          success: true,
          message: 'Product removed from guest wishlist',
          data: {
            items: updatedWishlist.map(item => ({
              _id: `guest-${item.productId}`,
              product: { 
                _id: item.originalProductId || item.productId,
                name: 'Product',
                price: 0,
                images: [],
                slug: '',
                stock: 0
              },
              variant: item.variant,
              addedAt: item.addedAt,
              productType: item.productType
            })),
            totalItems: updatedWishlist.length,
            isGuest: true
          }
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to remove product from wishlist';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  removePreBuiltPCFromWishlist: async (pcId: string): Promise<{ data: any; message: string }> => {
    try {
      const response = await api.delete(`/prebuilt-pc/remove/${pcId}`);
      toast.success('Pre-built PC removed from wishlist successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ PreBuiltPC removal API error:', error);
      
      if (error.response?.status === 401 || error.response?.status === 404) {
        const guestWishlist = localStorageUtils.getGuestWishlist();
        const updatedWishlist = guestWishlist.filter(item => item.productId !== pcId);
        localStorageUtils.saveGuestWishlist(updatedWishlist);
        
        return {
          success: true,
          message: 'Pre-built PC removed from guest wishlist',
          data: {
            items: updatedWishlist.map(item => ({
              _id: `guest-${item.productId}`,
              product: { 
                _id: item.productId,
                name: 'Pre-built PC',
                price: 0,
                images: [],
                slug: '',
                stock: 0
              },
              addedAt: item.addedAt,
              productType: item.productType
            })),
            totalItems: updatedWishlist.length,
            isGuest: true
          }
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to remove Pre-built PC from wishlist';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  checkWishlistItem: async (checkData: CheckWishlistItemData): Promise<{ isInWishlist: boolean }> => {
    try {
      const response = await api.get(`/wishlist/check/${checkData.productId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const isInWishlist = localStorageUtils.isInGuestWishlist(checkData.productId);
        return { isInWishlist };
      }
      throw new Error(error.response?.data?.message || 'Failed to check wishlist item');
    }
  },

  clearWishlist: async (): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const response = await api.delete('/wishlist/clear');
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to clear wishlist';
      throw new Error(errorMessage);
    }
  },

  syncGuestWishlist: async (guestWishlistItems: GuestWishlistItem[]): Promise<{ data: any; message: string }> => {
    try {
      const response = await api.post('/wishlist/sync-guest', { 
        guestWishlistItems 
      });
      toast.success(`Synced ${guestWishlistItems.length} items to your wishlist`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to sync wishlist';
      throw new Error(errorMessage);
    }
  },
};

// FIXED: Convert guest wishlist to Redux format
const convertGuestWishlistToRedux = (guestWishlist: GuestWishlistItem[]): WishlistItem[] => {
  return guestWishlist.map(item => ({
    _id: `guest-${item.productId}`,
    product: { _id: item.productId },
    addedAt: item.addedAt,
    productType: item.productType || 'product' // 🛑 ADD THIS
  }));
};


// redux/actions/wishlistActions.ts - FIXED extractItemsFromResponse
const extractItemsFromResponse = (response: any): { items: WishlistItem[], isGuest: boolean } => {  
  if (!response) {
    return { items: [], isGuest: false };
  }

  let items: WishlistItem[] = [];
  let isGuest = false;
  if (response.data && Array.isArray(response.data.items)) {
    // Direct items array in data
    items = processWishlistItems(response.data.items);
    isGuest = response.data.isGuest || false;
  } 
  else if (response.data && response.data.data && Array.isArray(response.data.data.items)) {
    // Nested data structure
    items = processWishlistItems(response.data.data.items);
    isGuest = response.data.data?.isGuest || false;
  }
  else if (response.data && Array.isArray(response.data)) {
    // Direct array response
    items = processWishlistItems(response.data);
    isGuest = false;
  }
  else if (response.success && response.data && Array.isArray(response.data.items)) {
    // Success response with items
    items = processWishlistItems(response.data.items);
    isGuest = response.data?.isGuest || false;
  }
  else if (response.data && response.data.wishlist && Array.isArray(response.data.wishlist.items)) {
    // Wishlist object response
    items = processWishlistItems(response.data.wishlist.items);
    isGuest = response.data.wishlist?.isGuest || false;
  }
  else {
    console.warn('❌ Unknown response structure:', response);
  }

  // 🛑 CRITICAL FIX: Check if Pre-built PC items need enrichment
  const prebuiltPCItems = items.filter(item => 
    item.productType === 'prebuilt-pc' && 
    (!item.product?.name || item.product.name === 'Pre-built PC')
  );
  
  return { items, isGuest };
};

// Enhanced processWishlistItems function
const processWishlistItems = (items: any[]): WishlistItem[] => {
  return items.map((item: any) => {
    // 🛑 BETTER DETECTION: Check for preBuiltPC field or productType
    if (item.productType === 'prebuilt-pc' || item.preBuiltPC) {
      return createPreBuiltPCWishlistItem(item);
    }
    
    // Handle regular product items
    return createProductWishlistItem(item);
  });
};

// FIXED: Enhanced Pre-built PC item creation
const createPreBuiltPCWishlistItem = (item: any): WishlistItem => {
  const preBuiltPC = item.preBuiltPC;
  if (preBuiltPC && typeof preBuiltPC === 'object' && preBuiltPC._id && preBuiltPC.name && preBuiltPC.name !== 'Pre-built PC') {
    return {
      _id: item._id,
      product: {
        _id: preBuiltPC._id,
        name: preBuiltPC.name,
        slug: preBuiltPC.slug,
        basePrice: preBuiltPC.basePrice || preBuiltPC.totalPrice || 0,
        offerPrice: preBuiltPC.offerPrice || preBuiltPC.discountPrice || preBuiltPC.totalPrice || 0,
        discountPercentage: preBuiltPC.discountPercentage || 0,
        stockQuantity: preBuiltPC.stockQuantity || 0,
        images: preBuiltPC.images || getDefaultPCImages(),
        averageRating: preBuiltPC.averageRating || 0,
        totalReviews: preBuiltPC.totalReviews || 0,
        condition: preBuiltPC.condition || 'New',
        isActive: preBuiltPC.isActive !== false,
        performanceRating: preBuiltPC.performanceRating,
        category: preBuiltPC.category
      },
      productType: 'prebuilt-pc',
      addedAt: item.addedAt,
      preBuiltPC: preBuiltPC
    };
  }
  
  // 🛑 FIX: If preBuiltPC is just an ID string (not populated)
  if (preBuiltPC && typeof preBuiltPC === 'string') {
    return {
      _id: item._id,
      product: {
        _id: preBuiltPC,
        name: 'Pre-built PC', // Placeholder - will be enriched
        slug: 'prebuilt-pc',
        basePrice: 0,
        offerPrice: 0,
        discountPercentage: 0,
        stockQuantity: 0,
        images: getDefaultPCImages(),
        averageRating: 0,
        totalReviews: 0,
        condition: 'New',
        isActive: true
      },
      productType: 'prebuilt-pc',
      addedAt: item.addedAt,
      preBuiltPC: preBuiltPC // Store the ID for enrichment
    };
  }
  
  // 🛑 FIX: If preBuiltPC exists but has placeholder data
  if (preBuiltPC && preBuiltPC.name === 'Pre-built PC') {
    return {
      _id: item._id,
      product: {
        _id: preBuiltPC._id,
        name: 'Pre-built PC', // Placeholder - will be enriched
        slug: 'prebuilt-pc',
        basePrice: 0,
        offerPrice: 0,
        discountPercentage: 0,
        stockQuantity: 0,
        images: getDefaultPCImages(),
        averageRating: 0,
        totalReviews: 0,
        condition: 'New',
        isActive: true
      },
      productType: 'prebuilt-pc',
      addedAt: item.addedAt,
      preBuiltPC: preBuiltPC._id // Store the ID for enrichment
    };
  }
  
  // Fallback
  console.warn('❌ Pre-built PC fallback for item:', item);
  return {
    ...item,
    productType: 'prebuilt-pc',
    product: item.product || {
      _id: item._id || `pc-${Date.now()}`,
      name: 'Pre-built PC',
      images: getDefaultPCImages(),
      basePrice: 0,
      offerPrice: 0
    }
  };
};



// Create regular product wishlist item
const createProductWishlistItem = (item: any): WishlistItem => {
  return {
    ...item,
    productType: item.productType || 'product',
    product: item.product || {
      _id: item.productId || item._id,
      name: 'Product',
      images: { thumbnail: { url: '/uploads/default-product.jpg' } },
      basePrice: 0,
      offerPrice: 0
    }
  };
};

// Default images for Pre-built PCs
const getDefaultPCImages = () => ({
  thumbnail: {
    url: '/uploads/default-pc.jpg',
    altText: 'Pre-built Computer'
  },
  hoverImage: {
    url: '/uploads/default-pc.jpg', 
    altText: 'Pre-built Computer'
  },
  gallery: [
    {
      url: '/uploads/default-pc.jpg',
      altText: 'Pre-built Computer'
    }
  ]
});

// SYNC LOCK - Following your cart pattern
let wishlistSyncInProgress = false;


// 🆕 ADD THIS FUNCTION - Enrich guest wishlist items with product data
const enrichGuestWishlistItems = async (guestItems: WishlistItem[]): Promise<WishlistItem[]> => {
  try {
    const enrichedItems = await Promise.all(
      guestItems.map(async (item) => {
        try {
          const productId = item.product?._id;
          
          if (!productId) return item;

          // Fetch product details based on product type
          if (item.productType === 'prebuilt-pc') {
            // Fetch Pre-built PC details
            const response = await api.get(`/prebuilt-pcs/${productId}`);
            if (response.data.success && response.data.data) {
              const pcData = response.data.data;
              return {
                ...item,
                product: {
                  _id: pcData._id,
                  name: pcData.name,
                  slug: pcData.slug,
                  basePrice: pcData.basePrice || pcData.totalPrice || 0,
                  offerPrice: pcData.offerPrice || pcData.discountPrice || pcData.totalPrice || 0,
                  discountPercentage: pcData.discountPercentage || 0,
                  stockQuantity: pcData.stockQuantity || 0,
                  images: pcData.images || getDefaultPCImages(),
                  averageRating: pcData.averageRating || 0,
                  totalReviews: pcData.totalReviews || 0,
                  condition: pcData.condition || 'New',
                  isActive: pcData.isActive !== false,
                  performanceRating: pcData.performanceRating,
                  category: pcData.category
                },
                preBuiltPC: pcData
              };
            }
          } else {
            // Fetch regular product details
            const response = await api.get(`/products/${productId}`);
            if (response.data.success && response.data.data) {
              const productData = response.data.data;
              return {
                ...item,
                product: productData
              };
            }
          }
        } catch (error) {
          console.warn(`❌ Could not fetch details for product ${item.product?._id}:`, error);
          // Return the item with basic info if fetch fails
          return {
            ...item,
            product: {
              _id: item.product?._id || 'unknown',
              name: 'Product Not Available',
              images: { thumbnail: { url: '/uploads/default-product.jpg' } },
              basePrice: 0,
              offerPrice: 0,
              slug: 'product-not-available'
            }
          };
        }
        
        return item;
      })
    );
    
    return enrichedItems;
  } catch (error) {
    console.error('Error enriching guest wishlist items:', error);
    return guestItems; // Return original items if enrichment fails
  }
};


// ENHANCED: Helper function to enrich PreBuiltPC items with product data
const enrichPreBuiltPCItems = async (prebuiltPCItems: WishlistItem[]): Promise<WishlistItem[]> => {
  try {
    const enrichedItems = await Promise.all(
      prebuiltPCItems.map(async (item) => {
        try {
          const pcId = item.preBuiltPC as string || item.product?._id;
          
          if (!pcId || typeof pcId !== 'string') {
            console.warn('❌ No valid PC ID found for item:', item);
            return createFallbackPCItem(item);
          }

          // Fetch Pre-built PC details
          const response = await api.get(`/prebuilt-pcs/${pcId}`);
          
          if (response.data.success && response.data.data) {
            const pcData = response.data.data;
            return createEnrichedPCItem(item, pcData);
          } else {
            console.warn('❌ No PC data found for ID:', pcId);
            return createFallbackPCItem(item, pcId);
          }
        } catch (error) {
          return createFallbackPCItem(item);
        }
      })
    );
    
    return enrichedItems;
  } catch (error) {
    console.error('Error enriching PreBuiltPC items:', error);
    return prebuiltPCItems;
  }
};

// Create enriched PC item with full data
const createEnrichedPCItem = (originalItem: WishlistItem, pcData: any): WishlistItem => {
  return {
    ...originalItem,
    product: {
      _id: pcData._id,
      name: pcData.name || 'Pre-built PC',
      slug: pcData.slug || 'prebuilt-pc',
      basePrice: pcData.basePrice || pcData.totalPrice || 0,
      offerPrice: pcData.offerPrice || pcData.discountPrice || pcData.totalPrice || 0,
      discountPercentage: pcData.discountPercentage || 0,
      stockQuantity: pcData.stockQuantity || pcData.quantity || 0,
      images: pcData.images || getDefaultPCImages(),
      averageRating: pcData.averageRating || pcData.rating || 0,
      totalReviews: pcData.totalReviews || pcData.reviewCount || 0,
      condition: pcData.condition || 'New',
      isActive: pcData.isActive !== false,
      // Pre-built PC specific fields
      performanceRating: pcData.performanceRating,
      category: pcData.category,
      specifications: pcData.specifications,
      brand: pcData.brand
    },
    preBuiltPC: pcData // Replace ID with full object
  };
};

// Create fallback PC item when data can't be fetched
const createFallbackPCItem = (originalItem: WishlistItem, pcId?: string): WishlistItem => {
  const id = pcId || originalItem.preBuiltPC as string || originalItem.product?._id || `unknown-pc-${Date.now()}`;
  
  return {
    ...originalItem,
    product: {
      _id: id,
      name: 'Pre-built PC',
      slug: 'prebuilt-pc',
      basePrice: 0,
      offerPrice: 0,
      discountPercentage: 0,
      stockQuantity: 0,
      images: getDefaultPCImages(),
      averageRating: 0,
      totalReviews: 0,
      condition: 'New',
      isActive: true
    },
    preBuiltPC: id
  };
};
// redux/actions/wishlistActions.ts - FIXED ID HANDLING

const addToWishlist = (wishlistData: AddToWishlistData) => async (dispatch: any, getState: any) => {
    try {
        dispatch(updateWishlistStart());
        
        const state = getState();
        const isGuest = !state.authState.isAuthenticated;
        
        // FIXED: Use productId directly, not combined ID for API calls
        const productId = wishlistData.productId;

        console.log('❤️ Adding to wishlist - Product ID:', productId, 'Variant:', wishlistData.variant);

        if (wishlistData.productType === 'prebuilt-pc') {
            // Pre-built PC logic (unchanged)
            if (isGuest) {
                localStorageUtils.addToGuestWishlist(productId, 'prebuilt-pc');
                const newItem: WishlistItem = {
                    _id: `guest-${productId}`,
                    product: { _id: wishlistData.productId },
                    addedAt: new Date().toISOString(),
                    productType: 'prebuilt-pc'
                };
                dispatch(addItemToWishlist(newItem));
                toast.success('Pre-built PC added to wishlist');
                return;
            } else {
                const optimisticItem: WishlistItem = {
                    _id: `temp-${Date.now()}`,
                    product: { _id: wishlistData.productId },
                    addedAt: new Date().toISOString(),
                    productType: 'prebuilt-pc'
                };
                dispatch(addItemToWishlist(optimisticItem));

                try {
                    const response = await wishlistAPI.addPreBuiltPCToWishlist(wishlistData.productId);
                    const { items, isGuest: isGuestMode } = extractItemsFromResponse(response);
                    dispatch(updateWishlistSuccess({ items, isGuest: isGuestMode }));
                    toast.success('Pre-built PC added to wishlist');
                } catch (apiError: any) {
                    console.error('❌ Pre-built PC API error:', apiError);
                    dispatch(removeItemFromWishlist({ productId: productId }));
                    throw apiError;
                }
                return;
            }
        }
        
        // Regular product flow - FIXED: Use productId directly
        if (isGuest) {
            // FIXED: For guest, create proper unique ID with variant
            const guestItemId = wishlistData.variant?.variantId 
                ? `${wishlistData.productId}_${wishlistData.variant.variantId}` 
                : wishlistData.productId;
                
            localStorageUtils.addToGuestWishlist(guestItemId, 'product');
            const newItem: WishlistItem = {
                _id: `guest-${guestItemId}`,
                product: { 
                    _id: wishlistData.productId,
                    name: 'Product', // Will be populated when fetched
                    price: wishlistData.variant?.price || 0,
                    images: [],
                    slug: '',
                    stock: wishlistData.variant?.stock || 0
                },
                variant: wishlistData.variant,
                addedAt: new Date().toISOString(),
                productType: 'product'
            };
            dispatch(addItemToWishlist(newItem));
            toast.success(wishlistData.variant ? 'Product variant added to wishlist' : 'Product added to wishlist');
        } else {
            // FIXED: For authenticated users, use simple optimistic item
            const optimisticItem: WishlistItem = {
                _id: `temp-${Date.now()}`,
                product: { 
                    _id: wishlistData.productId,
                    name: 'Loading...',
                    price: wishlistData.variant?.price || 0,
                    images: [],
                    slug: '',
                    stock: wishlistData.variant?.stock || 0
                },
                variant: wishlistData.variant,
                addedAt: new Date().toISOString(),
                productType: 'product'
            };
            dispatch(addItemToWishlist(optimisticItem));

            try {
                // FIXED: Send proper payload to API
                const apiPayload = {
                    productId: wishlistData.productId, // Send original productId
                    variant: wishlistData.variant
                };
                
                console.log('❤️ Sending to wishlist API:', apiPayload);
                
                const response = await wishlistAPI.addToWishlist(apiPayload);
                const { items, isGuest: isGuestMode } = extractItemsFromResponse(response);
                
                console.log('❤️ Wishlist API response items:', items);
                
                dispatch(updateWishlistSuccess({ items, isGuest: isGuestMode }));
                toast.success(wishlistData.variant ? 'Product variant added to wishlist' : 'Product added to wishlist');
            } catch (apiError: any) {
                console.error('❌ Regular Product API error:', apiError);
                // FIXED: Remove by productId, not combined ID
                dispatch(removeItemFromWishlist({ productId: wishlistData.productId }));
                throw apiError;
            }
        }
        
    } catch (error: any) {
        console.error('❌ addToWishlist error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to add to wishlist';
        toast.error(errorMessage);
        dispatch(updateWishlistFailure(error.message));
    }
};



// Check wishlist item with guest support
const checkWishlistItem = (checkData: CheckWishlistItemData) => async (dispatch: any, getState: any) => {
  const state = getState();
  const isGuest = !state.authState.isAuthenticated;
  
  if (isGuest) {
    // Guest user - check localStorage
    const isInWishlist = localStorageUtils.isInGuestWishlist(checkData.productId);
    dispatch(checkWishlistItemSuccess({
      productId: checkData.productId,
      isInWishlist
    }));
  } else {
    // Authenticated user - call API
    try {
      const response = await wishlistAPI.checkWishlistItem(checkData);
      dispatch(checkWishlistItemSuccess({
        productId: checkData.productId,
        isInWishlist: response.isInWishlist
      }));
    } catch (error: any) {
      console.error('Failed to check wishlist item:', error.message);
    }
  }
};

// FIXED: Batch check wishlist items
const batchCheckWishlistItems = (productIds: string[]) => async (dispatch: any) => {
  try {
    const checkPromises = productIds.map(productId => 
      wishlistAPI.checkWishlistItem({ productId })
    );
    
    const results = await Promise.allSettled(checkPromises);
    
    // Process results and update checkedItems
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        dispatch(checkWishlistItemSuccess({
          productId: productIds[index],
          isInWishlist: result.value.isInWishlist
        }));
      }
    });

  } catch (error: any) {
    console.error('Failed to batch check wishlist items:', error.message);
  }
};
// ✅ FIXED: Enhanced fetchWishlist function
const fetchWishlist = () => async (dispatch: any, getState: any) => {
  try {
    dispatch(fetchWishlistStart());
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;    
    let items: WishlistItem[] = [];
    let isGuestMode = isGuest;
        
    if (isGuest) {
      // Guest user - get from localStorage and enrich
      const guestWishlist = localStorageUtils.getGuestWishlist();
      const guestItems: WishlistItem[] = guestWishlist.map(item => ({
        _id: `guest-${item.productId}`,
        product: { 
          _id: item.originalProductId || item.productId,
          name: 'Product',
          price: item.variant?.price || 0,
          images: [],
          slug: '',
          stock: item.variant?.stock || 0
        },
        variant: item.variant,
        addedAt: item.addedAt,
        productType: item.productType || 'product'
      }));
      
      items = await enrichGuestWishlistItems(guestItems);
      isGuestMode = true;
      
    } else {
      try {
        // Authenticated user - get data from API
        const response = await wishlistAPI.getWishlist();        
        if (response) {
          const extracted = extractItemsFromResponse(response);
          items = extracted.items || [];
          isGuestMode = extracted.isGuest || false;
          
          // Enrich Pre-built PC items if needed
          const prebuiltPCItemsToEnrich = items.filter(item => 
            item.productType === 'prebuilt-pc' && 
            (!item.product?.name || item.product.name === 'Pre-built PC')
          );
          
          if (prebuiltPCItemsToEnrich.length > 0) {
            const enrichedPrebuiltPCItems = await enrichPreBuiltPCItems(prebuiltPCItemsToEnrich);
            const otherItems = items.filter(item => 
              item.productType !== 'prebuilt-pc' || 
              (item.product?.name && item.product.name !== 'Pre-built PC')
            );
            items = [...otherItems, ...enrichedPrebuiltPCItems];
          }
        }
      } catch (apiError) {
        console.error('❌ API failed, using localStorage as fallback:', apiError);
        // Fallback to guest mode
        const guestWishlist = localStorageUtils.getGuestWishlist();
        const guestItems: WishlistItem[] = guestWishlist.map(item => ({
          _id: `guest-${item.productId}`,
          product: { 
            _id: item.originalProductId || item.productId,
            name: 'Product',
            price: 0,
            images: [],
            slug: '',
            stock: 0
          },
          variant: item.variant,
          addedAt: item.addedAt,
          productType: item.productType || 'product'
        }));
        items = await enrichGuestWishlistItems(guestItems);
        isGuestMode = true;
      }
    }
    
    const payload = {
      items: Array.isArray(items) ? items : [],
      isGuest: Boolean(isGuestMode)
    };
    
    dispatch(fetchWishlistSuccess(payload));
    
  } catch (error: any) {
    console.error('❌ Fetch wishlist error:', error);
    
    const fallbackPayload = {
      items: [],
      isGuest: true
    };
    
    dispatch(fetchWishlistSuccess(fallbackPayload));
    dispatch(fetchWishlistFailure(error.message));
  }
};

// redux/actions/wishlistActions.ts - FIXED
const removeFromWishlist = (removeData: RemoveFromWishlistData) => async (dispatch: any, getState: any) => {
    try {
        dispatch(updateWishlistStart());
        
        const state = getState();
        const isGuest = !state.authState.isAuthenticated;
        
        console.log('🗑️ Removing product from wishlist:', removeData.productId, 'Type:', removeData.productType);

        // ✅ FIXED: Remove from Redux state using productId
        dispatch(removeItemFromWishlist({ productId: removeData.productId }));

        if (isGuest) {
            // For guest, remove from localStorage using productId
            localStorageUtils.removeFromGuestWishlist(removeData.productId);
            toast.success('Item removed from wishlist');
        } else {
            // ✅ FIXED: Use different API endpoints based on product type
            if (removeData.productType === 'prebuilt-pc') {
                await wishlistAPI.removePreBuiltPCFromWishlist(removeData.productId);
            } else {
                await wishlistAPI.removeFromWishlist(removeData.productId);
            }
            toast.success('Item removed from wishlist');
        }
        
    } catch (error: any) {
        console.error('❌ removeFromWishlist error:', error);
        
        // Re-fetch wishlist to restore state on error
        await dispatch(fetchWishlist());
        
        const errorMessage = error.response?.data?.message || 'Failed to remove from wishlist';
        toast.error(errorMessage);
        dispatch(updateWishlistFailure(error.message));
    }
};

// ✅ FIXED: Clear wishlist action
const clearWishlist = () => async (dispatch: any, getState: any) => {
  try {
    dispatch(updateWishlistStart());
    
    const state = getState();
    const isGuest = !state.authState.isAuthenticated;    
    
    if (isGuest) {
      localStorageUtils.clearGuestWishlist();
      dispatch(clearWishlistSuccess());
      toast.success('Wishlist cleared successfully');
    } else {
      const response = await wishlistAPI.clearWishlist();
      if (response.success) {
        dispatch(clearWishlistSuccess());
        toast.success('Wishlist cleared successfully');
      } else {
        throw new Error(response.message || 'Failed to clear wishlist');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Clear wishlist error:', error);
    
    // Even on error, clear local state as fallback
    dispatch(clearWishlistSuccess());
    
    if (error.response?.status !== 404) {
      toast.error(error.message || 'Failed to clear wishlist');
    } else {
      toast.success('Wishlist cleared successfully');
    }
  }
};
// redux/actions/wishlistActions.ts - UPDATE syncGuestWishlist
const syncGuestWishlist = () => async (dispatch: any, getState: any) => {
  if (wishlistSyncInProgress) return;
  wishlistSyncInProgress = true;
  
  try {
    dispatch(syncWishlistStart());
    
    const guestWishlist = localStorageUtils.getGuestWishlist();
    const currentUser = getState().authState.user?._id;
    if (guestWishlist.length > 0) {
      // Separate regular products from PreBuiltPC items
      const regularProducts = guestWishlist.filter(item => 
        item.productType === 'product' || !item.productType
      );
      const prebuiltPCs = guestWishlist.filter(item => 
        item.productType === 'prebuilt-pc'
      );

      let addedCount = 0;
      const errors: string[] = [];
      // Sync regular products to backend
      for (const item of regularProducts) {
        try {
          await wishlistAPI.addToWishlist({ productId: item.productId });
          addedCount++;
        } catch (error: any) {
          errors.push(`Product ${item.productId}: ${error.message}`);
        }
      }

      // 🎯 SYNC PREBUILT-PC ITEMS USING THE CORRECT ENDPOINT
      for (const item of prebuiltPCs) {
        try {
          await wishlistAPI.addPreBuiltPCToWishlist(item.productId);
          addedCount++;
        } catch (error: any) {
          errors.push(`Pre-built PC ${item.productId}: ${error.message}`);
        }
      }

      // Clear guest wishlist only after successful sync
      localStorageUtils.clearGuestWishlist();
      localStorageUtils.setLastSyncedUser(currentUser);
      
      // Fetch updated wishlist
      await dispatch(fetchWishlist());
      
      // Show appropriate messages
      if (addedCount > 0) {
        toast.success(`Synced ${addedCount} item${addedCount > 1 ? 's' : ''} to your wishlist!`);
      }
      
      if (errors.length > 0) {
        console.warn('Sync errors:', errors);
        toast.warning(`Some items could not be synced`);
      }
      
    } else {
      localStorageUtils.clearGuestWishlist();
    }
    
  } catch (error: any) {
    console.error('❌ Failed to sync guest wishlist:', error);
    dispatch(syncWishlistFailure(error.message));
    toast.error('Failed to sync wishlist. Please try again.');
  } finally {
    wishlistSyncInProgress = false;
  }
};

// Clear wishlist error
const clearWishlistError = () => (dispatch: any) => {
  dispatch(clearWishlistError());
};
export {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist, // ✅ Make sure this is exported
  checkWishlistItem,
  batchCheckWishlistItems,
  clearWishlist,
  clearWishlistError,
  syncGuestWishlist,
  wishlistAPI
};

// ✅ THEN export as actions object
export const wishlistActions = {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist, // ✅ Make sure this is here too
  checkWishlistItem,
  batchCheckWishlistItems,
  clearWishlist,
  clearWishlistError,
  syncGuestWishlist,
};

export default wishlistActions;