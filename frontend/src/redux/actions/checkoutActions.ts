import { createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { CreateOrderRequest, GSTInfo } from '../types/checkout';

// Checkout Service
export const checkoutService = {
  // Get checkout data
  async getCheckoutData(): Promise<{ success: boolean; data: any }> {
    const response = await api.get('/checkout');
    return response.data;
  },

  // Calculate checkout with coupon
  async calculateCheckout(couponCode?: string, shippingAddressId?: string): Promise<{ 
    success: boolean; 
    data: any;
  }> {
    const response = await api.post('/checkout/calculate', {
      couponCode,
      shippingAddressId
    });
    return response.data;
  },

  // Create order
  async createOrder(orderData: CreateOrderRequest): Promise<{ 
    success: boolean; 
    message: string;
    order: any;
    orderId: string;
    orderNumber: string;
  }> {
    const response = await api.post('/checkout/create-order', orderData);
    return response.data;
  },

  // Save address
  async saveAddress(addressData: any, setAsDefault = false): Promise<{ 
    success: boolean; 
    message: string;
    address: any;
  }> {
    const response = await api.post('/checkout/address', {
      address: addressData,
      setAsDefault
    });
    return response.data;
  },

  // Update address
  async updateAddress(addressId: string, addressData: any, setAsDefault = false): Promise<{ 
    success: boolean; 
    message: string;
    address: any;
  }> {
    const response = await api.put(`/checkout/address/${addressId}`, {
      address: addressData,
      setAsDefault
    });
    return response.data;
  }
};

// Checkout Actions
export const checkoutActions = {
  // Get checkout data
  fetchCheckoutData: createAsyncThunk(
    'checkout/fetchCheckoutData',
    async (_, { rejectWithValue }) => {
      try {
        const response = await checkoutService.getCheckoutData();
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch checkout data';
        toast.error(errorMessage);
        return rejectWithValue(errorMessage);
      }
    }
  ),

  // Calculate checkout with coupon
  calculateCheckout: createAsyncThunk(
    'checkout/calculateCheckout',
    async ({ couponCode, shippingAddressId }: { couponCode?: string; shippingAddressId?: string }, { rejectWithValue }) => {
      try {
        const response = await checkoutService.calculateCheckout(couponCode, shippingAddressId);
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to calculate checkout';
        toast.error(errorMessage);
        return rejectWithValue(errorMessage);
      }
    }
  ),

  // Create order
  createOrder: createAsyncThunk(
    'checkout/createOrder',
    async (orderData: CreateOrderRequest, { rejectWithValue }) => {
      try {
        const response = await checkoutService.createOrder(orderData);
        toast.success(response.message || 'Order created successfully!');
        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to create order';
        toast.error(errorMessage);
        return rejectWithValue(errorMessage);
      }
    }
  ),

  // Save address
  saveAddress: createAsyncThunk(
    'checkout/saveAddress',
    async ({ address, setAsDefault }: { address: any; setAsDefault?: boolean }, { rejectWithValue }) => {
      try {
        const response = await checkoutService.saveAddress(address, setAsDefault);
        toast.success(response.message || 'Address saved successfully!');
        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to save address';
        toast.error(errorMessage);
        return rejectWithValue(errorMessage);
      }
    }
  ),

  // Update address
  updateAddress: createAsyncThunk(
    'checkout/updateAddress',
    async ({ addressId, address, setAsDefault }: { addressId: string; address: any; setAsDefault?: boolean }, { rejectWithValue }) => {
      try {
        const response = await checkoutService.updateAddress(addressId, address, setAsDefault);
        toast.success(response.message || 'Address updated successfully!');
        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to update address';
        toast.error(errorMessage);
        return rejectWithValue(errorMessage);
      }
    }
  )
};