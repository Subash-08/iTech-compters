// src/services/showcaseSectionService.ts
import api from '../../config/axiosConfig';
import { ShowcaseSection, ShowcaseSectionFormData } from '../types/showcaseSection';

export const showcaseSectionService = {
  // Get all sections for admin
  getAdminSections: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }) => {
    const response = await api.get('/admin/showcase-sections', { params });
    return response.data;
  },

  // Get section by ID
  getSectionById: async (id: string) => {
    const response = await api.get(`/showcase-sections/${id}`);
    return response.data;
  },

  // Create new section
  createSection: async (data: ShowcaseSectionFormData) => {
    const response = await api.post('/admin/showcase-sections', data);
    return response.data;
  },

  // Update section
  updateSection: async (id: string, data: Partial<ShowcaseSectionFormData>) => {
    const response = await api.put(`/admin/showcase-sections/${id}`, data);
    return response.data;
  },

  // Delete section
  deleteSection: async (id: string) => {
    const response = await api.delete(`/admin/showcase-sections/${id}`);
    return response.data;
  },

  // Toggle section status
  toggleSectionStatus: async (id: string) => {
    const response = await api.put(`/admin/showcase-sections/${id}/toggle-status`);
    return response.data;
  },

  // Bulk update display order
  bulkUpdateDisplayOrder: async (sections: Array<{ id: string; displayOrder: number }>) => {
    const response = await api.put('/admin/showcase-sections/display-order/bulk', { sections });
    return response.data;
  },
};