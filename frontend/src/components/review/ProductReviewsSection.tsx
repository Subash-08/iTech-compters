// src/components/reviews/ProductReviewsSection.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { reviewActions } from '../../redux/actions/reviewActions';
import { selectReviewsByProductId, selectHasUserReviewed } from '../../redux/selectors/reviewSelectors';
import ReviewsList from './ReviewsList';
import ReviewForm from './ReviewForm';
import { Star, MessageSquare, Plus } from 'lucide-react';

interface ProductReviewsSectionProps {
  productId: string;
  product?: {
    averageRating?: number;
    totalReviews?: number;
    name?: string;
  };
}

// Helper function to format user names
const formatUserName = (user: any) => {
  if (!user) return 'Anonymous';
  
  if (user.fullName && user.fullName !== 'undefined undefined') {
    return user.fullName;
  }
  
  if (user.firstName) {
    return `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim();
  }
  
  return user.email?.split('@')[0] || 'User';
};

const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ 
  productId, 
  product 
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.authState);
  
  const reviewsData = useSelector((state: RootState) => 
    selectReviewsByProductId(productId)(state)
  );
  const userHasReviewed = useSelector((state: RootState) => 
    selectHasUserReviewed(productId, user?._id)(state)
  );

  const [showReviewForm, setShowReviewForm] = useState(false);

  // Use product data as fallback if reviews data is not loaded yet
  const averageRating = reviewsData.averageRating || product?.averageRating || 0;
  const totalReviews = reviewsData.totalReviews || product?.totalReviews || 0;

  useEffect(() => {
    // Load reviews when component mounts
    dispatch(reviewActions.getProductReviews(productId));
  }, [dispatch, productId]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    // Refresh reviews data - this will trigger a re-render
    dispatch(reviewActions.getProductReviews(productId));
  };

  const handleReviewDelete = () => {
    // Refresh reviews data after delete
    dispatch(reviewActions.getProductReviews(productId));
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

  return (
    <section className="border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header - Always visible */}
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
                
                {user && !userHasReviewed && (
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
              {user && !userHasReviewed && (
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

        {/* Reviews List - Always visible */}
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
                onClick={() => window.location.href = '/login'}
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

export { formatUserName };
export default ProductReviewsSection;