// In ProductReviewsSection.tsx - COMPLETE REWORK with proper data flow
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { reviewActions } from '../../redux/actions/reviewActions';
import ReviewsList from './ReviewsList';
import ReviewForm from './ReviewForm';
import { Star, MessageSquare, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductReviewsSectionProps {
  productId: string;
  product?: {
    averageRating?: number;
    totalReviews?: number;
    name?: string;
  };
}

const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ 
  productId, 
  product 
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.authState);
  const navigate = useNavigate();
  
  // 🎯 FIXED: Get reviews from Redux state directly (simpler approach)
  const { reviews, loading, error, averageRating: reviewsRating, totalReviews: reviewsCount } = 
    useSelector((state: RootState) => state.reviewState);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🎯 FIXED: Use product data as primary source, reviews data as fallback
  const averageRating = product?.averageRating || reviewsRating || 0;
  const totalReviews = product?.totalReviews || reviewsCount || 0;

  // 🎯 FIXED: Only fetch when we have a valid productId
  useEffect(() => {    
    if (productId && productId !== 'undefined' && productId !== 'null') {
      setIsInitialized(true);
      dispatch(reviewActions.getProductReviews(productId));
    }
  }, [dispatch, productId]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    if (productId) {
      dispatch(reviewActions.getProductReviews(productId));
    }
  };

  const handleReviewDelete = () => {
    if (productId) {
      dispatch(reviewActions.getProductReviews(productId));
    }
  };

  const renderRatingStars = (rating: number, size: number = 20) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const getRatingSummary = () => {
    if (averageRating >= 4.5) return 'Excellent';
    if (averageRating >= 4.0) return 'Very Good';
    if (averageRating >= 3.5) return 'Good';
    if (averageRating >= 3.0) return 'Average';
    if (averageRating >= 2.0) return 'Poor';
    return 'Very Poor';
  };

  // 🎯 FIXED: Show loading state until initialized
  if (!isInitialized) {
    return (
      <section className="border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-gray-200 mt-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Customer Reviews
              </h2>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      {renderRatingStars(averageRating)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getRatingSummary()} • {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                {user && (
                  <div className="hidden sm:block">
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      <span>Write a Review</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0">
              {user && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="sm:hidden flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full justify-center"
                >
                  <Plus size={16} />
                  <span>Write a Review</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="pb-8 px-4 sm:px-6 lg:px-8">
          <ReviewsList 
            productId={productId} 
            onReviewDelete={handleReviewDelete}
          />

          {/* Call to action for non-logged in users */}
          {!user && (
            <div className="text-center py-8 border-t border-gray-200 mt-8">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Share Your Experience
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Help other customers make informed decisions by sharing your thoughts about {product?.name || 'this product'}.
              </p>
              <button
                onClick={() => navigate('/login')} // 🎯 FIXED: Use navigate function properly
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In to Write a Review
              </button>
            </div>
          )}
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <ReviewForm
            productId={productId}
            onClose={() => setShowReviewForm(false)}
            onSuccess={handleReviewSuccess}
          />
        )}
      </div>
    </section>
  );
};

export default ProductReviewsSection;