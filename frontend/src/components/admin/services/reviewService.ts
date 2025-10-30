import api from '../../config/axiosConfig';
import { Review, ReviewFilters } from './types/review';

export const reviewService = {
  // Get all reviews directly from Review collection (Admin)
  async getAdminReviews(filters: { 
    search?: string; 
    rating?: string; 
    page?: number; 
    limit?: number;
  } = {}) {
    const response = await api.get('/admin/reviews', { 
      params: filters 
    });
    return response.data;
  },

  // Get reviews for a specific product
  async getProductReviews(productId: string) {
    const response = await api.get(`/product/${productId}/reviews`);
    return response.data;
  },

  // Admin delete any review (now only needs reviewId)
  async deleteReview(reviewId: string) {
    const response = await api.delete(`/admin/review/${reviewId}`);
    return response.data;
  }
};