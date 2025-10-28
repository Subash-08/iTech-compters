// src/components/reviews/ReviewForm.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reviewActions } from '../../redux/actions/reviewActions';
import { RootState } from '../../redux/store';
import { Review, CreateReviewData } from '../../redux/types/reviewTypes';
import { X, Star } from 'lucide-react';
import { toast } from 'react-toastify';

interface ReviewFormProps {
  productId: string;
  existingReview?: Review | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  existingReview,
  onClose,
  onSuccess
}) => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state: RootState) => state.reviewState);
  const { user } = useSelector((state: RootState) => state.authState);
  
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoverRating, setHoverRating] = useState(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (success) {
      toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
      onSuccess?.();
      onClose();
      dispatch(reviewActions.clearReviewSuccess());
    }
  }, [success, onSuccess, onClose, dispatch, existingReview]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(reviewActions.clearReviewError());
    }
  }, [error, dispatch]);

  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setTouched(true);
  
  if (!user) {
    toast.error('Please login to submit a review');
    return;
  }

  if (rating === 0) {
    toast.error('Please select a rating');
    return;
  }

  const reviewData: CreateReviewData = { rating, comment };
  
  try {
    if (existingReview) {
      // ✅ FIXED: Remove reviewId parameter
      await dispatch(reviewActions.updateReview(productId, reviewData));
    } else {
      await dispatch(reviewActions.createReview(productId, reviewData));
    }
  } catch (error) {
    // Error handled by thunk
  }
};
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`p-1 transition-transform hover:scale-110 ${
          star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
        } hover:text-yellow-400`}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        disabled={loading}
      >
        <Star 
          size={32} 
          fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} 
        />
      </button>
    ));
  };

  const getRatingText = (rating: number) => {
    const ratings = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratings[rating as keyof typeof ratings] || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            disabled={loading}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate this product? *
            </label>
            <div className="flex items-center justify-center space-x-1 mb-2">
              {renderStars()}
            </div>
            <div className="text-sm text-gray-600">
              {rating > 0 ? (
                <span className="font-medium text-yellow-600">
                  {rating} {rating === 1 ? 'star' : 'stars'} - {getRatingText(rating)}
                </span>
              ) : (
                'Select your rating'
              )}
            </div>
            {touched && rating === 0 && (
              <p className="text-red-500 text-xs mt-1">Please select a rating</p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review {!existingReview && '(Optional)'}
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
              placeholder="Share your experience with this product... What did you like or dislike?"
              disabled={loading}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {comment.length}/1000 characters
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {existingReview ? 'Updating...' : 'Submitting...'}
                </span>
              ) : existingReview ? (
                'Update Review'
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;