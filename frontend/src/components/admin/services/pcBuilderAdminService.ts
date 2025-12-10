import api from '../../config/axiosConfig';
import {
  PCRequirementDocument,
  PCQuoteDocument,
  PCRequirementFilters,
  PCQuoteFilters,
  PCRequirementStats,
  PCQuoteStats
} from '../types/pcBuilderAdmin';

export const pcBuilderAdminService = {
  // PC Requirements
  async getPCRequirements(filters: PCRequirementFilters = {}) {
    const response = await api.get('/custom-pc/admin/requirements', {
      params: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
      }
    });
    return response.data;
  },

  async getPCRequirement(id: string) {
    const response = await api.get(`/custom-pc/admin/requirements/${id}`);
    return response.data;
  },

  async updatePCRequirement(
    id: string,
    data: {
      status?: string;
      adminNotes?: string;
      assignedTo?: string;
      recommendations?: any[];
      estimatedTotal?: number;
    }
  ) {
    const response = await api.put(`/custom-pc/admin/requirements/${id}`, data);
    return response.data;
  },

  async getPCRequirementsStats() {
    const response = await api.get('/custom-pc/admin/requirements/stats');
    return response.data;
  },

  // PC Quotes
  async getPCQuotes(filters: PCQuoteFilters = {}) {
    const response = await api.get('/custom-pc/admin/quotes', {
      params: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status,
        search: filters.search,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice
      }
    });
    return response.data;
  },

  async getPCQuote(id: string) {
    const response = await api.get(`/custom-pc/admin/quotes/${id}`);
    return response.data;
  },

  async updateQuoteStatus(
    id: string,
    data: {
      status?: string;
      adminNotes?: string;
      assignedTo?: string;
    }
  ) {
    const response = await api.put(`/custom-pc/admin/quotes/${id}/status`, data);
    return response.data;
  },
  async deleteQuote(id: string) {
    const response = await api.delete(`/custom-pc/admin/quotes/${id}`);
    return response.data;
  },

  async getQuoteStats() {
    const response = await api.get('/custom-pc/admin/quotes/stats');
    return response.data;
  }
};