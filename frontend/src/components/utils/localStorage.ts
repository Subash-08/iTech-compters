// utils/localStorage.ts
export const LocalStorageKeys = {
  GUEST_CART: 'guest_cart',
  GUEST_WISHLIST: 'guest_wishlist', 
  LAST_SYNCED_USER: 'last_synced_user',
  CART_SESSION_ID: 'cart_session_id'
};

// Enhanced Guest cart item type that matches Redux cart structure
export interface GuestCartItem {
  _id: string; // Unique cart item ID
  productType: 'product' | 'prebuilt-pc';
  productId: string; // For both products and pre-built PCs
  variantId?: string; // For product variants
  quantity: number;
  price: number;
  addedAt: string;
  
  // Product data (for regular products)
  product?: {
    _id: string;
    name: string;
    slug: string;
    effectivePrice?: number;
    mrp?: number;
    stockQuantity?: number;
    hasStock?: boolean;
    condition?: string;
    averageRating?: number;
    images?: {
      thumbnail?: {
        url: string;
        altText: string;
      };
      main?: {
        url: string;
        altText: string;
      };
      gallery?: Array<{
        url: string;
        altText: string;
      }>;
    };
    brand?: {
      _id: string;
      name: string;
      slug?: string;
    };
    variants?: Array<{
      _id: string;
      name: string;
      price?: number;
      mrp?: number;
      stockQuantity?: number;
      sku?: string;
      slug?: string;
      images?: {
        thumbnail?: {
          url: string;
          altText: string;
        };
      };
      isActive?: boolean;
      identifyingAttributes?: any[];
    }>;
  };
  
  // Pre-built PC data
  preBuiltPC?: {
    _id: string;
    name: string;
    slug: string;
    totalPrice: number;
    discountPrice?: number;
    stockQuantity: number;
    condition?: string;
    performanceRating?: number;
    images?: {
      thumbnail?: {
        url: string;
        altText: string;
      };
      main?: {
        url: string;
        altText: string;
      };
      gallery?: Array<{
        url: string;
        altText: string;
      }>;
    };
    category?: {
      _id: string;
      name: string;
      slug?: string;
    };
    specifications?: any;
  };
  
  // Variant data (for products with variants)
  variant?: {
    variantId: string;
    name: string;
    price?: number;
    mrp?: number;
    stock?: number;
    sku?: string;
    attributes?: Array<{
      key: string;
      label: string;
      value: string;
    }>;
    images?: {
      thumbnail?: {
        url: string;
        altText: string;
      };
    };
  };
}

export interface GuestWishlistItem {
  productId: string;
  originalProductId?: string;
  productType: 'product' | 'prebuilt-pc';
  variantId?: string;
  variant?: any;
  addedAt: string;
  productData?: any;
}

