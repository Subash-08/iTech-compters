// redux/actions/preBuiltPCActions.ts
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { 
  PreBuiltPC, 
  PreBuiltPCsResponse, 
  PreBuiltPCFilters,
  AvailablePreBuiltPCFilters 
} from '../types/preBuiltPCTypes';

// API Service
export const preBuiltPCAPI = {
  // Get all pre-built PCs with filters
  getPreBuiltPCs: async (filters: PreBuiltPCFilters): Promise<PreBuiltPCsResponse> => {
    try {
      const params: Record<string, any> = {
        page: filters.page || 1,
        limit: filters.limit || 12,
      };

      // Apply filters
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice && filters.maxPrice > 0) params.maxPrice = filters.maxPrice;
      if (filters.tags) params.tags = filters.tags;
      if (filters.search) params.search = filters.search;
      if (filters.featured) params.featured = 'true';
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.inStock) params.inStock = 'true';

      // Sort mapping
      const sortMap: Record<string, string> = {
        'featured': 'featured',
        'newest': 'newest',
        'price-low': 'price-low',
        'price-high': 'price-high',
        'performance': 'performance',
        'gaming': 'gaming',
        'productivity': 'productivity'
      };
      
      if (filters.sortBy) {
        params.sortBy = sortMap[filters.sortBy] || 'featured';
      }

      const response = await api.get<PreBuiltPCsResponse>('/prebuilt-pcs', { params });

      
      return {
        ...response.data,
        currentPage: filters.page || 1,
        totalPages: Math.ceil(response.data.total / (filters.limit || 12)),
        hasNext: (filters.page || 1) < Math.ceil(response.data.total / (filters.limit || 12)),
        hasPrev: (filters.page || 1) > 1
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch pre-built PCs';
      throw new Error(errorMessage);
    }
  },

  // Get featured pre-built PCs
  getFeaturedPreBuiltPCs: async (): Promise<PreBuiltPC[]> => {
    try {
      const response = await api.get<PreBuiltPCsResponse>('/prebuilt-pcs/featured');
      return response.data.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch featured PCs';
      throw new Error(errorMessage);
    }
  },

  // Get single pre-built PC by ID
  getPreBuiltPC: async (id: string): Promise<PreBuiltPC> => {
    try {
      const response = await api.get<{ success: boolean; data: PreBuiltPC }>(`/prebuilt-pcs/${id}`);
      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch pre-built PC';
      throw new Error(errorMessage);
    }
  },

  // Get pre-built PC by slug
  getPreBuiltPCBySlug: async (slug: string): Promise<PreBuiltPC> => {
    try {
      const response = await api.get<{ success: boolean; data: PreBuiltPC }>(`/prebuilt-pcs/slug/${slug}`);
            return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch pre-built PC';
      throw new Error(errorMessage);
    }
  },

  // Get categories
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>('/prebuilt-pcs/categories');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch categories';
      throw new Error(errorMessage);
    }
  },

  // Get PCs by performance
  getPCsByPerformance: async (filters: { minRating?: number; category?: string; sortBy?: string; limit?: number }): Promise<PreBuiltPC[]> => {
    try {
      const params: Record<string, any> = {};
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.category) params.category = filters.category;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.limit) params.limit = filters.limit;

      const response = await api.get<PreBuiltPCsResponse>('/prebuilt-pcs/performance', { params });
      return response.data.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch PCs by performance';
      throw new Error(errorMessage);
    }
  },

  // Get benchmark categories
  getBenchmarkCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>('/prebuilt-pcs/benchmark-categories');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch benchmark categories';
      throw new Error(errorMessage);
    }
  },

  // Search pre-built PCs
  searchPreBuiltPCs: async (query: string, limit: number = 5): Promise<PreBuiltPC[]> => {
    try {
      const params: Record<string, any> = {
        search: query,
        limit: limit,
      };

      const response = await api.get<PreBuiltPCsResponse>('/prebuilt-pcs', { params });
      return response.data.data || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Search failed';
      throw new Error(errorMessage);
    }
  },

  // Get price range
  getPriceRange: async (filters: Partial<PreBuiltPCFilters>): Promise<{ minPrice: number; maxPrice: number }> => {
    try {
      // Remove price filters for base range calculation
      const rangeFilters = { ...filters };
      delete rangeFilters.minPrice;
      delete rangeFilters.maxPrice;
      
      const priceRangeParams = {
        ...rangeFilters,
        limit: 1000,
        page: 1,
        sortBy: 'price-low'
      };

      const response = await preBuiltPCAPI.getPreBuiltPCs(priceRangeParams);
      
      if (response.data.length > 0) {
        const prices = response.data.map(pc => pc.discountPrice || pc.totalPrice);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        
        return {
          minPrice: Math.max(0, minPrice),
          maxPrice: Math.max(minPrice + 100, maxPrice)
        };
      }

      return { minPrice: 0, maxPrice: 5000 };
    } catch (error: any) {
      console.error('Error fetching price range:', error.message);
      return { minPrice: 0, maxPrice: 5000 };
    }
  }
};

