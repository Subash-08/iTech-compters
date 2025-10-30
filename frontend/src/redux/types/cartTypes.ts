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