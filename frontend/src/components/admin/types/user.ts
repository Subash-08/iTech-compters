// src/types/user.ts

// Basic User type (your existing)
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UserFormData {
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
}

export interface UpdateUserRoleData {
  role: 'user' | 'admin';
}

export interface UpdateUserStatusData {
  status: 'active' | 'inactive';
  deactivationReason?: string;
}

// ✅ ADDED: Extended types for detailed user view
export interface Address {
  _id: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
}

export interface SocialLogin {
  provider: 'google';
  providerId: string;
  email: string;
  displayName: string;
  photoURL: string;
  connectedAt: string;
}

export interface OrderItem {
  product: string;
  productName: string;
  variant?: string;
  quantity: number;
  price: number;
}

export interface OrderSummary {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  pricing?: {
    total: number;
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
  };
}

export interface OrderStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  totalSpent: number;
}

// ✅ ADDED: Detailed User type with all new fields
export interface DetailedUser {
  // Basic profile (from your existing User type + new fields)
  _id: string;
  name: string; // Keep existing name field for compatibility
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  
  // Additional fields from your schema
  firstName: string;
  lastName: string;
  username: string;
  emailVerified: boolean;
  
  // Social logins
  socialLogins: SocialLogin[];
  isGoogleUser: boolean;
  
  // Addresses
  addresses: Address[];
  defaultAddressId?: string;
  
  // E-commerce
  cartId?: string;
  wishlistId?: string;
  
  recentOrders: OrderSummary[];
  orderStats: OrderStats;
}