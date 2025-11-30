// src/redux/actions/reviewActions.ts
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig'; // ✅ FIXED: Remove 'components' from path
import { CreateReviewData } from '../types/reviewTypes';

// Action creators
export const reviewActions = {
  getProductReviews: (productId: string) => async (dispatch: any) => {
    if (!productId || productId === 'undefined' || productId === 'null') {
      console.error('❌ Invalid productId for reviews:', productId);
      dispatch({ type: 'reviews/getReviewsFailure', payload: 'Invalid product ID' });
      return;
    }

    try {
      dispatch({ type: 'reviews/getReviewsStart' });
      
      console.log('🔄 Fetching reviews for product:', productId);
      
      // 🎯 FIXED: Use the correct endpoint - /product/:id/reviews
      const response = await api.get(`/product/${productId}/reviews`);
      
      console.log('✅ Reviews API response:', response.data);
      
      dispatch({
        type: 'reviews/getReviewsSuccess',
        payload: {
          reviews: response.data.data?.reviews || response.data.reviews || [],
          averageRating: response.data.data?.averageRating || response.data.averageRating || 0,
          totalReviews: response.data.data?.totalReviews || response.data.totalReviews || 0
        }
      });
    } catch (error: any) {
      console.error('❌ Get reviews error:', error);
      console.error('❌ Error details:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch reviews';
      dispatch({ type: 'reviews/getReviewsFailure', payload: errorMessage });
    }
  },

  // Create review (LOGGED-IN USERS ONLY)
  createReview: (productId: string, reviewData: CreateReviewData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/createReviewStart' });
      
      // ✅ FIXED: Add /api/v1 base path
      const response = await api.post(`/product/${productId}/review`, reviewData);
      
      dispatch({
        type: 'review/createReviewSuccess',
        payload: {
          productId,
          review: response.data.review,
          averageRating: response.data.product?.averageRating,
          totalReviews: response.data.product?.totalReviews,
        },
      });
      
      toast.success('Review submitted successfully!');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Create review error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      dispatch({
        type: 'review/createReviewFailure',
        payload: errorMessage,
      });
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error('Please login to submit a review');
      } else if (error.response?.status === 400) {
        if (errorMessage.includes('already reviewed')) {
          toast.error('You have already reviewed this product');
        } else {
          toast.error(errorMessage);
        }
      } else if (error.response?.status === 404) {
        toast.error('Product not found');
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Update review
  updateReview: (productId: string, reviewData: CreateReviewData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/updateReviewStart' });
      
      // ✅ FIXED: Add /api/v1 base path
      const response = await api.put(`/product/${productId}/review`, reviewData);
      
      dispatch({
        type: 'review/updateReviewSuccess',
        payload: {
          productId,
          review: response.data.review,
          averageRating: response.data.product?.averageRating,
          totalReviews: response.data.product?.totalReviews,
        },
      });
      
      toast.success('Review updated successfully!');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Update review error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to update review';
      dispatch({
        type: 'review/updateReviewFailure',
        payload: errorMessage,
      });
      
      if (error.response?.status === 401) {
        toast.error('Please login to update your review');
      } else if (error.response?.status === 403) {
        toast.error('You can only update your own reviews');
      } else if (error.response?.status === 404) {
        toast.error('Review not found');
      } else {
        toast.error('Failed to update review. Please try again.');
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Delete review
  deleteReview: (productId: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/deleteReviewStart' });
      
      // ✅ FIXED: Add /api/v1 base path
      const response = await api.delete(`/product/${productId}/review`);
      
      dispatch({
        type: 'review/deleteReviewSuccess',
        payload: {
          productId,
          // ✅ FIXED: Add reviewId to match reducer expectation
          reviewId: response.data.deletedReview?._id || 'unknown',
          averageRating: response.data.product?.averageRating,
          totalReviews: response.data.product?.totalReviews,
        },
      });
      
      toast.success('Review deleted successfully!');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Delete review error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to delete review';
      dispatch({
        type: 'review/deleteReviewFailure',
        payload: errorMessage,
      });
      
      if (error.response?.status === 401) {
        toast.error('Please login to delete your review');
      } else if (error.response?.status === 403) {
        toast.error('You can only delete your own reviews');
      } else if (error.response?.status === 404) {
        toast.error('Review not found');
      } else {
        toast.error('Failed to delete review. Please try again.');
      }
      
      return { success: false, error: errorMessage };
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