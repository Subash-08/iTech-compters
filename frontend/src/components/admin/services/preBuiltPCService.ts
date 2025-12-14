// src/services/preBuiltPCService.ts
import api from '../../config/axiosConfig';

// src/services/preBuiltPCService.ts
export interface Component {
  partType: string;
  name: string;
  brand: string;
  specs: string;
  image?: {
    public_id: string;
    url: string;
  };
  // REMOVED: price field
}

export interface BenchmarkTest {
  _id?: string;
  testName: string;
  testCategory: string;
  score: number;
  unit: string;
  description: string;
  settings: {
    resolution: string;
    quality: string;
    otherSettings: string;
  };
  comparison: {
    betterThan: number;
    averageScore: number;
  };
}

export interface PerformanceSummary {
  gamingPerformance: number;
  productivityPerformance: number;
  thermalPerformance: number;
  powerEfficiency: number;
  overallRating: number;
  strengths: string[];
  limitations: string[];
  recommendedUse: string[];
}

export interface PreBuiltPCFormData {
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  tags: string;
  components: Component[];
  // Pricing fields (like product component)
  basePrice: number;
  offerPrice: number;
  discountPercentage: number;
  condition: string;
  // Stock fields
  stockQuantity: number;
  // Other fields
  warranty: string;
  performanceRating: number;
  featured: boolean;
  averageRating: number;
  totalReviews: number;
  benchmarkTests?: BenchmarkTest[];
  performanceSummary?: PerformanceSummary;
  testNotes?: string;
  testedBy?: string;
  testDate?: string;
}

export interface PreBuiltPC {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  shortDescription: string;
  tags: string[];
  components: Component[];
  images: Array<{ public_id: string; url: string }>;
  totalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  isActive: boolean;
  featured: boolean;
  warranty: string;
  performanceRating: number;
  benchmarkTests: BenchmarkTest[];
  performanceSummary: PerformanceSummary;
  testNotes: string;
  testedBy: string;
  testDate: string;
  isTested: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  
  // ✅ ADD THESE REQUIRED PRODUCT COMPATIBILITY FIELDS
  basePrice: number;
  offerPrice: number;
  averageRating: number;
  totalReviews: number;
  condition: string;
}

export interface PreBuiltPCFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  featured?: boolean;
  isTested?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}


export const preBuiltPCService = {
  // Get all pre-built PCs (public/admin)
  async getPreBuiltPCs(filters: PreBuiltPCFilters = { page: 1, limit: 12 }, isAdmin: boolean = false) {
    const endpoint = isAdmin ? '/admin/prebuilt-pcs' : '/prebuilt-pcs';
    const response = await api.get(endpoint, { params: filters });
    return response.data;
  },

  // Get single pre-built PC by ID
  async getPreBuiltPC(id: string) {
    const response = await api.get(`/prebuilt-pcs/${id}`);
    return response.data;
  },
// In preBuiltPCService.ts - FIX error handling
async createPreBuiltPC(formData: FormData) {
  try {
    
    const response = await api.post('/admin/prebuilt-pcs', formData, {
      timeout: 60000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Service Error - createPreBuiltPC:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // FIX: Proper error message extraction
    let errorMessage = 'Failed to create pre-built PC';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
},
// ✅ Status Management (Corrected: Only defined ONCE using PUT)
  async reactivatePreBuiltPC(id: string) {
    const response = await api.put(`/admin/prebuilt-pcs/${id}/reactivate`);
    return response.data;
  },

// Update pre-built PC with better error handling
async updatePreBuiltPC(id: string, formData: FormData) {
  try {
    
    const response = await api.put(`/admin/prebuilt-pcs/${id}`, formData, {
      timeout: 60000,
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Service Error - updatePreBuiltPC:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else {
      throw new Error('Failed to update pre-built PC. Please try again.');
    }
  }
},

  // Delete pre-built PC
  async deletePreBuiltPC(id: string) {
    const response = await api.delete(`/admin/prebuilt-pcs/${id}`);
    return response.data;
  },

  // Soft delete (deactivate) pre-built PC
  async deactivatePreBuiltPC(id: string) {
    const response = await api.put(`/admin/prebuilt-pcs/${id}/deactivate`);
    return response.data;
  },

  // Get categories
  async getCategories() {
    const response = await api.get('/prebuilt-pcs/categories');
    return response.data;
  },

  // Get featured pre-built PCs
  async getFeaturedPreBuiltPCs() {
    const response = await api.get('/prebuilt-pcs/featured');
    return response.data;
  },

  // Get PCs by performance
  async getPCsByPerformance(filters: { minRating?: number; category?: string; sortBy?: string; limit?: number }) {
    const response = await api.get('/prebuilt-pcs/performance', { params: filters });
    return response.data;
  },

  async addBenchmarkTests(id: string, data: {
    benchmarkTests: BenchmarkTest[];
    performanceSummary: PerformanceSummary;
    testNotes: string;
    testedBy: string;
    testDate: string;
  }) {
    const response = await api.post(`/admin/prebuilt-pcs/${id}/benchmark-tests`, data);
    return response.data;
  },

  async updateBenchmarkTest(id: string, testId: string, data: Partial<BenchmarkTest>) {
    const response = await api.put(`/admin/prebuilt-pcs/${id}/benchmark-tests/${testId}`, data);
    return response.data;
  },

  async removeBenchmarkTest(id: string, testId: string) {
    const response = await api.delete(`/admin/prebuilt-pcs/${id}/benchmark-tests/${testId}`);
    return response.data;
  },

  // Get benchmark categories
  async getBenchmarkCategories() {
    const response = await api.get('/prebuilt-pcs/benchmark-categories');
    return response.data;
  },

  // Get performance stats
  async getPerformanceStats() {
    const response = await api.get('/prebuilt-pcs/performance-stats');
    return response.data;
  }
};