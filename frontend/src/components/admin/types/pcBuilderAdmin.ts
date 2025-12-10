export interface PCRequirementCustomer {
  name: string;
  email: string;
  phone: string;
  city: string;
  additionalNotes?: string;
}

export interface PCRequirement {
  purpose: string;
  purposeCustom?: string;
  budget: string;
  budgetCustom?: string;
  paymentPreference: 'Full payment' | 'Emi';
  deliveryTimeline: string;
  timelineCustom?: string;
}

export interface PCRequirementDocument {
  _id: string;
  customer: PCRequirementCustomer;
  requirements: PCRequirement;
  status: 'new' | 'processing' | 'quoted' | 'contacted' | 'completed' | 'cancelled';
  adminNotes: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  recommendations?: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      images?: any;
    };
    name: string;
    price: number;
    reason: string;
  }>;
  estimatedTotal?: number;
  source: 'requirements_form' | 'manual' | 'other';
  contactAttempts?: Array<{
    date: string;
    method: string;
    notes: string;
    admin: any;
  }>;
  quotedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PCQuoteComponent {
  category: string;
  categorySlug: string;
  productId: string | null;
  productName: string;
  productPrice: number;
  productImage: string;
  productSlug: string;
  userNote: string;
  selected: boolean;
  required: boolean;
  sortOrder: number;
}

export interface PCQuoteDocument {
  _id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };
  components: PCQuoteComponent[];
  totalEstimated: number;
  status: 'pending' | 'contacted' | 'quoted' | 'accepted' | 'rejected' | 'cancelled';
  adminNotes: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'web' | 'mobile' | 'api';
  contactedAt?: string;
  quotedAt?: string;
  respondedAt?: string;
}

export interface PCRequirementFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface PCQuoteFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PCRequirementStats {
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
}

export interface PCQuoteStats {
  byStatus: Array<{
    status: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  total: number;
  pending: number;
  expired: number;
}
export interface PCQuoteResponse {
  success: boolean;
  message: string;
  quoteId: string;
  totalEstimated: number;
  // REMOVED: expiresIn and quoteExpiry
}