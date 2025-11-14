// utils/localStorage.ts
export const LocalStorageKeys = {
  GUEST_CART: 'guest_cart',
  GUEST_WISHLIST: 'guest_wishlist', 
  LAST_SYNCED_USER: 'last_synced_user',
  CART_SESSION_ID: 'cart_session_id'
};

// Enhanced Guest cart item type for pre-built PCs
export interface GuestCartItem {
  _id: string;
  productType?: 'product' | 'prebuilt-pc'; // NEW: Product type support
  productId?: string; // For regular products
  pcId?: string; // NEW: For pre-built PCs
  variantId?: string;
  quantity: number;
  price: number;
  addedAt: string;
  product?: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    slug: string;
    stock: number;
    basePrice: number;
    offerPrice: number;
    brand?: any;
    categories?: any[];
  };
  preBuiltPC?: { // NEW: For pre-built PC data
    _id: string;
    name: string;
    images: string[];
    totalPrice: number;
    discountPrice?: number;
    slug: string;
    stockQuantity: number;
    category?: any;
    specifications?: any;
    performanceRating?: number;
    condition?: string;
  };
  variant?: {
    variantId: string;
    name: string;
    price: number;
    stock: number;
    attributes: any[];
  };
}

export interface GuestWishlistItem {
  productId: string;
  productType?: 'product' | 'prebuilt-pc'; // NEW: Add productType
  addedAt: string;
}

// Local storage helpers
export const localStorageUtils = {
  // Guest Cart
  getGuestCart: (): GuestCartItem[] => {
    try {
      const cart = localStorage.getItem(LocalStorageKeys.GUEST_CART);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error reading guest cart from localStorage:', error);
      return [];
    }
  },

  saveGuestCart: (cart: GuestCartItem[]): void => {
    try {
      localStorage.setItem(LocalStorageKeys.GUEST_CART, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving guest cart to localStorage:', error);
    }
  },

  clearGuestCart: (): void => {
    localStorage.removeItem(LocalStorageKeys.GUEST_CART);
  },

  // Get pre-built PC items from guest cart
  getPreBuiltPCGuestCartItems: (): GuestCartItem[] => {
    const cart = localStorageUtils.getGuestCart();
    return cart.filter(item => item.productType === 'prebuilt-pc' || item.pcId);
  },

  // Get regular product items from guest cart
  getProductGuestCartItems: (): GuestCartItem[] => {
    const cart = localStorageUtils.getGuestCart();
    return cart.filter(item => !item.productType || item.productType === 'product' || item.productId);
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

  // Guest Wishlist
  getGuestWishlist: (): GuestWishlistItem[] => {
    try {
      const wishlist = localStorage.getItem(LocalStorageKeys.GUEST_WISHLIST);
      return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
      console.error('Error reading guest wishlist from localStorage:', error);
      return [];
    }
  },

  saveGuestWishlist: (wishlist: GuestWishlistItem[]): void => {
    try {
      localStorage.setItem(LocalStorageKeys.GUEST_WISHLIST, JSON.stringify(wishlist));
    } catch (error) {
      console.error('Error saving guest wishlist to localStorage:', error);
    }
  },

  // Enhanced addToGuestWishlist with productType
  addToGuestWishlist: (productId: string, productType: 'product' | 'prebuilt-pc' = 'product'): GuestWishlistItem[] => {
    const currentWishlist = localStorageUtils.getGuestWishlist();
    const existingItem = currentWishlist.find(item => item.productId === productId && item.productType === productType);
    
    if (!existingItem) {
      const newItem: GuestWishlistItem = {
        productId,
        productType, // MAKE SURE THIS IS SET
        addedAt: new Date().toISOString()
      };
      const updatedWishlist = [...currentWishlist, newItem];
      localStorageUtils.saveGuestWishlist(updatedWishlist);
      return updatedWishlist;
    }
    return currentWishlist;
  },

  removeFromGuestWishlist: (productId: string, productType?: 'product' | 'prebuilt-pc'): GuestWishlistItem[] => {
    const currentWishlist = localStorageUtils.getGuestWishlist();
    const updatedWishlist = currentWishlist.filter(item => 
      !(item.productId === productId && (!productType || item.productType === productType))
    );
    localStorageUtils.saveGuestWishlist(updatedWishlist);
    return updatedWishlist;
  },

  isInGuestWishlist: (productId: string, productType?: 'product' | 'prebuilt-pc'): boolean => {
    const currentWishlist = localStorageUtils.getGuestWishlist();
    return currentWishlist.some(item => 
      item.productId === productId && (!productType || item.productType === productType)
    );
  },

  clearGuestWishlist: (): void => {
    localStorage.removeItem(LocalStorageKeys.GUEST_WISHLIST);
  },
};