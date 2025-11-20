import api from '../../config/axiosConfig';
import { Coupon, CouponFormData, CouponFilters, CouponValidationRequest, CouponValidationResponse } from '../types/coupon';

export const couponService = {
  // Get all coupons (admin)
  async getCoupons(filters: CouponFilters = { 
    search: '', 
    status: '', 
    discountType: '',
    page: 1, 
    limit: 10 
  }) {
    const response = await api.get('/admin/coupons', { params: filters });
    return response.data;
  },

  // Get single coupon
  async getCoupon(id: string) {
    const response = await api.get(`/admin/coupons/${id}`);
    return response.data;
  },

  // Create coupon
  async createCoupon(formData: CouponFormData) {
    const response = await api.post('/admin/coupons', formData);
    return response.data;
  },

  // Update coupon
  async updateCoupon(id: string, formData: CouponFormData) {
    const response = await api.put(`/admin/coupons/${id}`, formData);
    return response.data;
  },

  // Update coupon status
  async updateCouponStatus(id: string, status: 'active' | 'inactive') {
    const response = await api.patch(`/admin/coupons/${id}/status`, { status });
    return response.data;
  },

  // Delete coupon
  async deleteCoupon(id: string) {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },

  // Validate coupon (user)
  async validateCoupon(validationData: CouponValidationRequest) {
    const response = await api.post('/coupons/validate', validationData);
    return response.data;
  },

  // Get active coupons for user
  async getActiveCoupons() {
    const response = await api.get('/coupons/active');
    return response.data;
  }
};