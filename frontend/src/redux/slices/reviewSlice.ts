// src/redux/slices/reviewSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReviewState, Review } from '../types/reviewTypes';

const initialState: ReviewState = {
  loading: false,
  error: null,
  success: false,
  productReviews: {},
};

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    // Start actions
    createReviewStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    updateReviewStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    deleteReviewStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    getProductReviewsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    // ✅ ADDED: Admin actions
    adminDeleteReviewStart: (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    },

    // Success actions
    createReviewSuccess: (state, action: PayloadAction<{ 
      productId: string; 
      review: Review;
      averageRating: number;
      totalReviews: number;
    }>) => {
      state.loading = false;
      state.success = true;
      state.error = null;

      const { productId, review, averageRating, totalReviews } = action.payload;
      
      // Initialize product reviews if not exists
      if (!state.productReviews[productId]) {
        state.productReviews[productId] = {
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
        };
      }
      
      // Check if review already exists (update instead of add)
      const existingIndex = state.productReviews[productId].reviews.findIndex(
        rev => rev._id === review._id
      );
      
      if (existingIndex !== -1) {
        // Update existing review
        state.productReviews[productId].reviews[existingIndex] = review;
      } else {
        // Add new review at the beginning
        state.productReviews[productId].reviews.unshift(review);
      }
      
      // Update product stats
      state.productReviews[productId].averageRating = averageRating;
      state.productReviews[productId].totalReviews = totalReviews;
    },

    updateReviewSuccess: (state, action: PayloadAction<{ 
      productId: string; 
      review: Review;
      averageRating?: number;
      totalReviews?: number;
    }>) => {
      state.loading = false;
      state.success = true;
      state.error = null;

      const { productId, review, averageRating, totalReviews } = action.payload;
      
      if (state.productReviews[productId]) {
        const index = state.productReviews[productId].reviews.findIndex(
          rev => rev._id === review._id
        );
        
        if (index !== -1) {
          state.productReviews[productId].reviews[index] = review;
          
          // Update stats if provided
          if (averageRating !== undefined) {
            state.productReviews[productId].averageRating = averageRating;
          }
          if (totalReviews !== undefined) {
            state.productReviews[productId].totalReviews = totalReviews;
          }
        }
      }
    },

    deleteReviewSuccess: (state, action: PayloadAction<{ 
      productId: string; 
      reviewId: string;
    }>) => {
      state.loading = false;
      state.success = true;
      state.error = null;

      const { productId, reviewId } = action.payload;
      
      if (state.productReviews[productId]) {
        state.productReviews[productId].reviews = state.productReviews[productId].reviews.filter(
          rev => rev._id !== reviewId
        );
        state.productReviews[productId].totalReviews = Math.max(
          0, 
          state.productReviews[productId].totalReviews - 1
        );
        
        // Recalculate average rating
        const reviews = state.productReviews[productId].reviews;
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
          state.productReviews[productId].averageRating = Number((totalRating / reviews.length).toFixed(1));
        } else {
          state.productReviews[productId].averageRating = 0;
        }
      }
    },

    // ✅ ADDED: Admin delete success
    adminDeleteReviewSuccess: (state, action: PayloadAction<{ 
      productId: string; 
      reviewId: string;
      averageRating?: number;
      totalReviews?: number;
    }>) => {
      state.loading = false;
      state.success = true;
      state.error = null;

      const { productId, reviewId, averageRating, totalReviews } = action.payload;
      
      if (state.productReviews[productId]) {
        // Remove the specific review
        state.productReviews[productId].reviews = state.productReviews[productId].reviews.filter(
          rev => rev._id !== reviewId
        );
        
        // Update stats if provided, otherwise recalculate
        if (averageRating !== undefined && totalReviews !== undefined) {
          state.productReviews[productId].averageRating = averageRating;
          state.productReviews[productId].totalReviews = totalReviews;
        } else {
          state.productReviews[productId].totalReviews = Math.max(
            0, 
            state.productReviews[productId].totalReviews - 1
          );
          
          // Recalculate average rating
          const reviews = state.productReviews[productId].reviews;
          if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
            state.productReviews[productId].averageRating = Number((totalRating / reviews.length).toFixed(1));
          } else {
            state.productReviews[productId].averageRating = 0;
          }
        }
      }
    },

    getProductReviewsSuccess: (state, action: PayloadAction<{ 
      productId: string; 
      reviews: Review[]; 
      averageRating: number; 
      totalReviews: number;
    }>) => {
      state.loading = false;
      state.error = null;

      const { productId, reviews, averageRating, totalReviews } = action.payload;
      state.productReviews[productId] = {
        reviews: reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        averageRating,
        totalReviews,
      };
    },

    // Failure actions
    createReviewFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
    updateReviewFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
    deleteReviewFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
    getProductReviewsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // ✅ ADDED: Admin delete failure
    adminDeleteReviewFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },

    // Utility actions
    clearReviewError: (state) => {
      state.error = null;
    },
    clearReviewSuccess: (state) => {
      state.success = false;
    },
    clearProductReviews: (state, action: PayloadAction<string>) => {
      delete state.productReviews[action.payload];
    },
  },
});

export const {
  createReviewStart,
  createReviewSuccess,
  createReviewFailure,
  updateReviewStart,
  updateReviewSuccess,
  updateReviewFailure,
  deleteReviewStart,
  deleteReviewSuccess,
  deleteReviewFailure,
  getProductReviewsStart,
  getProductReviewsSuccess,
  getProductReviewsFailure,
  adminDeleteReviewStart,
  adminDeleteReviewSuccess,
  adminDeleteReviewFailure,
  clearReviewError,
  clearReviewSuccess,
  clearProductReviews,
} = reviewSlice.actions;

export default reviewSlice.reducer;