// Local storage helpers
export const localStorageUtils = {
  // Guest Cart - Enhanced with proper data structure
  getGuestCart: (): GuestCartItem[] => {
    try {
      const cart = localStorage.getItem(LocalStorageKeys.GUEST_CART);
      const parsedCart = cart ? JSON.parse(cart) : [];
      
      // Validate and migrate old cart structure if needed
      return parsedCart.map((item: any) => ({
        // Ensure required fields
        _id: item._id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productType: item.productType || 'product',
        productId: item.productId || item.pcId, // Handle both productId and pcId
        variantId: item.variantId,
        quantity: Math.max(1, item.quantity || 1),
        price: Math.max(0, item.price || 0),
        addedAt: item.addedAt || new Date().toISOString(),
        
        // Product data
        product: item.product ? {
          _id: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          effectivePrice: item.product.effectivePrice,
          mrp: item.product.mrp,
          stockQuantity: item.product.stockQuantity,
          hasStock: item.product.hasStock,
          condition: item.product.condition,
          averageRating: item.product.averageRating,
          images: item.product.images,
          brand: item.product.brand,
          variants: item.product.variants
        } : undefined,
        
        // Pre-built PC data
        preBuiltPC: item.preBuiltPC ? {
          _id: item.preBuiltPC._id,
          name: item.preBuiltPC.name,
          slug: item.preBuiltPC.slug,
          totalPrice: item.preBuiltPC.totalPrice,
          discountPrice: item.preBuiltPC.discountPrice,
          stockQuantity: item.preBuiltPC.stockQuantity,
          condition: item.preBuiltPC.condition,
          performanceRating: item.preBuiltPC.performanceRating,
          images: item.preBuiltPC.images,
          category: item.preBuiltPC.category,
          specifications: item.preBuiltPC.specifications
        } : undefined,
        
        // Variant data
        variant: item.variant ? {
          variantId: item.variant.variantId || item.variant._id,
          name: item.variant.name,
          price: item.variant.price,
          mrp: item.variant.mrp,
          stock: item.variant.stock || item.variant.stockQuantity,
          sku: item.variant.sku,
          attributes: item.variant.attributes,
          images: item.variant.images
        } : undefined
      }));
    } catch (error) {
      console.error('❌ Error reading guest cart from localStorage:', error);
      return [];
    }
  },

  saveGuestCart: (cart: GuestCartItem[]): void => {
    try {
      // Validate cart before saving
      const validatedCart = cart.map(item => ({
        _id: item._id,
        productType: item.productType,
        productId: item.productId,
        variantId: item.variantId,
        quantity: Math.max(1, item.quantity),
        price: Math.max(0, item.price),
        addedAt: item.addedAt,
        product: item.product,
        preBuiltPC: item.preBuiltPC,
        variant: item.variant
      }));
      
      localStorage.setItem(LocalStorageKeys.GUEST_CART, JSON.stringify(validatedCart));
    } catch (error) {
      console.error('❌ Error saving guest cart to localStorage:', error);
    }
  },

  // Update guest cart item quantity
  updateGuestCartQuantity: (cartItemId: string, quantity: number): GuestCartItem[] => {
    const currentCart = localStorageUtils.getGuestCart();
    const updatedCart = currentCart.map(item =>
      item._id === cartItemId 
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    );
    localStorageUtils.saveGuestCart(updatedCart);
    return updatedCart;
  },

  // Remove from guest cart
  removeFromGuestCart: (cartItemId: string): GuestCartItem[] => {
    const currentCart = localStorageUtils.getGuestCart();
    const updatedCart = currentCart.filter(item => item._id !== cartItemId);
    localStorageUtils.saveGuestCart(updatedCart);
    return updatedCart;
  },

  // Remove by product ID and variant ID
  removeProductFromGuestCart: (productId: string, variantId?: string): GuestCartItem[] => {
    const currentCart = localStorageUtils.getGuestCart();
    const updatedCart = currentCart.filter(item =>
      !(item.productId === productId && item.variantId === variantId)
    );
    localStorageUtils.saveGuestCart(updatedCart);
    return updatedCart;
  },

  clearGuestCart: (): void => {
    localStorage.removeItem(LocalStorageKeys.GUEST_CART);
  },

  // Get cart item count
  getGuestCartItemCount: (): number => {
    const cart = localStorageUtils.getGuestCart();
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  },

  // Get cart total
  getGuestCartTotal: (): number => {
    const cart = localStorageUtils.getGuestCart();
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  },

  // Get pre-built PC items from guest cart
  getPreBuiltPCGuestCartItems: (): GuestCartItem[] => {
    const cart = localStorageUtils.getGuestCart();
    return cart.filter(item => item.productType === 'prebuilt-pc');
  },

  // Get regular product items from guest cart
  getProductGuestCartItems: (): GuestCartItem[] => {
    const cart = localStorageUtils.getGuestCart();
    return cart.filter(item => item.productType === 'product');
  },

  // Find cart item by product ID and variant
  findGuestCartItem: (productId: string, variantId?: string): GuestCartItem | undefined => {
    const cart = localStorageUtils.getGuestCart();
    return cart.find(item => 
      item.productId === productId && item.variantId === variantId
    );
  },

  // User tracking for security
  getLastSyncedUser: (): string | null => {
    return localStorage.getItem(LocalStorageKeys.LAST_SYNCED_USER);
  },

  setLastSyncedUser: (userId: string): void => {
    localStorage.setItem(LocalStorageKeys.LAST_SYNCED_USER, userId);
  },

  clearLastSyncedUser: (): void => {
    localStorage.removeItem(LocalStorageKeys.LAST_SYNCED_USER);
  },

  // Session tracking
  getCartSessionId: (): string => {
    let sessionId = localStorage.getItem(LocalStorageKeys.CART_SESSION_ID);
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(LocalStorageKeys.CART_SESSION_ID, sessionId);
    }
    return sessionId;
  },

  clearCartSessionId: (): void => {
    localStorage.removeItem(LocalStorageKeys.CART_SESSION_ID);
  },

getGuestWishlist: (): GuestWishlistItem[] => {
  try {
    const wishlist = localStorage.getItem(LocalStorageKeys.GUEST_WISHLIST);
    const parsedWishlist = wishlist ? JSON.parse(wishlist) : [];
      return parsedWishlist.map(item => {
      // If this is a prebuilt PC and has productData
      if (item.productType === 'prebuilt-pc' && item.productData) {
        return {
          ...item,
          productData: {
            // Ensure prebuilt PC has the right structure
            _id: item.productData._id || item.productId,
            name: item.productData.name || 'Pre-built PC',
            images: item.productData.images || [],
            price: item.productData.price || item.productData.totalPrice || 0,
            basePrice: item.productData.basePrice || item.productData.totalPrice || 0,
            offerPrice: item.productData.offerPrice || item.productData.discountPrice || 0,
            slug: item.productData.slug || '',
            stockQuantity: item.productData.stockQuantity || 0,
            condition: item.productData.condition || 'New',
            category: item.productData.category,
            performanceRating: item.productData.performanceRating,
            // Add other prebuilt PC specific fields
            totalPrice: item.productData.totalPrice,
            discountPrice: item.productData.discountPrice,
            specifications: item.productData.specifications
          }
        };
      }
      return item;
    });
  } catch (error) {
    console.error('❌ Error reading guest wishlist from localStorage:', error);
    return [];
  }
},

