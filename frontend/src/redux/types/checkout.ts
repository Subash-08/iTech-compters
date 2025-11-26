export interface CheckoutAddress {
  _id?: string;
  type: 'home' | 'work' | 'other';
  isDefault?: boolean;
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

export interface GSTInfo {
  gstNumber?: string;
  businessName?: string;
}

export interface CheckoutItem {
  cartItemId: string;
  productType: 'product' | 'prebuilt-pc';
  product: string;
  variant?: any;
  name: string;
  slug: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
  taxRate: number;
  taxAmount: number;
  available: boolean;
}

export interface CheckoutPricing {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

export interface CheckoutCoupon {
  code: string;
  name: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
}

export interface CheckoutData {
  cartItems: CheckoutItem[];
  addresses: CheckoutAddress[];
  defaultAddressId?: string;
  pricing: CheckoutPricing;
  summary: {
    totalItems: number;
    currency: string;
  };
}

export interface CheckoutState {
  data: CheckoutData | null;
  loading: boolean;
  error: string | null;
  couponApplied: CheckoutCoupon | null;
  selectedShippingAddress: string | null;  // This stores the address ID
  selectedBillingAddress: string | null;   // This stores the address ID
  currentShippingAddress: CheckoutAddress | null;  // This stores the address object
  currentBillingAddress: CheckoutAddress | null;   // This stores the address object
  gstInfo: GSTInfo | null;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'cod' | 'wallet' | null;
  orderCreationData: any | null;
}

export interface CreateOrderRequest {
  shippingAddressId: string;
  billingAddressId?: string;
  couponCode?: string;
  gstInfo?: GSTInfo;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'cod' | 'wallet';
}