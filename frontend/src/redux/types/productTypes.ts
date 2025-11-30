// src/redux/types/productTypes.ts
export interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: {
    _id: string;
    name: string;
    slug: string;
  };
  categories: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  // 🎯 NEW: Unified price fields from backend
  effectivePrice: number;
  mrp: number;
  basePrice: number;
  
  images: {
    thumbnail: {
      url: string;
      altText: string;
    };
    hoverImage?: {
      url: string;
      altText: string;
    };
  };
  
  averageRating: number;
  totalReviews: number;
  condition: string;
  hasStock: boolean;
  createdAt: string;
  
  // 🎯 VIRTUALS (computed by backend)
  totalStock?: number;
  sellingPrice?: number;
  displayMrp?: number;
  discountPercentage?: number;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  isOnSale?: boolean;
  primaryImage?: string;
}

// 🆕 NEW: Unified API Response
export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalProducts: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
    filters: {
      minPrice: number;
      maxPrice: number;
      availableBrands: string[];
      availableCategories: string[];
      conditions: string[];
      ratingOptions: number[];
      inStockCount: number;
      totalProducts: number;
    };
    appliedFilters: {
      search?: string;
      brand?: string | string[];
      category?: string | string[];
      minPrice?: number;
      maxPrice?: number;
      rating?: number;
      condition?: string | string[];
      inStock?: boolean;
      sort?: string;
    };
  };
}

// 🆕 UPDATED: Filter types for new parameter names
export interface ProductFilters {
  // 🎯 NEW: Standardized parameter names
  search?: string;
  brand?: string | string[];
  category?: string | string[];
  'price[gte]'?: number;
  'price[lte]'?: number;
  'rating[gte]'?: number;
  condition?: string | string[];
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  
  // 🎯 LEGACY: Backward compatibility (will be mapped)
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: string;
}

export interface AvailableFilters {
  minPrice: number;
  maxPrice: number;
  availableBrands: string[];
  availableCategories: string[];
  conditions: string[];
  ratingOptions: number[];
  inStockCount: number;
  totalProducts: number;
}

export interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  availableFilters: AvailableFilters;
  totalPages: number;
  totalProducts: number;
  currentPage: number;
  searchResults: Product[];
  searchLoading: boolean;
  searchError: string | null;
  lastSearchQuery: string;
}