// src/services/sectionService.ts
import api from '../../config/axiosConfig';
import { Section, SectionFormData, SectionReorderData } from '../types/section';

export const sectionService = {
  // Get all sections (admin)
  async getSections() {
    const response = await api.get('/sections');
    return response.data;
  },

  // Get visible sections (for homepage preview)
  async getVisibleSections() {
    const response = await api.get('/sections/visible');
    return response.data;
  },

  // Get single section
  async getSection(id: string) {
    const response = await api.get(`/sections/${id}`);
    return response.data;
  },

  // Create section
  async createSection(formData: SectionFormData) {
    const response = await api.post('/sections', formData);
    return response.data;
  },

  // Update section
  async updateSection(id: string, formData: SectionFormData) {
    const response = await api.put(`/sections/${id}`, formData);
    return response.data;
  },

  // Delete section
  async deleteSection(id: string) {
    const response = await api.delete(`/sections/${id}`);
    return response.data;
  },

  async reorderSections(payload: { sections: { id: string; order: number }[] }) {
  return api
    .put('/sections/reorder-sections', payload)
    .then(res => res.data);
}


};