// redux/selectors/checkoutSelectors.ts - FIXED VERSION
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

// FIXED: Removed duplicate - use the one from state directly
export const selectOrderCreationData = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.orderCreationData
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

// Pricing breakdown selectors with debugging
export const selectSubtotal = createSelector(
  [selectCurrentPricing, selectCheckoutCartItems],
  (pricing, cartItems) => {
    const backendSubtotal = pricing?.subtotal || 0;
    const calculatedSubtotal = cartItems.reduce((sum, item) => 
      sum + ((item.price || 0) * (item.quantity || 1)), 0
    );

    // Debug logging
    if (cartItems.length > 0 && Math.abs(backendSubtotal - calculatedSubtotal) > 1) {
      console.warn('⚠️ Subtotal mismatch:', {
        backendSubtotal,
        calculatedSubtotal,
        difference: backendSubtotal - calculatedSubtotal,
        items: cartItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        }))
      });
    }

    return backendSubtotal > 0 ? backendSubtotal : calculatedSubtotal;
  }
);

export const selectShippingCost = createSelector(
  [selectCurrentPricing, selectSubtotal],
  (pricing, subtotal) => {
    const backendShipping = pricing?.shipping || 0;
    const calculatedShipping = subtotal >= 1000 ? 0 : 100;
    
    return backendShipping >= 0 ? backendShipping : calculatedShipping;
  }
);

export const selectTaxAmount = createSelector(
  [selectCurrentPricing, selectSubtotal],
  (pricing, subtotal) => {
    const backendTax = pricing?.tax || 0;
    return backendTax >= 0 ? backendTax : 0;
  }
);

export const selectDiscountAmount = createSelector(
  [selectCurrentPricing],
  (pricing) => pricing?.discount || 0
);

export const selectGrandTotal = createSelector(
  [selectCurrentPricing, selectSubtotal, selectShippingCost, selectTaxAmount, selectDiscountAmount],
  (pricing, subtotal, shipping, tax, discount) => {
    const backendTotal = pricing?.total || 0;
    const calculatedTotal = Math.max(0, subtotal + shipping + tax - discount);
    
    // Debug total calculation
    if (subtotal > 0 && Math.abs(backendTotal - calculatedTotal) > 1) {
      console.warn('⚠️ Total calculation mismatch:', {
        backendTotal,
        calculatedTotal,
        difference: backendTotal - calculatedTotal,
        components: { subtotal, shipping, tax, discount }
      });
    }
    
    return backendTotal > 0 ? backendTotal : calculatedTotal;
  }
);

// Enhanced pricing verification selector
export const selectPricingVerification = createSelector(
  [selectSubtotal, selectShippingCost, selectTaxAmount, selectDiscountAmount, selectGrandTotal],
  (subtotal, shipping, tax, discount, total) => {
    const expectedTax = Math.round(subtotal * 0.18);
    const expectedTotal = subtotal + shipping + tax - discount;
    
    const taxCorrect = Math.abs(tax - expectedTax) <= 1;
    const totalCorrect = Math.abs(total - expectedTotal) <= 1;
    
    return {
      subtotal,
      shipping,
      tax,
      discount,
      total,
      expectedTax,
      expectedTotal,
      taxCalculation: taxCorrect ? '✅ Correct' : '❌ Incorrect',
      totalCalculation: totalCorrect ? '✅ Correct' : '❌ Incorrect',
      taxDifference: tax - expectedTax,
      totalDifference: total - expectedTotal,
      actualTaxRate: subtotal > 0 ? ((tax / subtotal) * 100).toFixed(2) + '%' : '0%'
    };
  }
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
      preBuiltPCCount: preBuiltPCs.reduce((sum, item) => sum + item.quantity, 0),
      productSubtotal: products.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      preBuiltPCSubtotal: preBuiltPCs.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
  }
);

// Price comparison between cart and checkout
export const selectPriceComparison = createSelector(
  [selectCheckoutCartItems],
  (checkoutItems) => {
    // This would need access to cart items from cart selectors
    // For now, return the checkout items with debug info
    return checkoutItems.map(item => ({
      name: item.name,
      productType: item.productType,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      taxRate: (item.taxRate * 100) + '%',
      taxAmount: item.taxAmount
    }));
  }
);

