// src/redux/actions/reviewActions.ts
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig'; 
import { CreateReviewData } from '../types/reviewTypes';
import { 
  createReviewStart, createReviewSuccess, createReviewFailure,
  updateReviewStart, updateReviewSuccess, updateReviewFailure,
  deleteReviewStart, deleteReviewSuccess, deleteReviewFailure,
  getProductReviewsStart, getProductReviewsSuccess, getProductReviewsFailure,
  clearReviewError, clearReviewSuccess
} from '../slices/reviewSlice'; // ✅ IMPORT ACTIONS FROM SLICE

export const reviewActions = {
  // Fetch Reviews
  getProductReviews: (productId: string) => async (dispatch: any) => {
    if (!productId || productId === 'undefined') return;

    try {
      dispatch(getProductReviewsStart()); // ✅ Use slice action
      
      const response = await api.get(`/product/${productId}/reviews`);
      
      dispatch(getProductReviewsSuccess({ // ✅ Use slice action
        productId,
        reviews: response.data.data?.reviews || response.data.reviews || [],
        averageRating: response.data.data?.averageRating || 0,
        totalReviews: response.data.data?.totalReviews || 0
      }));
    } catch (error: any) {
      console.error('❌ Get reviews error:', error);
      const msg = error.response?.data?.message || 'Failed to fetch reviews';
      dispatch(getProductReviewsFailure(msg));
    }
  },

  // Create Review
  createReview: (productId: string, reviewData: CreateReviewData) => async (dispatch: any) => {
    try {
      dispatch(createReviewStart());
      const response = await api.post(`/product/${productId}/review`, reviewData);
      
      dispatch(createReviewSuccess({
        productId,
        review: response.data.review,
        averageRating: response.data.product?.averageRating,
        totalReviews: response.data.product?.totalReviews,
      }));
      
      toast.success('Review submitted successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to submit review';
      dispatch(createReviewFailure(msg));
      
      if (error.response?.status === 400 && msg.includes('already reviewed')) {
        toast.info('You have already reviewed this product');
      } else {
        toast.error(msg);
      }
    }
  },

  // Update Review
  updateReview: (productId: string, reviewData: CreateReviewData) => async (dispatch: any) => {
    try {
      dispatch(updateReviewStart());
      const response = await api.put(`/product/${productId}/review`, reviewData);
      
      dispatch(updateReviewSuccess({
        productId,
        review: response.data.review,
        averageRating: response.data.product?.averageRating,
        totalReviews: response.data.product?.totalReviews,
      }));
      
      toast.success('Review updated successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update review';
      dispatch(updateReviewFailure(msg));
      toast.error(msg);
    }
  },

  // Admin delete any review (ADMIN ONLY)
  adminDeleteReview: (productId: string, reviewId: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/adminDeleteReviewStart' });
      
      // ✅ FIXED: Add /api/v1 base path
      const response = await api.delete(`/admin/product/${productId}/review/${reviewId}`);
      
      dispatch({
        type: 'review/adminDeleteReviewSuccess',
        payload: {
          productId,
          reviewId,
          averageRating: response.data.product?.averageRating,
          totalReviews: response.data.product?.totalReviews,
        },
      });
      
      toast.success('Review deleted successfully!');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Admin delete review error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to delete review';
      dispatch({
        type: 'review/adminDeleteReviewFailure',
        payload: errorMessage,
      });
      
      if (error.response?.status === 401) {
        toast.error('Please login as admin');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else if (error.response?.status === 404) {
        toast.error('Review not found');
      } else {
        toast.error('Failed to delete review. Please try again.');
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Clear review error
  clearReviewError: () => ({
    type: 'review/clearReviewError',
  }),

  // Clear review success
  clearReviewSuccess: () => ({
    type: 'review/clearReviewSuccess',
  }),

  // Clear product reviews (when leaving product page)
  clearProductReviews: (productId: string) => ({
    type: 'review/clearProductReviews',
    payload: productId,
  }),
};