// src/redux/selectors/reviewSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectReviewState = (state: RootState) => state.reviewState;

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

export const selectProductReviews = createSelector(
  [selectReviewState],
  (reviewState) => reviewState.productReviews
);

// Derived selectors
export const selectReviewsByProductId = (productId: string) => 
  createSelector(
    [selectProductReviews],
    (productReviews) => productReviews[productId] || {
      reviews: [],
      averageRating: 0,
      totalReviews: 0,
    }
  );

export const selectUserReviewForProduct = (productId: string, userId?: string) => 
  createSelector(
    [selectReviewsByProductId(productId)],
    (reviewsData) => {
      if (!userId) return null;
      return reviewsData.reviews.find(review => review.user && review.user._id === userId) || null;
    }
  );

export const selectHasUserReviewed = (productId: string, userId?: string) => 
  createSelector(
    [selectUserReviewForProduct(productId, userId)],
    (userReview) => userReview !== null
  );

export const selectReviewStats = (productId: string) =>
  createSelector(
    [selectReviewsByProductId(productId)],
    (reviewsData) => ({
      averageRating: reviewsData.averageRating,
      totalReviews: reviewsData.totalReviews,
    })
  );