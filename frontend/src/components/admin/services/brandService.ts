import api from '../../config/axiosConfig';
import { Brand, BrandFormData, BrandFilters } from '../types/brand';

export const brandService = {
  // Get all brands (public/admin)
  async getBrands(filters: BrandFilters = { search: '', status: '', page: 1, limit: 10 }, isAdmin: boolean = false) {
    const endpoint = isAdmin ? '/admin/brands' : '/brands';
    const response = await api.get(endpoint, { params: filters });
    return response.data;
  },

  // Get single brand by slug
  async getBrand(slug: string) {
    const response = await api.get(`/brand/slug/${slug}`);
    return response.data;
  },

  // Create brand
  async createBrand(formData: FormData) {
    const response = await api.post('/admin/brands', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update brand
  async updateBrand(slug: string, formData: FormData) {
    const response = await api.put(`/admin/brands/${slug}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update brand status
  async updateBrandStatus(id: string, status: 'active' | 'inactive', reason?: string) {
    const response = await api.patch(`/admin/brands/${id}/status`, { 
      status,
      deactivationReason: status === 'inactive' ? reason : undefined 
    });
    return response.data;
  },

  // Delete brand
  async deleteBrand(slug: string) {
    const response = await api.delete(`/admin/brands/${slug}`);
    return response.data;
  },
  async getHomeShowcaseBrands() {
    const response = await api.get('/admin/brands/home-showcase');
    return response.data;
  },

  // NEW: Update Home Page settings (Order/Featured)
  async updateHomeShowcaseSettings(id: string, data: { order?: number; isFeatured?: boolean }) {
    const response = await api.patch(`/admin/brands/${id}/home-showcase`, data);
    return response.data;
  },
  async getPublicShowcaseBrands() {
    // Note: No '/admin' prefix
    const response = await api.get('/brands/home-showcase');
    return response.data;
  },
};