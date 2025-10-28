export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
  variant?: {
    _id: string;
    name: string;
    price: number;
    stock: number;
  };
  quantity: number;
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