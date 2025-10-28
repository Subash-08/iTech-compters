// src/redux/actions/reviewActions.ts
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { CreateReviewData, Review } from '../types/reviewTypes';

// Action creators
export const reviewActions = {
  // Get product reviews (PUBLIC) - No changes needed
  getProductReviews: (productId: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/getProductReviewsStart' });
            
      const response = await api.get(`/product/${productId}/reviews`);
      
      dispatch({
        type: 'review/getProductReviewsSuccess',
        payload: {
          productId,
          reviews: response.data.reviews || [],
          averageRating: response.data.averageRating || 0,
          totalReviews: response.data.totalReviews || 0,
        },
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Get reviews error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch reviews';
      dispatch({
        type: 'review/getProductReviewsFailure',
        payload: errorMessage,
      });
      
      console.warn('Failed to fetch reviews:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Create review (LOGGED-IN USERS ONLY) - No changes needed
  createReview: (productId: string, reviewData: CreateReviewData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/createReviewStart' });
      
      const response = await api.post(`/product/${productId}/review`, reviewData);
      
      dispatch({
        type: 'review/createReviewSuccess',
        payload: {
          productId,
          review: response.data.review,
          averageRating: response.data.product?.averageRating, // ✅ FIXED: Changed from ratings
          totalReviews: response.data.product?.totalReviews,   // ✅ FIXED: Changed from numOfReviews
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

  // ✅ FIXED: Update review - Remove reviewId parameter since backend finds by user ID
  updateReview: (productId: string, reviewData: CreateReviewData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/updateReviewStart' });
      
      // ✅ FIXED: Remove reviewId from URL since backend finds by user ID
      const response = await api.put(`/product/${productId}/review`, reviewData);
      
      dispatch({
        type: 'review/updateReviewSuccess',
        payload: {
          productId,
          review: response.data.review,
          averageRating: response.data.product?.averageRating, // ✅ FIXED: Changed from ratings
          totalReviews: response.data.product?.totalReviews,   // ✅ FIXED: Changed from numOfReviews
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

  // ✅ FIXED: Delete review - Remove reviewId parameter since backend finds by user ID
  deleteReview: (productId: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/deleteReviewStart' });
      
      // ✅ FIXED: Remove reviewId from URL since backend finds by user ID
      const response = await api.delete(`/product/${productId}/review`);
      
      dispatch({
        type: 'review/deleteReviewSuccess',
        payload: {
          productId,
          averageRating: response.data.product?.averageRating, // ✅ FIXED: Changed from ratings
          totalReviews: response.data.product?.totalReviews,   // ✅ FIXED: Changed from numOfReviews
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

  // Admin delete any review (ADMIN ONLY) - Keep reviewId for admin
  adminDeleteReview: (productId: string, reviewId: string) => async (dispatch: any) => {
    try {
      dispatch({ type: 'review/adminDeleteReviewStart' });
      
      const response = await api.delete(`/admin/product/${productId}/review/${reviewId}`);
      
      dispatch({
        type: 'review/adminDeleteReviewSuccess',
        payload: {
          productId,
          reviewId,
          averageRating: response.data.product?.averageRating, // ✅ FIXED: Changed from ratings
          totalReviews: response.data.product?.totalReviews,   // ✅ FIXED: Changed from numOfReviews
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