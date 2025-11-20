import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { checkoutActions } from '../actions/checkoutActions';
import { CheckoutState, CheckoutData, CheckoutCoupon, GSTInfo } from '../types/checkout';

const initialState: CheckoutState = {
  data: null,
  loading: false,
  error: null,
  couponApplied: null,
  selectedShippingAddress: null,
  selectedBillingAddress: null,
  gstInfo: null,
  paymentMethod: null
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    // Clear checkout error
    clearCheckoutError: (state) => {
      state.error = null;
    },

    // Set shipping address
    setShippingAddress: (state, action: PayloadAction<string>) => {
      state.selectedShippingAddress = action.payload;
    },

    // Set billing address
    setBillingAddress: (state, action: PayloadAction<string>) => {
      state.selectedBillingAddress = action.payload;
    },

    // Set GST information
    setGSTInfo: (state, action: PayloadAction<GSTInfo>) => {
      state.gstInfo = action.payload;
    },

    // Set payment method
    setPaymentMethod: (state, action: PayloadAction<'card' | 'upi' | 'netbanking' | 'cod' | 'wallet'>) => {
      state.paymentMethod = action.payload;
    },

    // Clear applied coupon
    clearCoupon: (state) => {
      state.couponApplied = null;
      if (state.data?.pricing) {
        state.data.pricing.discount = 0;
        state.data.pricing.total = state.data.pricing.subtotal + state.data.pricing.shipping + state.data.pricing.tax;
      }
    },

    // Reset checkout state
    resetCheckout: () => initialState,

    // Update checkout data (for manual updates)
    updateCheckoutData: (state, action: PayloadAction<Partial<CheckoutData>>) => {
      if (state.data) {
        state.data = { ...state.data, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch checkout data
    builder
      .addCase(checkoutActions.fetchCheckoutData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.fetchCheckoutData.fulfilled, (state, action: PayloadAction<CheckoutData>) => {
        state.loading = false;
        state.data = action.payload;
        
        // Set default addresses if available
        if (action.payload.defaultAddressId) {
          state.selectedShippingAddress = action.payload.defaultAddressId;
          state.selectedBillingAddress = action.payload.defaultAddressId;
        } else if (action.payload.addresses.length > 0) {
          state.selectedShippingAddress = action.payload.addresses[0]._id;
          state.selectedBillingAddress = action.payload.addresses[0]._id;
        }
      })
      .addCase(checkoutActions.fetchCheckoutData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Calculate checkout with coupon
    builder
      .addCase(checkoutActions.calculateCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.calculateCheckout.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data.cartItems = action.payload.cartItems;
          state.data.pricing = action.payload.pricing;
        }
        state.couponApplied = action.payload.coupon || null;
      })
      .addCase(checkoutActions.calculateCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.couponApplied = null;
      });

    // Create order
    builder
      .addCase(checkoutActions.createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutActions.createOrder.fulfilled, (state) => {
        state.loading = false;
        // Optionally clear checkout data after successful order
        // state.data = null;
        // state.couponApplied = null;
      })
      .addCase(checkoutActions.createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Save address
    builder
      .addCase(checkoutActions.saveAddress.fulfilled, (state, action) => {
        if (state.data) {
          state.data.addresses.push(action.payload.address);
          if (action.payload.address.isDefault) {
            state.data.defaultAddressId = action.payload.address._id;
            state.selectedShippingAddress = action.payload.address._id;
            state.selectedBillingAddress = action.payload.address._id;
          }
        }
      });

    // Update address
    builder
      .addCase(checkoutActions.updateAddress.fulfilled, (state, action) => {
        if (state.data) {
          const index = state.data.addresses.findIndex(addr => addr._id === action.payload.address._id);
          if (index !== -1) {
            state.data.addresses[index] = action.payload.address;
          }
          if (action.payload.address.isDefault) {
            state.data.defaultAddressId = action.payload.address._id;
          }
        }
      });
  }
});

export const {
  clearCheckoutError,
  setShippingAddress,
  setBillingAddress,
  setGSTInfo,
  setPaymentMethod,
  clearCoupon,
  resetCheckout,
  updateCheckoutData
} = checkoutSlice.actions;

export default checkoutSlice.reducer;