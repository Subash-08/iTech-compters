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
  mrp?: number; // 🆕 NEW: Added MRP field
  offerPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  images: {
    thumbnail: {
      url: string;
      altText: string;
    };
    gallery?: Array<{
      url: string;
      altText: string;
    }>;
    hoverImage?: {
      url: string;
      altText: string;
    };
  };
  averageRating: number;
  totalReviews: number;
  condition: string;
  isActive: boolean;
  
  // 🆕 NEW VIRTUAL FIELDS (from backend)
  sellingPrice?: number;
  displayMrp?: number;
  calculatedDiscount?: number;
  priceRange?: {
    min: number;
    max: number;
    hasRange: boolean;
  };
  hasActiveVariants?: boolean;
  availableColors?: Array<{
    value: string;
    displayValue: string;
    hexCode: string;
    stock: number;
  }>;
  
  // 🆕 Variant fields
  variantConfiguration?: {
    hasVariants: boolean;
    variantType: string;
    variantAttributes: Array<{
      key: string;
      label: string;
      values: string[];
    }>;
  };
  variants?: Array<{
    _id: string;
    name: string;
    price: number;
    mrp?: number;
    stockQuantity: number;
    isActive: boolean;
    identifyingAttributes: Array<{
      key: string;
      label: string;
      value: string;
      isColor?: boolean;
      hexCode?: string;
    }>;
    images: {
      thumbnail: {
        url: string;
        altText: string;
      };
      gallery: Array<{
        url: string;
        altText: string;
      }>;
    };
  }>;
  
  // 🆕 NEW FIELDS
  hsn?: string;
  manufacturerImages?: Array<{
    url: string;
    altText: string;
    sectionTitle?: string;
  }>;
}

export interface ProductsResponse {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AvailableFilters {
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