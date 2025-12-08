// redux/types/wishlistTypes.ts - COMPLETE FIXED VERSION
export interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  mrp?: number;
  offerPrice?: number;
  discountPrice?: number;
  stockQuantity: number;
  images: {
    thumbnail?: { url: string; altText?: string };
    hoverImage?: { url: string; altText?: string };
    gallery?: Array<{ url: string; altText?: string }>;
  };
  brand?: {
    _id: string;
    name: string;
  };
  categories?: Array<{
    _id: string;
    name: string;
  }>;
  condition?: string;
  discountPercentage?: number;
  averageRating?: number;
  totalReviews?: number;
  variants?: Array<any>;
}

export interface PreBuiltPC {
  _id: string;
  name: string;
  slug: string;
  totalPrice: number;
  discountPrice?: number;
  basePrice?: number;
  offerPrice?: number;
  stockQuantity: number;
  images: Array<{
    url: string;
    public_id?: string;
  }>;
  category: string;
  performanceRating?: number;
  condition?: string;
  averageRating?: number;
  totalReviews?: number;
}

export interface WishlistVariant {
  variantId: string;
  name?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  attributes?: Array<{
    key: string;
    label: string;
    value: string;
    displayValue?: string;
    hexCode?: string;
    isColor?: boolean;
  }>;
  sku?: string;
}

export interface WishlistItem {
  _id: string; // Wishlist item ID (not product ID)
  productType: 'product' | 'prebuilt-pc';
  product: WishlistProduct | PreBuiltPC;
  variant?: WishlistVariant;
  addedAt: string;
  
  // Enhanced fields from backend
  displayPrice?: number;
  displayMrp?: number;
  discountPercentage?: number;
  displayName?: string;
  image?: string;
}

export interface AddToWishlistData {
  productId: string;
  variant?: {
    variantId: string;
    name?: string;
    price?: number;
    mrp?: number;
    stock?: number;
    attributes?: Array<{
      key: string;
      label: string;
      value: string;
      displayValue?: string;
      hexCode?: string;
      isColor?: boolean;
    }>;
    sku?: string;
  };
  productType?: 'product' | 'prebuilt-pc';
   product?: any;
}

export interface RemoveFromWishlistData {
  itemId: string; // Wishlist item ID
  productType?: 'product' | 'prebuilt-pc';
}

export interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  isGuestWishlist: boolean;
  lastSynced: string | null;
}
// redux/types/wishlistTypes.ts - ADD THESE TYPES
export interface GuestWishlistItem {
  productId: string;
  originalProductId?: string;
  variant?: {
    variantId: string;
    name?: string;
    price?: number;
    mrp?: number;
    stock?: number;
    attributes?: Array<{
      key: string;
      label: string;
      value: string;
      displayValue?: string;
      hexCode?: string;
      isColor?: boolean;
    }>;
    sku?: string;
  };
  productType?: 'product' | 'prebuilt-pc';
  addedAt: string;
}

export interface CheckWishlistItemData {
  productId: string;
  variantId?: string;
}

export interface RemoveFromWishlistData {
    itemId: string;
    productType?: 'product' | 'prebuilt-pc'; // ✅ Add productType
}