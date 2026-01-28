import api from '../../config/axiosConfig';
import { Category, CategoryFormData, CategoryFilters } from '../types/category';

export const categoryAPI = {
  /**
   * Get all categories with optional filters
   * For admin: uses /admin/categories to see all categories (active + inactive)
   * For public: uses /categories to see only active categories
   */
  getCategories: async (filters: CategoryFilters = {}, isAdmin: boolean = true) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.append(key, value.toString());
      }
    });

    // Use admin endpoint for admin users to see all categories
    // Use public endpoint for non-admin users to see only active categories
    const endpoint = isAdmin ? '/admin/categories' : '/categories';


    const response = await api.get(`${endpoint}?${params}`);
 
    return response.data;
  },

  /**
   * Get single category by ID (admin only)
   */
  getCategory: async (id: string) => {
    const response = await api.get(`/admin/categories/${id}`);
    return response.data;
  },

  /**
   * Create new category with image upload support
   */
  createCategory: async (formData: FormData) => {
    const response = await api.post('/admin/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Update entire category with image upload support
   */
  updateCategory: async (id: string, formData: FormData) => {
    const response = await api.put(`/admin/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Partial update category (without image upload)
   * Use this for simple field updates without images
   */
  partialUpdateCategory: async (id: string, data: Partial<CategoryFormData>) => {
    const response = await api.patch(`/admin/categories/${id}/partial`, data);
    return response.data;
  },

  /**
   * Update category status (activate/deactivate)
   */
  updateStatus: async (id: string, data: { status: 'active' | 'inactive'; reason?: string }) => {
    const response = await api.patch(`/admin/categories/${id}/status`, data);
    return response.data;
  },

  /**
   * Get category tree/hierarchy
   */
  getCategoryTree: async () => {
    const response = await api.get('/admin/categories/tree');
    return response.data;
  },

  /**
   * Get categories for dropdown (active only)
   */
  getCategoriesDropdown: async () => {
    const response = await api.get('/admin/categories/dropdown');
    return response.data;
  },

  /**
   * Search categories by keyword
   */
  searchCategories: async (keyword: string, includeInactive: boolean = false) => {
    const params = new URLSearchParams();
    params.append('keyword', keyword);
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }
    
    const response = await api.get(`/admin/categories?${params}`);
    return response.data;
  },

  /**
   * Upload category image only
   * Alternative method if you want separate image upload endpoint
   */
  uploadImage: async (id: string, imageFile: File, altText?: string) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (altText) {
      formData.append('imageAltText', altText);
    }

    const response = await api.post(`/admin/categories/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Remove category image only
   * Alternative method if you want separate image removal endpoint
   */
  removeImage: async (id: string) => {
    const response = await api.delete(`/admin/categories/${id}/image`);
    return response.data;
  },
  getHomeShowcaseCategories: async () => {
    const response = await api.get('/admin/categories/home-showcase');
    return response.data;
  },
  getPublicShowcaseCategories: async () => {
    // Points to the public route /categories/home-showcase
    const response = await api.get('/categories/home-showcase');
    return response.data;
  },

  /**
   * NEW: Update Home Page settings (Order/Featured)
   */
  updateHomeShowcaseCategorySettings: async (id: string, data: { order?: number; isFeatured?: boolean }) => {
    const response = await api.patch(`/admin/categories/${id}/home-showcase`, data);
    return response.data;
  }
};

export default categoryAPI;