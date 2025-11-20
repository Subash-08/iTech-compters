export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  maximumDiscount?: number;
  minimumCartValue: number;
  usageLimit?: number;
  usageCount: number;
  usageLimitPerUser: number;
  validFrom: string;
  validUntil: string;
  applicableTo: 'all_products' | 'specific_products' | 'specific_categories' | 'specific_brands';
  specificProducts?: string[];
  specificCategories?: string[];
  specificBrands?: string[];
  excludedProducts?: string[];
  userEligibility: 'all_users' | 'new_users' | 'existing_users' | 'specific_users';
  allowedUsers?: string[];
  minimumOrders: number;
  isOneTimeUse: boolean;
  status: 'active' | 'inactive' | 'expired' | 'usage_limit_reached';
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Virtual fields
  isValid?: boolean;
  remainingUses?: number;
  daysRemaining?: number;
}

export interface CouponFormData {
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue?: number;
  maximumDiscount?: number;
  minimumCartValue?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  validFrom: string;
  validUntil: string;
  applicableTo: 'all_products' | 'specific_products' | 'specific_categories' | 'specific_brands';
  specificProducts?: string[];
  specificCategories?: string[];
  specificBrands?: string[];
  excludedProducts?: string[];
  userEligibility: 'all_users' | 'new_users' | 'existing_users' | 'specific_users';
  allowedUsers?: string[];
  minimumOrders?: number;
  isOneTimeUse?: boolean;
  status?: 'active' | 'inactive';
}

export interface CouponFilters {
  search?: string;
  status?: string;
  discountType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CouponValidationRequest {
  code: string;
  cartItems?: Array<{
    product: string;
    category: string;
    brand: string;
    price: number;
    quantity: number;
  }>;
  cartTotal: number;
}

export interface CouponValidationResponse {
  success: boolean;
  coupon: {
    _id: string;
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed' | 'free_shipping';
    discountValue: number;
    maximumDiscount?: number;
    discountAmount: number;
    finalAmount: number;
    applicableTo: string;
    isFreeShipping: boolean;
  };
}