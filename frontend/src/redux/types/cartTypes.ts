// redux/types/cartTypes.ts - UPDATED
export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;    
    basePrice: number;
    offerPrice?: number;
    discountPrice?: number;
    images: Array<{
      url: string;
      alt?: string;
    }>;
    slug: string;
    stock: number;
    brand?: {
      _id: string;
      name: string;
    };
    category?: {
      _id: string;
      name: string;
    };
  };
  variant?: {
    variantId: string; // ✅ This is the main ID from your backend logs
    _id?: string; // ✅ Optional for backward compatibility
    name: string;
    price: number;    
    basePrice?: number;
    offerPrice?: number;
    stock: number;
    attributes?: Array<{
      key: string;
      label: string;
      value: string;
      displayValue?: string;
    }>;
    sku?: string;
  };
  quantity: number;
  price: number;
  addedAt: string;
  productType?: 'product' | 'prebuilt-pc'; // ✅ Add this if missing
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  updating: boolean;
  isGuest: boolean;
}

export interface AddToCartData {
  productId: string;
  variantId?: string;
  variantData?: { // NEW: Proper variant data structure
    variantId: string;
    name?: string;
    price?: number;
    mrp?: number;
    stock?: number;
    attributes?: Array<{ key: string; label: string; value: string }>;
    sku?: string;
  };
  quantity?: number;
   product?: any; // ADD THIS
  variant?: any; // ADD THIS
}

export interface UpdateCartQuantityData {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface RemoveFromCartData {
  productId: string;
  variantId?: string;
}

export interface PreBuiltPCCartItem {
  _id: string;
  productType: 'prebuilt-pc';
  preBuiltPC?: {
    _id: string;
    name: string;
    images: string[];
    totalPrice: number;
    discountPrice?: number;
    slug: string;
    stockQuantity: number;
    category: any;
    specifications: any;
    performanceRating: number;
    condition: string;
  };
  pcId?: string; // For guest cart
  quantity: number;
  price: number;
  addedAt: string;
}

export interface AddPreBuiltPCToCartData {
  pcId: string;
  quantity?: number;
   preBuiltPC?: any;
}

export interface UpdatePreBuiltPCQuantityData {
  pcId: string;
  quantity: number;
}


// Update GuestCartItem to include pre-built PCs
export interface GuestCartItem {
  _id: string;
  productType?: 'product' | 'prebuilt-pc';
  productId?: string;
  pcId?: string;
  variantId?: string;
  quantity: number;
  price: number;
  addedAt: string;
  product?: any;
  preBuiltPC?: any;
  variant?: any;
}

