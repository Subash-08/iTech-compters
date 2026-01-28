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
    
    const response = await api.post('/wishlist/add', payload);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      const guestWishlist = localStorageUtils.getGuestWishlist();
      
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
          addedAt: new Date().toISOString(),
          // ✅ SAVE PRODUCT DATA IN GUEST WISHLIST
          productData: wishlistData.product ? {
            _id: wishlistData.product._id || wishlistData.productId,
            name: wishlistData.product.name || 'Product',
            images: wishlistData.product.images || [],
            price: wishlistData.variant?.price || wishlistData.product.effectivePrice || 0,
            slug: wishlistData.product.slug || '',
            stock: wishlistData.variant?.stock || wishlistData.product.stockQuantity || 0,
            brand: wishlistData.product.brand,
            condition: wishlistData.product.condition
          } : undefined
        };
        updatedWishlist = [...guestWishlist, newItem];
      }

      localStorageUtils.saveGuestWishlist(updatedWishlist);
      
      // ✅ CREATE WISHLIST ITEMS WITH FULL PRODUCT DATA
      const wishlistItems = updatedWishlist.map(item => {
        const productData = item.productData || {
          _id: item.originalProductId || item.productId,
          name: 'Product',
          price: item.variant?.price || 0,
          images: [],
          slug: '',
          stock: item.variant?.stock || 0
        };
        
        return {
          _id: `guest-${item.productId}`,
          product: productData,
          variant: item.variant,
          addedAt: item.addedAt,
          productType: item.productType
        };
      });
      
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
          toast.success('Pre-built PC added to guest wishlist', { toastId: 'prebuild-wishlist-1' });
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
      toast.success('Pre-built PC removed from wishlist successfully', { toastId: 'prebuild-wishlist-removed' });
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
      images: { thumbnail: { url: '' } },
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


