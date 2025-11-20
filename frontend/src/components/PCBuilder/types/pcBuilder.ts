export interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  image: string;
  inStock: boolean;
  brand: string;
  rating: number;
  reviewCount: number;
  condition: string;
  specifications: Array<{
    key: string;
    value: string;
  }>;
  stockQuantity?: number;
  hasVariants?: boolean;
  variants?: Array<{
    _id: string;
    name: string;
    price: number;
    stockQuantity: number;
    identifyingAttributes: Array<{
      key: string;
      value: string;
      displayValue?: string;
    }>;
  }>;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  required: boolean;
  sortOrder: number;
  status?: string;
}

export interface SelectedComponents {
  [key: string]: Product | null;
}

export interface PCBuilderConfig {
  required: Category[];
  optional: Category[];
}

export interface Filters {
  search: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  inStock: string;
  condition: string;
  minRating?: string;
}

export interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface ComponentSelection {
  category: string;
  categorySlug: string;
  productId: string | null;
  productName: string;
  productPrice: number;
  userNote: string;
  selected: boolean;
  required: boolean;
  sortOrder: number;
}

export interface PCQuote {
  _id: string;
  customer: CustomerDetails;
  components: ComponentSelection[];
  totalEstimated: number;
  status: 'pending' | 'contacted' | 'quoted' | 'accepted' | 'rejected' | 'cancelled';
  adminNotes: string;
  assignedTo?: string;
  quoteExpiry: string;
  createdAt: string;
  updatedAt: string;
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

// Response interfaces
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ComponentsByCategoryResponse {
  success: boolean;
  products: Product[];
  pagination: Pagination;
  category: {
    name: string;
    slug: string;
    description: string;
  };
  filters: {
    search: string;
    sort: string;
    minPrice: number | null;
    maxPrice: number | null;
    inStock: boolean;
    condition: string | null;
    minRating: number | null;
  };
}

export interface CreateQuoteResponse {
  success: boolean;
  message: string;
  quoteId: string;
  totalEstimated: number;
  expiresIn: number;
}