// Action Creators
export const preBuiltPCActions = {
  // Fetch all pre-built PCs with filters
  fetchPreBuiltPCs: (filters: PreBuiltPCFilters) => async (dispatch: any) => {
    try {
      dispatch({ type: 'preBuiltPCs/fetchPreBuiltPCsStart' });
      
      const response = await preBuiltPCAPI.getPreBuiltPCs(filters);
      
      dispatch({
        type: 'preBuiltPCs/fetchPreBuiltPCsSuccess',
        payload: {
          preBuiltPCs: response.data,
          totalPages: response.totalPages || 1,
          totalProducts: response.total || 0,
          currentPage: response.currentPage || 1,
        },
      });

      // Extract available filters
      dispatch(preBuiltPCActions.extractAvailableFilters(response.data));
      
      // Fetch base price range
      const baseFilters = { 
        ...filters,
        minPrice: undefined,
        maxPrice: undefined,
        limit: 1000, 
        page: 1, 
        sortBy: 'price-low' 
      };
      
      dispatch(preBuiltPCActions.fetchBasePriceRange(baseFilters));
      
    } catch (error: any) {
      dispatch({
        type: 'preBuiltPCs/fetchPreBuiltPCsFailure',
        payload: error.message,
      });
      toast.error(error.message);
    }
  },

  // Fetch featured PCs
  fetchFeaturedPreBuiltPCs: () => async (dispatch: any) => {
    try {
      dispatch({ type: 'preBuiltPCs/fetchFeaturedPCsStart' });
      
      const featuredPCs = await preBuiltPCAPI.getFeaturedPreBuiltPCs();
      
      dispatch({
        type: 'preBuiltPCs/fetchFeaturedPCsSuccess',
        payload: featuredPCs,
      });
    } catch (error: any) {
      dispatch({
        type: 'preBuiltPCs/fetchFeaturedPCsFailure',
        payload: error.message,
      });
      toast.error(error.message);
    }
  },

  // Fetch single PC by ID
  fetchPreBuiltPC: (id: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'preBuiltPCs/fetchPreBuiltPCStart' });
      
      const pc = await preBuiltPCAPI.getPreBuiltPC(id);
      
      dispatch({
        type: 'preBuiltPCs/fetchPreBuiltPCSuccess',
        payload: pc,
      });
    } catch (error: any) {
      dispatch({
        type: 'preBuiltPCs/fetchPreBuiltPCFailure',
        payload: error.message,
      });
      toast.error(error.message);
    }
  },

  // Fetch single PC by slug
  fetchPreBuiltPCBySlug: (slug: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'preBuiltPCs/fetchPreBuiltPCStart' });
      
      const pc = await preBuiltPCAPI.getPreBuiltPCBySlug(slug);
      
      dispatch({
        type: 'preBuiltPCs/fetchPreBuiltPCSuccess',
        payload: pc,
      });
    } catch (error: any) {
      dispatch({
        type: 'preBuiltPCs/fetchPreBuiltPCFailure',
        payload: error.message,
      });
      toast.error(error.message);
    }
  },

  // Fetch PCs by performance
  fetchPCsByPerformance: (filters: { minRating?: number; category?: string; sortBy?: string; limit?: number }) => async (dispatch: any) => {
    try {
      dispatch({ type: 'preBuiltPCs/fetchPCsByPerformanceStart' });
      
      const pcs = await preBuiltPCAPI.getPCsByPerformance(filters);
      
      dispatch({
        type: 'preBuiltPCs/fetchPCsByPerformanceSuccess',
        payload: pcs,
      });
    } catch (error: any) {
      dispatch({
        type: 'preBuiltPCs/fetchPreBuiltPCsFailure',
        payload: error.message,
      });
      toast.error(error.message);
    }
  },

  // Extract available filters
  extractAvailableFilters: (preBuiltPCs: PreBuiltPC[]) => (dispatch: any) => {
    const categories = new Set<string>();

    preBuiltPCs.forEach(pc => {
      if (pc.category) {
        categories.add(pc.category);
      }
    });

    const availableFilters: Partial<AvailablePreBuiltPCFilters> = {
      categories: Array.from(categories).sort(),
    };

    dispatch({
      type: 'preBuiltPCs/updateAvailableFilters',
      payload: availableFilters,
    });
  },

  // Fetch base price range
  fetchBasePriceRange: (filters: Partial<PreBuiltPCFilters>) => async (dispatch: any) => {
    try {
      const priceRange = await preBuiltPCAPI.getPriceRange(filters);
      
      dispatch({
        type: 'preBuiltPCs/updateAvailableFilters',
        payload: {
          priceRange: {
            min: priceRange.minPrice,
            max: priceRange.maxPrice,
          },
          baseMinPrice: priceRange.minPrice,
          baseMaxPrice: priceRange.maxPrice,
        },
      });
    } catch (error) {
      console.error('Error fetching base price range:', error);
      dispatch({
        type: 'preBuiltPCs/updateAvailableFilters',
        payload: {
          priceRange: {
            min: 0,
            max: 5000,
          },
          baseMinPrice: 0,
          baseMaxPrice: 5000,
        },
      });
    }
  },

  // Quick search
  quickSearch: (query: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'preBuiltPCs/searchPreBuiltPCsStart' });
      
      const results = await preBuiltPCAPI.searchPreBuiltPCs(query, 5);
      
      dispatch({
        type: 'preBuiltPCs/searchPreBuiltPCsSuccess',
        payload: results,
      });
    } catch (error: any) {
      dispatch({
        type: 'preBuiltPCs/searchPreBuiltPCsFailure',
        payload: error.message,
      });
    }
  },

  // Update filters
  updateFilters: (filters: Partial<PreBuiltPCFilters>) => ({
    type: 'preBuiltPCs/updateFilters',
    payload: filters,
  }),

  // Clear filters
  clearFilters: () => ({
    type: 'preBuiltPCs/clearFilters',
  }),

  // Set current page
  setCurrentPage: (page: number) => ({
    type: 'preBuiltPCs/setCurrentPage',
    payload: page,
  }),

  // Set sort by
  setSortBy: (sortBy: string) => ({
    type: 'preBuiltPCs/setSortBy',
    payload: sortBy,
  }),

  // Clear current PC
  clearCurrentPC: () => ({
    type: 'preBuiltPCs/clearCurrentPC',
  }),

  // Clear search results
  clearSearchResults: () => ({
    type: 'preBuiltPCs/clearSearchResults',
  }),

  // Clear error
  clearError: () => ({
    type: 'preBuiltPCs/clearError',
  }),
};