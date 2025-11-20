import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Base selectors
const selectCheckoutState = (state: RootState) => state.checkout;

// Direct state selectors
export const selectCheckoutData = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.data
);

export const selectCheckoutLoading = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.loading
);

export const selectCheckoutError = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.error
);

export const selectCouponApplied = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.couponApplied
);

export const selectSelectedShippingAddress = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.selectedShippingAddress
);

export const selectSelectedBillingAddress = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.selectedBillingAddress
);

export const selectGSTInfo = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.gstInfo
);

export const selectPaymentMethod = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.paymentMethod
);

// Derived selectors
export const selectCurrentPricing = createSelector(
  [selectCheckoutData],
  (data) => data?.pricing || null
);

export const selectCheckoutCartItems = createSelector(
  [selectCheckoutData],
  (data) => data?.cartItems || []
);

export const selectCheckoutAddresses = createSelector(
  [selectCheckoutData],
  (data) => data?.addresses || []
);

export const selectDefaultAddressId = createSelector(
  [selectCheckoutData],
  (data) => data?.defaultAddressId
);

export const selectTotalCheckoutItems = createSelector(
  [selectCheckoutCartItems],
  (items) => items.reduce((total, item) => total + item.quantity, 0)
);

// Address selection selectors
export const selectDefaultAddress = createSelector(
  [selectCheckoutAddresses, selectDefaultAddressId],
  (addresses, defaultId) => {
    return addresses.find(addr => addr._id === defaultId) || addresses[0] || null;
  }
);

export const selectCurrentShippingAddress = createSelector(
  [selectCheckoutAddresses, selectSelectedShippingAddress, selectDefaultAddress],
  (addresses, selectedId, defaultAddress) => {
    if (selectedId) {
      return addresses.find(addr => addr._id === selectedId) || defaultAddress;
    }
    return defaultAddress;
  }
);

export const selectCurrentBillingAddress = createSelector(
  [selectCheckoutAddresses, selectSelectedBillingAddress, selectCurrentShippingAddress],
  (addresses, selectedId, shippingAddress) => {
    if (selectedId) {
      return addresses.find(addr => addr._id === selectedId) || shippingAddress;
    }
    return shippingAddress;
  }
);

// Pricing breakdown selectors
export const selectSubtotal = createSelector(
  [selectCurrentPricing],
  (pricing) => pricing?.subtotal || 0
);

export const selectShippingCost = createSelector(
  [selectCurrentPricing],
  (pricing) => pricing?.shipping || 0
);

export const selectTaxAmount = createSelector(
  [selectCurrentPricing],
  (pricing) => pricing?.tax || 0
);

export const selectDiscountAmount = createSelector(
  [selectCurrentPricing],
  (pricing) => pricing?.discount || 0
);

export const selectGrandTotal = createSelector(
  [selectCurrentPricing],
  (pricing) => pricing?.total || 0
);

// Product type breakdown
export const selectProductTypeItems = createSelector(
  [selectCheckoutCartItems],
  (items) => {
    const products = items.filter(item => item.productType === 'product');
    const preBuiltPCs = items.filter(item => item.productType === 'prebuilt-pc');
    
    return {
      products,
      preBuiltPCs,
      productCount: products.reduce((sum, item) => sum + item.quantity, 0),
      preBuiltPCCount: preBuiltPCs.reduce((sum, item) => sum + item.quantity, 0)
    };
  }
);

// Checkout validation selectors
export const selectIsCheckoutValid = createSelector(
  [
    selectCheckoutCartItems,
    selectCurrentShippingAddress,
    selectPaymentMethod,
    selectCheckoutLoading
  ],
  (items, shippingAddress, paymentMethod, loading) => {
    if (loading) return false;
    if (items.length === 0) return false;
    if (!shippingAddress) return false;
    if (!paymentMethod) return false;
    return true;
  }
);

export const selectCheckoutSummary = createSelector(
  [
    selectCheckoutCartItems,
    selectSubtotal,
    selectShippingCost,
    selectTaxAmount,
    selectDiscountAmount,
    selectGrandTotal,
    selectCouponApplied,
    selectCurrentShippingAddress,
    selectPaymentMethod
  ],
  (items, subtotal, shipping, tax, discount, total, coupon, shippingAddress, paymentMethod) => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shipping,
    tax,
    discount,
    total,
    coupon,
    shippingAddress,
    paymentMethod,
    currency: 'INR'
  })
);

// Order creation readiness
export const selectOrderCreationData = createSelector(
  [
    selectSelectedShippingAddress,
    selectSelectedBillingAddress,
    selectCouponApplied,
    selectGSTInfo,
    selectPaymentMethod
  ],
  (shippingAddressId, billingAddressId, coupon, gstInfo, paymentMethod) => ({
    shippingAddressId,
    billingAddressId: billingAddressId || shippingAddressId,
    couponCode: coupon?.code,
    gstInfo: gstInfo || {},
    paymentMethod: paymentMethod!
  })
);