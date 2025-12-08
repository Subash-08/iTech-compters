import api from '../../config/axiosConfig';
import { 
  PCBuilderConfig, 
  Product, 
  Pagination,
  Category, 
  PCRequirementStatsResponse,
  PCRequirementsListResponse,
  PCRequirementsRequest,
  PCRequirementsResponse
} from '../types/pcBuilder';

export interface PCQuoteRequest {
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  };
  components: Array<{
    category: string;
    categorySlug: string;
    productId: string | null;
    productName: string;
    productPrice: number;
    userNote: string;
    selected: boolean;
    required: boolean;
    sortOrder: number;
  }>;
  metadata?: {
    source?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface PCQuoteResponse {
  success: boolean;
  message: string;
  quoteId: string;
  totalEstimated: number;
  expiresIn: number;
}

export interface ComponentsResponse {
  products: Product[];
  pagination: Pagination;
  category: {
    name: string;
    slug: string;
    description: string;
  };
  filters: {
    search: string;
    sort: string;
    minPrice: number | null;
    maxPrice: number | null;
    inStock: boolean;
    condition: string | null;
    minRating: number | null;
  };
}

export interface PCQuotesResponse {
  success: boolean;
  quotes: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    status: string;
    search: string;
    dateFrom: string | null;
    dateTo: string | null;
    minPrice: number | null;
    maxPrice: number | null;
  };
}

export interface QuoteStatsResponse {
  success: boolean;
  stats: {
    byStatus: Array<{
      status: string;
      count: number;
      totalValue: number;
      avgValue: number;
    }>;
    total: number;
    pending: number;
    expired: number;
  };
}

export const pcBuilderService = {
  // Get PC builder configuration with categories
  getPCBuilderConfig: async (): Promise<{ success: boolean; config: PCBuilderConfig }> => {
    try {
      const response = await api.get('/custom-pc/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching PC builder config:', error);
      throw error;
    }
  },

  // Get components by category with filters
  getComponentsByCategory: async (
    category: string, 
    params?: {
      search?: string;
      page?: number;
      limit?: number;
      sort?: string;
      minPrice?: string;
      maxPrice?: string;
      brands?: string | string[];
      inStock?: string;
      condition?: string;
      minRating?: string;
    }
  ): Promise<ComponentsResponse> => {
    try {
      const response = await api.get(`/custom-pc/components/${category}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching components by category:', error);
      throw error;
    }
  },

  // Create PC quote request
  createPCQuote: async (data: PCQuoteRequest): Promise<PCQuoteResponse> => {
    try {
      const response = await api.post('/custom-pc/quote', data);
      return response.data;
    } catch (error) {
      console.error('Error creating PC quote:', error);
      throw error;
    }
  },

  // Get all PC quotes (Admin)
  getPCQuotes: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
    minPrice?: string;
    maxPrice?: string;
  }): Promise<PCQuotesResponse> => {
    try {
      const response = await api.get('/custom-pc/admin/quotes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching PC quotes:', error);
      throw error;
    }
  },

  // Get single PC quote (Admin)
  getPCQuote: async (id: string): Promise<{ success: boolean; quote: any }> => {
    try {
      const response = await api.get(`/custom-pc/admin/quotes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PC quote:', error);
      throw error;
    }
  },

  // Update quote status (Admin)
  updateQuoteStatus: async (
    id: string, 
    data: {
      status?: string;
      adminNotes?: string;
      assignedTo?: string;
    }
  ): Promise<{ success: boolean; message: string; quote: any }> => {
    try {
      const response = await api.put(`/custom-pc/admin/quotes/${id}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  },

  // Get quote statistics (Admin)
  getQuoteStats: async (): Promise<QuoteStatsResponse> => {
    try {
      const response = await api.get('/custom-pc/admin/quotes/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching quote stats:', error);
      throw error;
    }
  },

  // Extend quote expiry (Admin)
  extendQuoteExpiry: async (
    id: string, 
    data: { days: number }
  ): Promise<{ success: boolean; message: string; newExpiry: string }> => {
    try {
      const response = await api.put(`/custom-pc/admin/quotes/${id}/extend`, data);
      return response.data;
    } catch (error) {
      console.error('Error extending quote expiry:', error);
      throw error;
    }
  },

  // Delete quote (Admin)
  deleteQuote: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/custom-pc/admin/quotes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  },

  // Get PC categories for dropdown (Admin)
  getPCCategories: async (): Promise<{ success: boolean; categories: Category[] }> => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching PC categories:', error);
      throw error;
    }
  },

  // Search products for component selection
  searchProducts: async (params: {
    search?: string;
    category?: string;
    brand?: string;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; products: Product[]; pagination: Pagination }> => {
    try {
      const response = await api.get('/products/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },
    createPCRequirements: async (data: PCRequirementsRequest): Promise<PCRequirementsResponse> => {
    try {
      const response = await api.post('/custom-pc/requirements', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting PC requirements:', error);
      throw error;
    }
  },

  // Get all PC requirements (Admin)
  getPCRequirements: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PCRequirementsListResponse> => {
    try {
      const response = await api.get('/custom-pc/admin/requirements', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching PC requirements:', error);
      throw error;
    }
  },

  // Get single PC requirement (Admin)
  getPCRequirement: async (id: string): Promise<{ success: boolean; requirement: any }> => {
    try {
      const response = await api.get(`/custom-pc/admin/requirements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PC requirement:', error);
      throw error;
    }
  },

  // Update PC requirement (Admin)
  updatePCRequirement: async (
    id: string,
    data: {
      status?: string;
      adminNotes?: string;
      assignedTo?: string;
      recommendations?: any[];
      estimatedTotal?: number;
    }
  ): Promise<{ success: boolean; message: string; requirement: any }> => {
    try {
      const response = await api.put(`/custom-pc/admin/requirements/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating PC requirement:', error);
      throw error;
    }
  },

  // Get PC requirements statistics (Admin)
  getPCRequirementsStats: async (): Promise<PCRequirementStatsResponse> => {
    try {
      const response = await api.get('/custom-pc/admin/requirements/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching PC requirements stats:', error);
      throw error;
    }
  }
};

export default pcBuilderService;