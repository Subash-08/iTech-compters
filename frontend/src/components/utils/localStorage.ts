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
  productType: 'product' | 'prebuilt-pc';
  variantId?: string; // For product variants
  addedAt: string;
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
      console.log('💾 Guest cart saved:', validatedCart.length, 'items');
    } catch (error) {
      console.error('❌ Error saving guest cart to localStorage:', error);
    }
  },

  // Enhanced add to guest cart with proper data structure
  addToGuestCart: (itemData: {
    productType: 'product' | 'prebuilt-pc';
    productId: string;
    variantId?: string;
    quantity?: number;
    price: number;
    product?: GuestCartItem['product'];
    preBuiltPC?: GuestCartItem['preBuiltPC'];
    variant?: GuestCartItem['variant'];
  }): GuestCartItem[] => {
    const currentCart = localStorageUtils.getGuestCart();
    
    // Generate unique cart item ID
    const cartItemId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if item already exists (for products with variants)
    const existingItemIndex = currentCart.findIndex(item => 
      item.productId === itemData.productId && 
      item.variantId === itemData.variantId &&
      item.productType === itemData.productType
    );
    
    let updatedCart: GuestCartItem[];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedCart = [...currentCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: (updatedCart[existingItemIndex].quantity || 1) + (itemData.quantity || 1),
        price: itemData.price, // Update price in case it changed
        addedAt: new Date().toISOString(),
        product: itemData.product || updatedCart[existingItemIndex].product,
        preBuiltPC: itemData.preBuiltPC || updatedCart[existingItemIndex].preBuiltPC,
        variant: itemData.variant || updatedCart[existingItemIndex].variant
      };
    } else {
      // Add new item
      const newItem: GuestCartItem = {
        _id: cartItemId,
        productType: itemData.productType,
        productId: itemData.productId,
        variantId: itemData.variantId,
        quantity: itemData.quantity || 1,
        price: itemData.price,
        addedAt: new Date().toISOString(),
        product: itemData.product,
        preBuiltPC: itemData.preBuiltPC,
        variant: itemData.variant
      };
      updatedCart = [...currentCart, newItem];
    }
    
    localStorageUtils.saveGuestCart(updatedCart);
    console.log('🛒 Added to guest cart:', {
      productId: itemData.productId,
      variantId: itemData.variantId,
      productType: itemData.productType,
      price: itemData.price,
      hasProductData: !!itemData.product,
      hasPreBuiltPCData: !!itemData.preBuiltPC
    });
    
    return updatedCart;
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
    console.log('🧹 Guest cart cleared');
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

  // Guest Wishlist - Enhanced
  getGuestWishlist: (): GuestWishlistItem[] => {
    try {
      const wishlist = localStorage.getItem(LocalStorageKeys.GUEST_WISHLIST);
      const parsedWishlist = wishlist ? JSON.parse(wishlist) : [];
      
      // Validate and migrate old structure
      return parsedWishlist.map((item: any) => ({
        productId: item.productId,
        productType: item.productType || 'product',
        variantId: item.variantId,
        addedAt: item.addedAt || new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error reading guest wishlist from localStorage:', error);
      return [];
    }
  },

  saveGuestWishlist: (wishlist: GuestWishlistItem[]): void => {
    try {
      localStorage.setItem(LocalStorageKeys.GUEST_WISHLIST, JSON.stringify(wishlist));
    } catch (error) {
      console.error('❌ Error saving guest wishlist to localStorage:', error);
    }
  },

  // Enhanced addToGuestWishlist
  addToGuestWishlist: (
    productId: string, 
    productType: 'product' | 'prebuilt-pc' = 'product',
    variantId?: string
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
        addedAt: new Date().toISOString()
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

  // Debug utilities
  debugGuestCart: (): void => {
    const cart = localStorageUtils.getGuestCart();
    console.group('🛒 Guest Cart Debug');
    console.log('Total items:', cart.length);
    console.log('Total quantity:', cart.reduce((sum, item) => sum + item.quantity, 0));
    console.log('Total value:', localStorageUtils.getGuestCartTotal());
    console.log('Items:', cart);
    console.groupEnd();
  }
};