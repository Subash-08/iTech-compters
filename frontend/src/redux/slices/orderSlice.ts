// src/redux/slices/orderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderItem {
  productId: string;
  productType: 'product' | 'prebuilt-pc';
  name: string;
  sku: string;
  image?: string;
  quantity: number;
  originalPrice: number;
  discountedPrice: number;
  total: number;
  variant?: {
    variantId: string;
    name: string;
    identifyingAttributes: Array<{
      key: string;
      label: string;
      value: string;
    }>;
  };
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  landmark?: string;
}

export interface GSTInfo {
  gstNumber?: string;
  businessName?: string;
  businessAddress?: string;
  isBusiness: boolean;
}

export interface Order {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: OrderItem[];
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  gstInfo?: GSTInfo;
  payment: {
    method: string;
    status: 'created' | 'attempted' | 'captured' | 'failed';
  };
  createdAt: string;
  estimatedDelivery?: string;
}

export interface OrderState {
  currentOrder: Order | null;
  orders: Order[];
  loading: boolean;
  creating: boolean;
  error: string | null;
  paymentProcessing: boolean;
  paymentSuccess: boolean;
}

const initialState: OrderState = {
  currentOrder: null,
  orders: [],
  loading: false,
  creating: false,
  error: null,
  paymentProcessing: false,
  paymentSuccess: false,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    // Create order
    createOrderStart: (state) => {
      state.creating = true;
      state.error = null;
    },
    createOrderSuccess: (state, action: PayloadAction<{ order: Order }>) => {
      state.creating = false;
      state.currentOrder = action.payload.order;
      state.error = null;
    },
    createOrderFailure: (state, action: PayloadAction<string>) => {
      state.creating = false;
      state.error = action.payload;
    },

    // Payment processing
    processPaymentStart: (state) => {
      state.paymentProcessing = true;
      state.error = null;
    },
    processPaymentSuccess: (state, action: PayloadAction<{ order: Order }>) => {
      state.paymentProcessing = false;
      state.paymentSuccess = true;
      state.currentOrder = action.payload.order;
      state.error = null;
    },
    processPaymentFailure: (state, action: PayloadAction<string>) => {
      state.paymentProcessing = false;
      state.paymentSuccess = false;
      state.error = action.payload;
    },

    // Clear cart after successful payment
    clearCartAfterPayment: (state) => {
      // This will be handled by cart slice, just an action to dispatch
    },

    // Fetch orders
    fetchOrdersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action: PayloadAction<Order[]>) => {
      state.loading = false;
      state.orders = action.payload;
      state.error = null;
    },
    fetchOrdersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch single order
    fetchOrderStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrderSuccess: (state, action: PayloadAction<Order>) => {
      state.loading = false;
      state.currentOrder = action.payload;
      state.error = null;
    },
    fetchOrderFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Reset order state
    resetOrderState: (state) => {
      state.currentOrder = null;
      state.creating = false;
      state.paymentProcessing = false;
      state.paymentSuccess = false;
      state.error = null;
    },

    // Clear error
    clearOrderError: (state) => {
      state.error = null;
    },
  },
});

export const {
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  processPaymentStart,
  processPaymentSuccess,
  processPaymentFailure,
  clearCartAfterPayment,
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  fetchOrderStart,
  fetchOrderSuccess,
  fetchOrderFailure,
  resetOrderState,
  clearOrderError,
} = orderSlice.actions;

export default orderSlice.reducer;