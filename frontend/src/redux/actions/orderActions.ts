// src/redux/actions/orderActions.ts - Update this
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../components/config/axiosConfig';
import { 
  createOrderStart, 
  createOrderSuccess, 
  createOrderFailure,
  processPaymentStart,
  processPaymentSuccess,
  processPaymentFailure,
} from '../slices/orderSlice';
import { clearCartSuccess } from '../slices/cartSlice';

// Create order
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: any, { dispatch, rejectWithValue }) => {
    try {
      dispatch(createOrderStart());
      
      const response = await api.post('/checkout/create-order', orderData);
      
      if (response.data.success) {
        dispatch(createOrderSuccess({ order: response.data.data.order }));
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (error: any) {
      dispatch(createOrderFailure(error.response?.data?.message || error.message));
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Process payment success and clear cart - UPDATED
export const processPaymentSuccess = createAsyncThunk(
  'order/processPaymentSuccess',
  async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
  }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(processPaymentStart());
     const response = await api.post(`/orders/${paymentData.orderId}/payment-success`, {
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpaySignature: paymentData.razorpay_signature
      });

      if (response.data.success) {
        dispatch(clearCartSuccess());
        
        dispatch(processPaymentSuccess({ order: response.data.data.order }));
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Payment processing failed');
      }
    } catch (error: any) {
      console.error('❌ Payment success processing error:', error);
      dispatch(processPaymentFailure(error.response?.data?.message || error.message));
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);