// src/redux/selectors/reviewSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectReviewState = (state: RootState) => state.reviewState;
const selectProductReviews = (state: RootState) => state.reviewState.productReviews;

// Base selectors
export const selectReviewLoading = createSelector(
  [selectReviewState],
  (reviewState) => reviewState.loading
);

export const selectReviewError = createSelector(
  [selectReviewState],
  (reviewState) => reviewState.error
);

export const selectReviewSuccess = createSelector(
  [selectReviewState],
  (reviewState) => reviewState.success
);

// ✅ FIXED: Memoized selector for product reviews with stable reference
export const selectReviewsByProductId = (productId: string) => 
  createSelector(
    [selectProductReviews],
    (productReviews) => {
      const defaultData = {
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
      };
      
      if (!productId) return defaultData;
      
      const productData = productReviews[productId];
      if (!productData) return defaultData;
      
      // Return stable reference
      return {
        reviews: productData.reviews || [],
        averageRating: productData.averageRating || 0,
        totalReviews: productData.totalReviews || 0,
      };
    }
  );

// ✅ FIXED: Memoized selector for user review
export const selectUserReviewForProduct = (productId: string, userId?: string) => 
  createSelector(
    [selectReviewsByProductId(productId)],
    (reviewsData) => {
      if (!userId || !reviewsData.reviews.length) return null;
      
      const userReview = reviewsData.reviews.find(review => {
        if (!review || !review.user) return false;
        
        const reviewUserId = typeof review.user === 'object' ? review.user._id : review.user;
        return reviewUserId === userId;
      });
      
      return userReview || null;
    }
  );

// ✅ ADDED: Missing export - check if user has reviewed
export const selectHasUserReviewed = (productId: string, userId?: string) => 
  createSelector(
    [selectUserReviewForProduct(productId, userId)],
    (userReview) => userReview !== null
  );

// Hook-friendly versions for better performance
export const useSelectReviewsByProductId = (productId: string) => 
  createSelector(
    [selectProductReviews],
    (productReviews) => {
      const defaultData = {
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
      };
      
      if (!productId) return defaultData;
      
      const productData = productReviews[productId];
      if (!productData) return defaultData;
      
      return {
        reviews: productData.reviews || [],
        averageRating: productData.averageRating || 0,
        totalReviews: productData.totalReviews || 0,
      };
    }
  );

export const useSelectUserReviewForProduct = (productId: string, userId?: string) => 
  createSelector(
    [useSelectReviewsByProductId(productId)],
    (reviewsData) => {
      if (!userId || !reviewsData.reviews.length) return null;
      
      return reviewsData.reviews.find(review => {
        if (!review || !review.user) return false;
        
        const reviewUserId = typeof review.user === 'object' ? review.user._id : review.user;
        return reviewUserId === userId;
      }) || null;
    }
  );

export const useSelectHasUserReviewed = (productId: string, userId?: string) => 
  createSelector(
    [useSelectUserReviewForProduct(productId, userId)],
    (userReview) => userReview !== null
  );