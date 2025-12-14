// src/services/showcaseSectionService.ts
import api from '../config/axiosConfig';
import { ShowcaseSection, ShowcaseSectionFormData } from './showcaseSection';

export const showcaseSectionService = {
  // Get all active showcase sections for frontend
  getActiveShowcaseSections: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    showOnHomepage?: boolean;
  }) => {
    try {
      const response = await api.get('/showcase-sections', { params });
      return response.data;      
    } catch (error) {
      console.error('Error fetching showcase sections:', error);
      throw error;
    }
  },

  // Get single showcase section by ID
  getShowcaseSectionById: async (id: string) => {
    try {
      const response = await api.get(`/showcase-sections/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching showcase section:', error);
      throw error;
    }
  },

  // Get all showcase sections (Admin)
  getAdminShowcaseSections: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }) => {
    try {
      const response = await api.get('/admin/showcase-sections', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin showcase sections:', error);
      throw error;
    }
  },

  // Create new showcase section
  createSection: async (data: ShowcaseSectionFormData) => {
    try {
      const response = await api.post('/admin/showcase-sections', data);
      return response.data;
    } catch (error) {
      console.error('Error creating showcase section:', error);
      throw error;
    }
  },

  // Update showcase section
  updateSection: async (id: string, data: Partial<ShowcaseSectionFormData>) => {
    try {
      const response = await api.put(`/admin/showcase-sections/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating showcase section:', error);
      throw error;
    }
  },

  // Delete showcase section
  deleteSection: async (id: string) => {
    try {
      const response = await api.delete(`/admin/showcase-sections/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting showcase section:', error);
      throw error;
    }
  },

  // Toggle section status
  toggleSectionStatus: async (id: string) => {
    try {
      const response = await api.put(`/admin/showcase-sections/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling section status:', error);
      throw error;
    }
  },

  // Bulk update display order
  bulkUpdateDisplayOrder: async (sections: Array<{ id: string; displayOrder: number }>) => {
    try {
      const response = await api.put('/admin/showcase-sections/display-order/bulk', { sections });
      return response.data;
    } catch (error) {
      console.error('Error updating display order:', error);
      throw error;
    }
  },

  // Record section click
  recordSectionClick: async (id: string) => {
    try {
      const response = await api.post(`/showcase-sections/${id}/click`);
      return response.data;
    } catch (error) {
      console.error('Error recording section click:', error);
      throw error;
    }
  }
};