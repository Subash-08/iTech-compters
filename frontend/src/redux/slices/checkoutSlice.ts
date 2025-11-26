import { createSlice } from '@reduxjs/toolkit';
import { checkoutActions } from '../actions/checkoutActions';
import { CheckoutState } from '../types/checkout';

const initialState: CheckoutState = {
  data: null,
  loading: false,
  error: null,
  couponApplied: null,
  selectedShippingAddress: null,
  selectedBillingAddress: null,
  currentShippingAddress: null,
  currentBillingAddress: null,
  gstInfo: null,
  paymentMethod: null,
  orderCreationData: null
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setShippingAddress: (state, action) => {
      state.selectedShippingAddress = action.payload;
    },
    setBillingAddress: (state, action) => {
      state.selectedBillingAddress = action.payload;
    },
    setGSTInfo: (state, action) => {
      state.gstInfo = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    clearCoupon: (state) => {
      state.couponApplied = null;
    },
    setOrderCreationData: (state, action) => {
      state.orderCreationData = action.payload;
    },
    clearCheckoutData: (state) => {
      if (state.data) {
        state.data.cartItems = [];
        state.data.pricing = {
          subtotal: 0,
          shipping: 0,
          tax: 0,
          discount: 0,
          total: 0
        };
      }
      state.couponApplied = null;
      state.orderCreationData = null;
    },
    resetCheckoutState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch checkout data
      .addCase(checkoutActions.fetchCheckoutData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.fetchCheckoutData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        
        // Auto-select default address if none selected
        if (!state.selectedShippingAddress && action.payload.addresses?.length > 0) {
          const defaultAddress = action.payload.addresses.find(addr => addr.isDefault) || action.payload.addresses[0];
          if (defaultAddress) {
            state.selectedShippingAddress = defaultAddress._id;
          }
        }
        
        state.error = null;
      })
      .addCase(checkoutActions.fetchCheckoutData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        if (action.payload === 'Cart is empty') {
          state.data = {
            cartItems: [],
            addresses: state.data?.addresses || [],
            pricing: {
              subtotal: 0,
              shipping: 0,
              tax: 0,
              discount: 0,
              total: 0
            }
          };
        }
      })
      
      // Calculate checkout
      .addCase(checkoutActions.calculateCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.calculateCheckout.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data.pricing = action.payload.pricing;
        }
        state.couponApplied = action.payload.coupon || null;
        state.error = null;
      })
      .addCase(checkoutActions.calculateCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create order
      .addCase(checkoutActions.createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orderCreationData = action.payload;
        state.error = null;
      })
      .addCase(checkoutActions.createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Save address
      .addCase(checkoutActions.saveAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.saveAddress.fulfilled, (state, action) => {
        state.loading = false;
        // Auto-select the newly created address
        if (action.payload.address && action.payload.address._id) {
          state.selectedShippingAddress = action.payload.address._id;
        }
        state.error = null;
      })
      .addCase(checkoutActions.saveAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update address
      .addCase(checkoutActions.updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(checkoutActions.updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete address
      .addCase(checkoutActions.deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        // If deleted address was selected, clear selection
        if (state.selectedShippingAddress === action.payload.deletedAddressId) {
          state.selectedShippingAddress = null;
        }
        state.error = null;
      })
      .addCase(checkoutActions.deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Clear checkout data after payment
      .addCase(checkoutActions.clearCheckoutData.fulfilled, (state) => {
        if (state.data) {
          state.data.cartItems = [];
          state.data.pricing = {
            subtotal: 0,
            shipping: 0,
            tax: 0,
            discount: 0,
            total: 0
          };
        }
        state.couponApplied = null;
        state.orderCreationData = null;
      });
  }
});

export const {
  setShippingAddress,
  setBillingAddress,
  setGSTInfo,
  setPaymentMethod,
  clearCoupon,
  setOrderCreationData,
  clearCheckoutData,
  resetCheckoutState
} = checkoutSlice.actions;

export default checkoutSlice.reducer;