// src/services/productService.ts
import api from '../config/axiosConfig';
import { Product } from '../types/product';

export const productService = {
  // Get products for admin selection
  getAdminProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    inStock?: string;
    sort?: string;
  }) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  // Get products for selection (simplified version)
  getProductsForSelection: async (params?: {
    search?: string;
    category?: string;
    brand?: string;
    inStock?: string;
    limit?: number;
  }) => {
    const response = await api.get('/admin/products', {
      params: {
        ...params,
        limit: params?.limit || 50
      }
    });
    return response.data;
  },

  // Search products
  searchProducts: async (query: string, limit: number = 20) => {
    const response = await api.get('/products/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Get product by ID
  getProductById: async (id: string) => {
    const response = await api.get(`/admin/product/${id}`);
    return response.data;
  },

  // Create product
  createProduct: async (productData: any) => {
    const response = await api.post('/admin/product/new', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id: string, productData: any) => {
    const response = await api.put(`/admin/product/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/admin/product/${id}`);
    return response.data;
  }
};