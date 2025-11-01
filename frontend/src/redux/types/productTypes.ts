// src/redux/types/productTypes.ts
export interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: {
    _id: string;
    name: string;
  };
  categories: Array<{
    _id: string;
    name: string;
  }>;
  basePrice: number;
  offerPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  images: {
    thumbnail: {
      url: string;
      altText: string;
    };
  };
  averageRating: number;
  totalReviews: number;
  condition: string;
  isActive: boolean;
}

export interface ProductsResponse {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// In your product slice or reducer
interface AvailableFilters {
  brands: string[];
  categories: string[];
  conditions: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  baseMinPrice?: number;
  baseMaxPrice?: number;
}
export interface ProductFilters {
  category?: string;
  brand?: string;
  condition?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  brandId?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  search?: string;
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
}
// src/redux/types/reviewTypes.ts
export interface ReviewUser {
  _id: string;
  email: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string; // For backward compatibility
}

export interface Review {
  _id: string;
  user: ReviewUser;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReviews {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export interface ReviewState {
  loading: boolean;
  error: string | null;
  success: boolean;
  productReviews: {
    [productId: string]: ProductReviews;
  };
}

export interface CreateReviewData {
  rating: number;
  comment: string;
}