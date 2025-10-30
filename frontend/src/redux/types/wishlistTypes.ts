export interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
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
    ratings?: number;
  };
  addedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  updating: boolean;
  checkedItems: string[]; // Use array instead of Set for serializability
}

export interface AddToWishlistData {
  productId: string;
}

export interface RemoveFromWishlistData {
  productId: string;
}

export interface CheckWishlistItemData {
  productId: string;
}