// Checkout validation selectors
export const selectIsCheckoutValid = createSelector(
  [
    selectCheckoutCartItems,
    selectCurrentShippingAddress,
    selectPaymentMethod,
    selectCheckoutLoading,
    selectGrandTotal
  ],
  (items, shippingAddress, paymentMethod, loading, total) => {
    if (loading) return false;
    if (items.length === 0) return false;
    if (!shippingAddress) return false;
    if (!paymentMethod) return false;
    if (total <= 0) return false; // Ensure total is positive
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
    selectPaymentMethod,
    selectPricingVerification
  ],
  (items, subtotal, shipping, tax, discount, total, coupon, shippingAddress, paymentMethod, pricingVerification) => ({
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
    currency: 'INR',
    pricingVerification,
    isValid: items.length > 0 && !!shippingAddress && !!paymentMethod && total > 0
  })
);

// FIXED: Renamed this selector to avoid duplicate
export const selectOrderCreationPayload = createSelector(
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

// Debug selectors for development
export const selectCheckoutDebugInfo = createSelector(
  [
    selectCheckoutCartItems,
    selectSubtotal,
    selectShippingCost,
    selectTaxAmount,
    selectDiscountAmount,
    selectGrandTotal,
    selectPricingVerification,
    selectProductTypeItems
  ],
  (items, subtotal, shipping, tax, discount, total, pricingVerification, productTypes) => {
    return {
      cartItems: {
        count: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        items: items.map(item => ({
          name: item.name,
          type: item.productType,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          taxRate: item.taxRate
        }))
      },
      pricing: {
        subtotal,
        shipping,
        tax,
        discount,
        total,
        verification: pricingVerification
      },
      productBreakdown: productTypes,
      calculations: {
        expectedTax: Math.round(subtotal * 0.18),
        expectedTotal: subtotal + shipping + tax - discount,
        taxAccuracy: Math.abs(tax - Math.round(subtotal * 0.18)) <= 1 ? '✅' : '❌',
        totalAccuracy: Math.abs(total - (subtotal + shipping + tax - discount)) <= 1 ? '✅' : '❌'
      }
    };
  }
);

// Quick status selector
export const selectCheckoutStatus = createSelector(
  [
    selectCheckoutLoading,
    selectCheckoutError,
    selectCheckoutCartItems,
    selectCurrentShippingAddress,
    selectPaymentMethod,
    selectGrandTotal
  ],
  (loading, error, items, shippingAddress, paymentMethod, total) => ({
    loading,
    error,
    hasItems: items.length > 0,
    hasShippingAddress: !!shippingAddress,
    hasPaymentMethod: !!paymentMethod,
    hasValidTotal: total > 0,
    isReady: !loading && 
             !error && 
             items.length > 0 && 
             !!shippingAddress && 
             !!paymentMethod && 
             total > 0
  })
);

// Export all selectors for easy importing
export default {
  // Basic state
  selectCheckoutData,
  selectCheckoutLoading,
  selectCheckoutError,
  selectCouponApplied,
  selectSelectedShippingAddress,
  selectSelectedBillingAddress,
  selectGSTInfo,
  selectPaymentMethod,
  selectOrderCreationData,
  
  // Derived data
  selectCurrentPricing,
  selectCheckoutCartItems,
  selectCheckoutAddresses,
  selectDefaultAddressId,
  selectTotalCheckoutItems,
  
  // Addresses
  selectDefaultAddress,
  selectCurrentShippingAddress,
  selectCurrentBillingAddress,
  
  // Pricing
  selectSubtotal,
  selectShippingCost,
  selectTaxAmount,
  selectDiscountAmount,
  selectGrandTotal,
  selectPricingVerification,
  
  // Product breakdown
  selectProductTypeItems,
  selectPriceComparison,
  
  // Validation
  selectIsCheckoutValid,
  selectCheckoutSummary,
  
  // Order creation
  selectOrderCreationPayload, // Use this for creating orders
  
  // Debug
  selectCheckoutDebugInfo,
  selectCheckoutStatus
};