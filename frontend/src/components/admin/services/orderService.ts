// src/services/orderService.ts - Updated with invoice functions

import api from '../../config/axiosConfig';
import { 
  Order, 
  OrderFilters, 
  OrderAnalytics, 
  OrderFormData, 
  AdminNoteFormData, 
  ShippingUpdateData,
  InvoiceResponse,
  InvoiceUploadData
} from '../types/order';

export const orderService = {
  // Admin - Get all orders
  async getOrders(filters: OrderFilters = { page: 1, limit: 10 }) {
    const response = await api.get('/admin/orders', { params: filters });
    return response.data;
  },

  // Admin - Get order analytics
  async getAnalytics(days: number = 30) {
    const response = await api.get('/admin/orders/analytics', { 
      params: { days } 
    });
    return response.data;
  },

  // Admin - Export orders
  async exportOrders(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string) {
    const response = await api.get('/admin/orders/export', {
      params: { format, startDate, endDate },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  // Admin - Get order details
  async getOrderDetails(orderId: string) {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  // Admin - Update order status
  async updateOrderStatus(orderId: string, formData: OrderFormData) {
    const response = await api.put(`/admin/orders/${orderId}/status`, formData);
    return response.data;
  },

  // Admin - Add admin note
  async addAdminNote(orderId: string, formData: AdminNoteFormData) {
    const response = await api.post(`/admin/orders/${orderId}/notes`, formData);
    return response.data;
  },

  // ==================== INVOICE MANAGEMENT ====================

  // Get all invoices for an order (Admin)
  async getOrderInvoices(orderId: string) {
    const response = await api.get(`/admin/orders/${orderId}/invoices`);
    return response.data;
  },

  // Upload admin invoice
  async uploadAdminInvoice(orderId: string, formData: FormData) {
    const response = await api.post(`/admin/orders/${orderId}/invoice/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Generate auto invoice
  async generateAutoInvoice(orderId: string) {
    const response = await api.post(`/admin/orders/${orderId}/invoice/generate`);
    return response.data;
  },

  // Delete admin uploaded invoice
  async deleteAdminInvoice(orderId: string) {
    const response = await api.delete(`/admin/orders/${orderId}/invoice/admin`);
    return response.data;
  },

  // Download specific invoice
  async downloadInvoice(orderId: string, invoiceType: 'auto' | 'admin') {
    const response = await api.get(`/admin/orders/${orderId}/invoice/${invoiceType}`, {
      responseType: 'blob',
    });
    return response;
  },

 async getUserOrders(filters: { 
    page?: number; 
    limit?: number; 
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };
    
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // User - Get order details
  async getUserOrderDetails(orderId: string) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // User - Get user order invoices
  async getUserOrderInvoices(orderId: string) {
    const response = await api.get(`/orders/${orderId}/invoices`);
    return response.data;
  },

  // User - Download user invoice
  async downloadUserInvoice(orderId: string, invoiceType: 'auto' | 'admin') {
    const response = await api.get(`/orders/${orderId}/invoice/${invoiceType}`, {
      responseType: 'blob',
    });
    return response;
  },

  // User - Cancel order
  async cancelOrder(orderId: string, reason: string) {
    const response = await api.put(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  // Public - Track order
  async trackOrder(orderNumber: string) {
    const response = await api.get(`/orders/track/${orderNumber}`);
    return response.data;
  },

  // Admin - Update shipping information
  async updateShippingInfo(orderId: string, formData: ShippingUpdateData) {
    const response = await api.put(`/admin/orders/${orderId}/shipping`, formData);
    return response.data;
  },

  // Admin - Mark as delivered
  async markAsDelivered(orderId: string, notes?: string) {
    const response = await api.put(`/admin/orders/${orderId}/deliver`, { notes });
    return response.data;
  },

  // Admin - Get payment attempts
  async getPaymentAttempts(orderId: string) {
    const response = await api.get(`/admin/orders/${orderId}/payment-attempts`);
    return response.data;
  }
};