// In localStorageUtils.ts - ADD THIS NEW FUNCTION AFTER addToGuestWishlist
saveCompleteWishlistItem: (itemData: {
  productId: string;
  productType: 'product' | 'prebuilt-pc';
  variantId?: string;
  productData: any;
  variant?: any;
  addedAt: string;
}): boolean => {
  try {
    const currentWishlist = localStorageUtils.getGuestWishlist();
    
    // Find if item already exists
    const existingItemIndex = currentWishlist.findIndex(wishlistItem => 
      wishlistItem.productId === itemData.productId && 
      wishlistItem.productType === itemData.productType &&
      wishlistItem.variantId === itemData.variantId
    );
    
    let updatedWishlist: GuestWishlistItem[];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedWishlist = [...currentWishlist];
      updatedWishlist[existingItemIndex] = {
        ...updatedWishlist[existingItemIndex],
        productData: itemData.productData,
        variant: itemData.variant,
        addedAt: itemData.addedAt
      };
    } else {
      // Add new item
      updatedWishlist = [...currentWishlist, {
        productId: itemData.productId,
        productType: itemData.productType,
        variantId: itemData.variantId,
        productData: itemData.productData,
        variant: itemData.variant,
        addedAt: itemData.addedAt,
        originalProductId: itemData.productId.includes('_') ? itemData.productId.split('_')[0] : itemData.productId
      }];
    }
    
    // Save to localStorage
    localStorage.setItem(LocalStorageKeys.GUEST_WISHLIST, JSON.stringify(updatedWishlist));
    
    // Also save a backup copy for debugging
    localStorage.setItem('wishlist_backup_' + Date.now(), JSON.stringify(itemData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving complete wishlist item:', error);
    return false;
  }
},

// Also update the saveGuestWishlist function for better debugging
saveGuestWishlist: (wishlist: GuestWishlistItem[]): void => {
  try {
    // Validate each item has productData
    const validatedWishlist = wishlist.map(item => ({
      ...item,
      productData: item.productData || null,
      variant: item.variant || null
    }));
    
    localStorage.setItem(LocalStorageKeys.GUEST_WISHLIST, JSON.stringify(validatedWishlist));
  } catch (error) {
    console.error('❌ Error saving guest wishlist to localStorage:', error);
  }
},
// In localStorageUtils.ts - UPDATE THIS FUNCTION
addToGuestWishlist: (
  productId: string, 
  productType: 'product' | 'prebuilt-pc' = 'product',
  variantId?: string,
  productData?: any, // ✅ ADD THIS PARAMETER
  variant?: any      // ✅ ADD THIS PARAMETER
): GuestWishlistItem[] => {
  const currentWishlist = localStorageUtils.getGuestWishlist();
  const existingItem = currentWishlist.find(item => 
    item.productId === productId && 
    item.productType === productType &&
    item.variantId === variantId
  );
  
  if (!existingItem) {
    const newItem: GuestWishlistItem = {
      productId,
      productType,
      variantId,
      addedAt: new Date().toISOString(),
      productData: productData || null, // ✅ SAVE PRODUCT DATA
      variant: variant || null          // ✅ SAVE VARIANT DATA
    };
    const updatedWishlist = [...currentWishlist, newItem];
    localStorageUtils.saveGuestWishlist(updatedWishlist);
    return updatedWishlist;
  }
  return currentWishlist;
},

  removeFromGuestWishlist: (
    productId: string, 
    productType?: 'product' | 'prebuilt-pc',
    variantId?: string
  ): GuestWishlistItem[] => {
    const currentWishlist = localStorageUtils.getGuestWishlist();
    const updatedWishlist = currentWishlist.filter(item => 
      !(item.productId === productId && 
        (!productType || item.productType === productType) &&
        (!variantId || item.variantId === variantId))
    );
    localStorageUtils.saveGuestWishlist(updatedWishlist);
    return updatedWishlist;
  },

  isInGuestWishlist: (
    productId: string, 
    productType?: 'product' | 'prebuilt-pc',
    variantId?: string
  ): boolean => {
    const currentWishlist = localStorageUtils.getGuestWishlist();
    return currentWishlist.some(item => 
      item.productId === productId && 
      (!productType || item.productType === productType) &&
      (!variantId || item.variantId === variantId)
    );
  },

  clearGuestWishlist: (): void => {
    localStorage.removeItem(LocalStorageKeys.GUEST_WISHLIST);
  },

};