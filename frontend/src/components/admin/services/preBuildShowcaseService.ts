import api from '../../config/axiosConfig';
import { PreBuildShowcaseItem } from '../types/preBuildShowcase';

export const preBuildShowcaseService = {
  // Public: Get active items for user page
  async getShowcaseItems() {
    const response = await api.get('/pre-build-showcase');
    return response.data;
  },

  // Admin: Get all items (active & inactive)
  async getAdminShowcaseItems() {
    const response = await api.get('/admin/pre-build-showcase');
    return response.data;
  },

  // Admin: Create item
  async createItem(formData: FormData) {
    const response = await api.post('/admin/pre-build-showcase', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Admin: Update item
  async updateItem(id: string, formData: FormData) {
    const response = await api.put(`/admin/pre-build-showcase/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Admin: Delete item
  async deleteItem(id: string) {
    const response = await api.delete(`/admin/pre-build-showcase/${id}`);
    return response.data;
  }
};