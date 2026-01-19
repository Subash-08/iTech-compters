// services/featuredBrandService.ts
import api from '../../config/axiosConfig';
import { 
  FeaturedBrand, 
  FeaturedBrandFormData, 
  FeaturedBrandFilters,
  FeaturedBrandsResponse,
  FeaturedBrandResponse,
  FeaturedBrandCountResponse
} from '../types/featuredBrand';

export const featuredBrandService = {
  // Get all featured brands for public display
  async getFeaturedBrands(): Promise<FeaturedBrandsResponse> {
    const response = await api.get('/featured-brands');
    return response.data;
  },

  // Get featured brands count (to check if section should be shown)
  async getFeaturedBrandsCount(): Promise<FeaturedBrandCountResponse> {
    const response = await api.get('/featured-brands/count');
    return response.data;
  },

async getAdminFeaturedBrands(filters?: FeaturedBrandFilters) {
  const response = await api.get('/admin/featured-brands', { params: filters });
  return response.data;
},

async getFeaturedBrandById(id: string) {
  const response = await api.get(`/admin/featured-brands/${id}`);
  return response.data;
},

async createFeaturedBrand(formData: FormData) {
  const response = await api.post('/admin/featured-brands', formData);
  return response.data;
},

async updateFeaturedBrand(id: string, formData: FormData) {
  const response = await api.put(`/admin/featured-brands/${id}`, formData);
  return response.data;
},

async updateFeaturedBrandStatus(id: string, status: 'active' | 'inactive') {
  const response = await api.patch(`/admin/featured-brands/${id}/status`, { status });
  return response.data;
},

async updateDisplayOrder(brands) {
  const response = await api.put('/admin/featured-brands/update-order', { brands });
  return response.data;
},

async deleteFeaturedBrand(id: string) {
  const response = await api.delete(`/admin/featured-brands/${id}`);
  return response.data;
}
};