// In wishlistActions.ts - FIX the enrichGuestWishlistItems function
const enrichGuestWishlistItems = async (guestItems: WishlistItem[]): Promise<WishlistItem[]> => {
  try {
    // ✅ CHECK: Skip enrichment for guest items that already have product data
    const itemsThatNeedEnrichment = guestItems.filter(item => {
      // Check if item already has proper product data
      const hasProperProductData = item.product && 
                                  item.product.name && 
                                  item.product.name !== 'Product' && 
                                  item.product.name !== 'Product Not Available';
      
      // Only enrich if missing proper data
      return !hasProperProductData;
    });
    
    // If all items already have data, return them as-is
    if (itemsThatNeedEnrichment.length === 0) {
      return guestItems;
    }
    
    const enrichedItems = await Promise.all(
      itemsThatNeedEnrichment.map(async (item) => {
        try {
          // Extract original product ID (not combined ID)
          let productId = item.product?._id;
          
          // If it's a guest item with combined ID, extract just the product ID
          if (item._id.startsWith('guest-') && productId && productId.includes('_')) {
            productId = productId.split('_')[0];
          }
          
          if (!productId) return item;

          // Fetch product details - BUT ONLY FOR AUTHENTICATED USERS
          // Guest items should already have product data saved
          if (item.productType === 'prebuilt-pc') {
            // Skip API call for guest Pre-built PCs
            return {
              ...item,
              product: {
                ...item.product,
                name: item.product.name || 'Pre-built PC',
                images: item.product.images || getDefaultPCImages()
              }
            };
          } else {
            // Skip API call for guest products - they should have data
            return {
              ...item,
              product: {
                ...item.product,
                name: item.product.name || 'Product',
                images: item.product.images || { thumbnail: { url: '/images/placeholder-product.jpg' } }
              }
            };
          }
        } catch (error) {
          console.warn(`❌ Could not enrich product ${item.product?._id}:`, error);
          // Return the item with basic info if enrichment fails
          return item;
        }
      })
    );
    
    // Merge enriched items back with items that didn't need enrichment
    const itemsThatDidntNeedEnrichment = guestItems.filter(item => {
      const hasProperProductData = item.product && 
                                  item.product.name && 
                                  item.product.name !== 'Product' && 
                                  item.product.name !== 'Product Not Available';
      return hasProperProductData;
    });
    
    return [...itemsThatDidntNeedEnrichment, ...enrichedItems];
    
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
const addToWishlist = (wishlistData: AddToWishlistData) => async (dispatch: any, getState: any) => {
    try {
      
        dispatch(updateWishlistStart());
        
        const state = getState();
        const isGuest = !state.authState.isAuthenticated;
        
        // FIXED: Use productId directly, not combined ID for API calls
        const productId = wishlistData.productId;
        
        if (wishlistData.productType === 'prebuilt-pc') {
            // Pre-built PC logic (unchanged except for saving product data)
            if (isGuest) {
                const guestItemId = productId;
                
                // ✅ FIXED: Create proper product data for Pre-built PC
                const pcProductData = wishlistData.product ? {
                    _id: wishlistData.product._id || productId,
                    name: wishlistData.product.name || 'Pre-built PC',
                    images: wishlistData.product.images || [],
                    price: wishlistData.product.totalPrice || wishlistData.product.basePrice || 0,
                    slug: wishlistData.product.slug || '',
                    stock: wishlistData.product.stockQuantity || 0,
                    category: wishlistData.product.category,
                    specifications: wishlistData.product.specifications
                } : {
                    _id: productId,
                    name: 'Pre-built PC',
                    images: [],
                    price: 0,
                    slug: '',
                    stock: 0
                };
                
                // ✅ FIXED: Pass product data to localStorage
                localStorageUtils.addToGuestWishlist(
                    guestItemId, 
                    'prebuilt-pc',
                    undefined, // No variant for Pre-built PCs
                    pcProductData, // ✅ PASS PRODUCT DATA
                    undefined // No variant
                );
                
                const newItem: WishlistItem = {
                    _id: `guest-${guestItemId}`,
                    product: pcProductData, // ✅ USE FULL PRODUCT DATA
                    addedAt: new Date().toISOString(),
                    productType: 'prebuilt-pc'
                };
                
                dispatch(addItemToWishlist(newItem));
                return;
            } else {
                // ... rest of authenticated Pre-built PC logic
            }
        }
        
        // Regular product logic
        if (isGuest) {
            const guestItemId = wishlistData.variant?.variantId 
                ? `${wishlistData.productId}_${wishlistData.variant.variantId}` 
                : wishlistData.productId;
            
            // ✅ CREATE PROPER PRODUCT DATA FOR GUEST
            const productData = wishlistData.product ? {
                _id: wishlistData.product._id || wishlistData.productId,
                name: wishlistData.product.name || 'Product',
                images: wishlistData.product.images || [],
                price: wishlistData.variant?.price || wishlistData.product.effectivePrice || 0,
                slug: wishlistData.product.slug || '',
                stock: wishlistData.variant?.stock || wishlistData.product.stockQuantity || 0,
                brand: wishlistData.product.brand,
                condition: wishlistData.product.condition,
                mrp: wishlistData.product.mrp
            } : {
                _id: wishlistData.productId,
                name: 'Product',
                images: [],
                price: wishlistData.variant?.price || 0,
                slug: '',
                stock: wishlistData.variant?.stock || 0
            };
            
            // ✅ FIXED: Pass ALL data to localStorage
            localStorageUtils.addToGuestWishlist(
                guestItemId, 
                'product',
                wishlistData.variant?.variantId,
                productData, // ✅ PASS PRODUCT DATA
                wishlistData.variant // ✅ PASS VARIANT DATA
            );
            
            const newItem: WishlistItem = {
                _id: `guest-${guestItemId}`,
                product: productData, // ✅ USE FULL PRODUCT DATA
                variant: wishlistData.variant,
                addedAt: new Date().toISOString(),
                productType: 'product'
            };
            
            dispatch(addItemToWishlist(newItem));
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
                                
                const response = await wishlistAPI.addToWishlist(apiPayload);
                const { items, isGuest: isGuestMode } = extractItemsFromResponse(response);
                                
                dispatch(updateWishlistSuccess({ items, isGuest: isGuestMode }));
            } catch (apiError: any) {
                console.error('❌ Regular Product API error:', apiError);
                // FIXED: Remove by productId, not combined ID
                dispatch(removeItemFromWishlist({ productId: wishlistData.productId }));
                throw apiError;
            }
        }
        // In wishlistActions.ts - Add to addToWishlist action


if (wishlistData.productType === 'prebuilt-pc' && isGuest) {
 
  // Call the new save function
  localStorageUtils.saveCompleteWishlistItem({
    productId: wishlistData.productId,
    productType: 'prebuilt-pc',
    productData: pcProductData,
    addedAt: new Date().toISOString()
  });
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
  // Guest user - get from localStorage
  const guestWishlist = localStorageUtils.getGuestWishlist();
  
  // Convert to WishlistItem format
  items = guestWishlist.map(item => {
    let productData;
    
    if (item.productType === 'prebuilt-pc' && item.productData) {
      // Handle Pre-built PC
      productData = {
        _id: item.productData._id || item.productId,
        name: item.productData.name || 'Pre-built PC',
        slug: item.productData.slug || 'prebuilt-pc',
        basePrice: item.productData.basePrice || item.productData.totalPrice || 0,
        offerPrice: item.productData.offerPrice || item.productData.discountPrice || item.productData.totalPrice || 0,
        discountPercentage: item.productData.discountPercentage || 0,
        stockQuantity: item.productData.stockQuantity || 0,
        images: item.productData.images || getDefaultPCImages(),
        averageRating: item.productData.averageRating || 0,
        totalReviews: item.productData.totalReviews || 0,
        condition: item.productData.condition || 'New',
        isActive: item.productData.isActive !== false,
        // Pre-built PC specific fields
        performanceRating: item.productData.performanceRating,
        category: item.productData.category,
        totalPrice: item.productData.totalPrice,
        discountPrice: item.productData.discountPrice,
        specifications: item.productData.specifications
      };
    } else {
      // Handle regular products
      productData = item.productData || {
        _id: item.originalProductId || (item.productId.includes('_') ? item.productId.split('_')[0] : item.productId),
        name: 'Product',
        price: item.variant?.price || 0,
        mrp: item.variant?.mrp || item.variant?.price || 0,
        images: item.images || { thumbnail: { url: '/images/placeholder-product.jpg' } },
        slug: '',
        stock: item.variant?.stock || 0,
        basePrice: item.variant?.price || 0,
        offerPrice: item.variant?.price || 0
      };
    }
    
    return {
      _id: `guest-${item.productId}`,
      product: productData,
      variant: item.variant,
      addedAt: item.addedAt,
      productType: item.productType || 'product'
    };
  });
 
  isGuestMode = true;
}else {
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
    
    // ✅ FIXED: Get current items from state instead of setting empty array
    const currentState = getState();
    const currentItems = currentState.wishlistState.items || [];
    const fallbackPayload = {
        items: currentItems, // ✅ Preserve current items instead of empty array
        isGuest: true
    };
    
    dispatch(fetchWishlistSuccess(fallbackPayload));
    dispatch(fetchWishlistFailure(error.message));
}
};

// In wishlistActions.ts - FIXED removeFromWishlist action
const removeFromWishlist = (removeData: { itemId: string; productType?: 'product' | 'prebuilt-pc' }) => async (dispatch: any, getState: any) => {
    try {
        
        dispatch(updateWishlistStart());
        
        const state = getState();
        const isGuest = !state.authState.isAuthenticated;

        // ✅ FIXED: Use itemId to remove from Redux state
        dispatch(removeItemFromWishlist({ productId: removeData.itemId }));

        if (isGuest) {
            // ✅ FIXED: Remove from localStorage using the full guest ID
            // itemId format: "guest-69355543a58353f1129b7171_69355543a58353f1129b7172"
            // Need to remove "guest-" prefix for localStorage
            const localStorageId = removeData.itemId.replace('guest-', '');
            localStorageUtils.removeFromGuestWishlist(localStorageId);
        } else {
            // ✅ FIXED: For authenticated users, use the API with itemId
            if (removeData.productType === 'prebuilt-pc') {
                await wishlistAPI.removePreBuiltPCFromWishlist(removeData.itemId);
            } else {
                await wishlistAPI.removeFromWishlist(removeData.itemId);
            }
            toast.success('Item removed from wishlist', { toastId: 'prebuild-wishlist-remove-1' });
        }
        
    } catch (error: any) {
        console.error('❌ removeFromWishlist error:', error);
        
        // ✅ FIXED: Don't call fetchWishlist on error - it causes data corruption
        // Instead, just show error and update state to failed
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

const addPreBuiltPCToWishlist = (wishlistData: { 
  pcId: string; 
  product?: any; // ✅ Pass full product data for guest users
}) => {
  return async (dispatch: any, getState: any) => {
    try {
      dispatch(updateWishlistStart());
      
      // Check authentication
      let isGuest = true;
      if (typeof getState === 'function') {
        const state = getState();
        isGuest = !state.authState.isAuthenticated;
      }
      if (isGuest) {
        // ========== GUEST USER HANDLING ==========
        const guestItemId = wishlistData.pcId;
        
        // Create proper product data structure for localStorage
        const pcProductData = wishlistData.product ? {
          _id: wishlistData.product._id || wishlistData.pcId,
          name: wishlistData.product.name || 'Pre-built PC',
          images: wishlistData.product.images || [],
          price: wishlistData.product.totalPrice || wishlistData.product.basePrice || 0,
          basePrice: wishlistData.product.basePrice || 0,
          offerPrice: wishlistData.product.offerPrice || wishlistData.product.totalPrice || 0,
          slug: wishlistData.product.slug || '',
          stockQuantity: wishlistData.product.stockQuantity || 0,
          condition: wishlistData.product.condition || 'New',
          category: wishlistData.product.category,
          performanceRating: wishlistData.product.performanceRating,
          totalPrice: wishlistData.product.totalPrice,
          discountPrice: wishlistData.product.discountPrice,
          specifications: wishlistData.product.specifications || {},
          averageRating: wishlistData.product.averageRating || 0,
          totalReviews: wishlistData.product.totalReviews || 0
        } : {
          _id: wishlistData.pcId,
          name: 'Pre-built PC',
          images: [],
          price: 0,
          basePrice: 0,
          offerPrice: 0,
          slug: '',
          stockQuantity: 0,
          condition: 'New'
        };
        const saved = localStorageUtils.saveCompleteWishlistItem({
          productId: guestItemId,
          productType: 'prebuilt-pc',
          productData: pcProductData,
          addedAt: new Date().toISOString()
        });
        
        if (saved) {
          // Create wishlist item for Redux
          const newItem: WishlistItem = {
            _id: `guest-${guestItemId}`,
            product: pcProductData,
            addedAt: new Date().toISOString(),
            productType: 'prebuilt-pc',
            preBuiltPC: wishlistData.pcId
          };
          
          dispatch(addItemToWishlist(newItem));
        } else {
          throw new Error('Failed to save to localStorage');
        }
        
      } else {
        // ========== AUTHENTICATED USER HANDLING ==========
        try {
          const response = await wishlistAPI.addPreBuiltPCToWishlist(wishlistData.pcId);
          
          // Extract items from response
          const { items, isGuest: isGuestMode } = extractItemsFromResponse(response);
          
          dispatch(updateWishlistSuccess({ 
            items, 
            isGuest: isGuestMode 
          }));
          
        } catch (apiError: any) {
          console.error('❌ Prebuilt PC API error:', apiError);
          
          // If API fails, add to localStorage as fallback
          if (apiError.response?.status === 401 || apiError.response?.status === 404) {
            // Create optimistic item for Redux
            const optimisticItem: WishlistItem = {
              _id: `temp-pc-${Date.now()}`,
              product: {
                _id: wishlistData.pcId,
                name: wishlistData.product?.name || 'Pre-built PC',
                price: wishlistData.product?.totalPrice || 0,
                images: wishlistData.product?.images || [],
                slug: wishlistData.product?.slug || '',
                stockQuantity: wishlistData.product?.stockQuantity || 0
              },
              addedAt: new Date().toISOString(),
              productType: 'prebuilt-pc',
              preBuiltPC: wishlistData.pcId
            };
            
            dispatch(addItemToWishlist(optimisticItem));
            toast.success('Pre-built PC added to wishlist (offline)', { toastId: 'prebuild-wishlist-add-1' });
          } else {
            throw apiError;
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ Add pre-built PC to wishlist error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add pre-built PC to wishlist';
      toast.error(errorMessage);
      dispatch(updateWishlistFailure(error.message));
    }
  };
};

// ✅ SEPARATE ACTION TO REMOVE PREBUILT PC FROM WISHLIST
const removePreBuiltPCFromWishlist = (pcId: string) => {
  return async (dispatch: any, getState: any) => {
    try {
      dispatch(updateWishlistStart());
      
      // Check authentication
      let isGuest = true;
      if (typeof getState === 'function') {
        const state = getState();
        isGuest = !state.authState.isAuthenticated;
      }
      
      // Remove from Redux state first (optimistic update)
      dispatch(removeItemFromWishlist({ productId: pcId }));
      
      if (isGuest) {
        // Remove from localStorage
        localStorageUtils.removeFromGuestWishlist(pcId, 'prebuilt-pc');
        toast.success('Pre-built PC removed from wishlist');
      } else {
        // Call API
        await wishlistAPI.removePreBuiltPCFromWishlist(pcId);
        toast.success('Pre-built PC removed from wishlist', { toastId: 'prebuild-wishlist-remove-11' });
      }
      
    } catch (error: any) {
      console.error('❌ Remove pre-built PC from wishlist error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove pre-built PC from wishlist';
      toast.error(errorMessage);
      dispatch(updateWishlistFailure(error.message));
    }
  };
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
        toast.success(`Synced ${addedCount} item${addedCount > 1 ? 's' : ''} to your wishlist!`, { toastId: 'prebuild-wishlist-remove-12' });
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
  addToWishlist,           // For regular products only
  addPreBuiltPCToWishlist, // NEW: For prebuilt PCs
  removeFromWishlist,      // For regular products
  removePreBuiltPCFromWishlist, // NEW: For prebuilt PCs
  checkWishlistItem,
  batchCheckWishlistItems,
  clearWishlist,
  clearWishlistError,
  syncGuestWishlist,
  wishlistAPI
};

// ✅ Update actions object too
export const wishlistActions = {
  fetchWishlist,
  addToWishlist,
  addPreBuiltPCToWishlist, // ✅ ADD THIS
  removeFromWishlist,
  removePreBuiltPCFromWishlist, // ✅ ADD THIS
  checkWishlistItem,
  batchCheckWishlistItems,
  clearWishlist,
  clearWishlistError,
  syncGuestWishlist,
};

export default wishlistActions;