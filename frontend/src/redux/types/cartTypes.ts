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
    _id: string;
    name: string;
    price: number;    
  basePrice: number;
  offerPrice?: number;
    stock: number;
  };
  quantity: number;
  price: number;
  addedAt: string;
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
  quantity?: number;
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

