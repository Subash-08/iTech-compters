import api from '../../config/axiosConfig';// src/components/admin/services/heroSectionService.ts


// Simple interfaces matching your backend
export interface HeroSlide {
  _id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroSection {
  _id?: string;
  name: string;
  slides: HeroSlide[];
  isActive: boolean;
  autoPlay: boolean;
  autoPlaySpeed: number;
  transitionEffect: 'slide' | 'fade' | 'cube' | 'coverflow';
  showNavigation: boolean;
  showPagination: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroSectionFormData {
  name: string;
  autoPlay: boolean;
  autoPlaySpeed: number;
  transitionEffect: 'slide' | 'fade' | 'cube' | 'coverflow';
  showNavigation: boolean;
  showPagination: boolean;
}

export const heroSectionService = {
  // Get all hero sections (admin)
  getAllHeroSections: async (): Promise<{ success: boolean; data: HeroSection[] }> => {
    try {
      const response = await api.get('/admin/hero-sections');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching hero sections:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch hero sections');
    }
  },

  // Get active hero sections (public)
  getActiveHeroSections: async (): Promise<{ success: boolean; data: HeroSection[] }> => {
    try {
      const response = await api.get('/hero-sections/active');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active hero sections:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch active hero sections');
    }
  },

  // Get hero section by ID
  getHeroSectionById: async (id: string): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.get(`/hero-sections/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching hero section:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch hero section');
    }
  },

  // Create hero section
  createHeroSection: async (data: HeroSectionFormData): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.post('/admin/hero-sections', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating hero section:', error);
      throw new Error(error.response?.data?.message || 'Failed to create hero section');
    }
  },

  // Update hero section
  updateHeroSection: async (id: string, data: Partial<HeroSectionFormData>): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.put(`/admin/hero-sections/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating hero section:', error);
      throw new Error(error.response?.data?.message || 'Failed to update hero section');
    }
  },

  // Add slide to hero section
  addSlide: async (heroSectionId: string, data: FormData): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.post(`/admin/hero-sections/${heroSectionId}/slides`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding slide:', error);
      throw new Error(error.response?.data?.message || 'Failed to add slide');
    }
  },

  // Update slide
  updateSlide: async (heroSectionId: string, slideId: string, data: FormData): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.put(`/admin/hero-sections/${heroSectionId}/slides/${slideId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating slide:', error);
      throw new Error(error.response?.data?.message || 'Failed to update slide');
    }
  },

  // Delete slide
  deleteSlide: async (heroSectionId: string, slideId: string): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.delete(`/admin/hero-sections/${heroSectionId}/slides/${slideId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting slide:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete slide');
    }
  },

  // Reorder slides
  reorderSlides: async (heroSectionId: string, slidesOrder: string[]): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.put(`/admin/hero-sections/${heroSectionId}/reorder`, { slidesOrder });
      return response.data;
    } catch (error: any) {
      console.error('Error reordering slides:', error);
      throw new Error(error.response?.data?.message || 'Failed to reorder slides');
    }
  },

  // Toggle slide active status
  toggleSlideActive: async (heroSectionId: string, slideId: string): Promise<{ success: boolean; data: HeroSection }> => {
    try {
      const response = await api.put(`/admin/hero-sections/${heroSectionId}/slides/${slideId}/toggle`);
      return response.data;
    } catch (error: any) {
      console.error('Error toggling slide:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle slide');
    }
  },
};