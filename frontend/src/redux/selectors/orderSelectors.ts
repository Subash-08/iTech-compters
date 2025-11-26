// src/redux/selectors/orderSelectors.ts - UPDATED
import { RootState } from '../store';

// Safe selectors with fallbacks
export const selectCurrentOrder = (state: RootState) => state.order?.currentOrder || null;
export const selectOrders = (state: RootState) => state.order?.orders || [];
export const selectOrderLoading = (state: RootState) => state.order?.loading || false;
export const selectOrderCreating = (state: RootState) => state.order?.creating || false;
export const selectOrderError = (state: RootState) => state.order?.error || null;
export const selectPaymentProcessing = (state: RootState) => state.order?.paymentProcessing || false;
export const selectPaymentSuccess = (state: RootState) => state.order?.paymentSuccess || false;

export const selectOrderById = (orderId: string) => (state: RootState) =>
  state.order?.orders?.find(order => order._id === orderId) || state.order?.currentOrder || null;

export const selectOrderByNumber = (orderNumber: string) => (state: RootState) =>
  state.order?.orders?.find(order => order.orderNumber === orderNumber) || 
  (state.order?.currentOrder?.orderNumber === orderNumber ? state.order.currentOrder : null);