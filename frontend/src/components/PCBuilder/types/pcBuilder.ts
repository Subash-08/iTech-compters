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
  description?: string;
  image?: {
    url: string;
    altText?: string;
  };
  required: boolean;
  sortOrder: number;
  isPeripheral?: boolean;
  parentCategory?: string; // Add this if not present
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
export interface PCRequirementsRequest {
  customer: {
    name: string;
    email: string;
    phone: string;
    city: string;
    additionalNotes?: string;
  };
  requirements: {
    purpose: string;
    purposeCustom?: string;
    budget: string;
    budgetCustom?: string;
    paymentPreference: string;
    deliveryTimeline: string;
    timelineCustom?: string;
  };
  source?: string;
  metadata?: {
    userAgent?: string;
    deviceType?: string;
  };
}

export interface PCRequirementsResponse {
  success: boolean;
  message: string;
  requirementId: string;
  data: {
    id: string;
    customerName: string;
    status: string;
    estimatedContactTime: string;
  };
}

export interface PCRequirementsListResponse {
  success: boolean;
  requirements: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    status: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  };
}

export interface PCRequirementStatsResponse {
  success: boolean;
  stats: {
    byStatus: Array<{
      status: string;
      count: number;
      totalEstimatedValue: number;
      avgBudget: number;
    }>;
    byBudget: Array<{
      budget: string;
      count: number;
    }>;
    byPurpose: Array<{
      purpose: string;
      count: number;
    }>;
    total: number;
    new: number;
    conversionRate: string;
  };
}
