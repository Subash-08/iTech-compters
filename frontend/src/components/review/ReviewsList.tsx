import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { reviewActions } from '../../redux/actions/reviewActions';
import { useSelectReviewsByProductId, useSelectUserReviewForProduct } from '../../redux/selectors/reviewSelectors';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import { Star, Filter } from 'lucide-react';
import { Review } from '../../redux/types/reviewTypes';

interface ReviewsListProps {
  productId: string;
  onReviewDelete?: () => void;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1';

const ReviewsList: React.FC<ReviewsListProps> = ({ productId, onReviewDelete }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.authState);
  const { loading } = useSelector((state: RootState) => state.reviewState);
  
  // ✅ FIXED: Use stable selectors with useMemo
  const selectReviewsData = React.useMemo(() => 
    useSelectReviewsByProductId(productId), [productId]);
  const selectUserReview = React.useMemo(() => 
    useSelectUserReviewForProduct(productId, user?._id), [productId, user?._id]);
  
  const reviewsData = useSelector(selectReviewsData);
  const userReview = useSelector(selectUserReview);
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Safe destructuring with defaults
  const { reviews = [], averageRating = 0, totalReviews = 0 } = reviewsData;

  useEffect(() => {
    dispatch(reviewActions.getProductReviews(productId));
  }, [dispatch, productId]);

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setShowEditForm(true);
  };

  const handleReviewDelete = () => {
    dispatch(reviewActions.getProductReviews(productId));
    if (onReviewDelete) {
      onReviewDelete();
    }
  };

  const handleReviewSuccess = () => {
    setShowEditForm(false);
    setEditingReview(null);
    dispatch(reviewActions.getProductReviews(productId));
  };

  // ✅ FIXED: Proper rating distribution calculation
  const ratingDistribution = React.useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
      if (review && review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });
    
    return distribution;
  }, [reviews]);

  // Filter and sort reviews
  const filteredAndSortedReviews = React.useMemo(() => {
    let filtered = [...reviews];

    if (filterBy !== 'all') {
      const rating = parseInt(filterBy);
      filtered = filtered.filter(review => review && review.rating === rating);
    }

    switch (sortBy) {
      case 'newest':
        return [...filtered].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return [...filtered].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'highest':
        return [...filtered].sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return [...filtered].sort((a, b) => a.rating - b.rating);
      default:
        return filtered;
    }
  }, [reviews, sortBy, filterBy]);

  // Reviews to display (excluding user's own review if it exists)
  const reviewsToDisplay = React.useMemo(() => {
    if (!userReview) return filteredAndSortedReviews;
    
    return filteredAndSortedReviews.filter(review => {
      if (!review || !userReview) return true;
      const reviewUserId = review.user?._id || review.user;
      const userReviewUserId = userReview.user?._id || userReview.user;
      return reviewUserId !== userReviewUserId;
    });
  }, [filteredAndSortedReviews, userReview]);

  const renderStars = (rating: number, size: number = 16) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  // Safe calculations
  const safeAverageRating = typeof averageRating === 'number' && !isNaN(averageRating) ? averageRating : 0;
  const safeTotalReviews = typeof totalReviews === 'number' ? totalReviews : reviews.length;

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg p-6 h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Reviews Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">


          {user && !userReview && (
            <button
              onClick={() => setShowEditForm(true)}
              className="mt-4 lg:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Rating Distribution and Reviews Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: Rating Distribution - Compact Height */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating Breakdown</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto"> {/* ✅ Reduced height */}
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = safeTotalReviews > 0 ? (count / safeTotalReviews) * 100 : 0;
                
                return (
                  <button
                    key={rating}
                    onClick={() => setFilterBy(rating.toString() as FilterOption)}
                    className={`flex items-center justify-between w-full rounded-lg transition-colors ${
                      filterBy === rating.toString() 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="flex items-center space-x-1 w-12">
                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                        <Star size={14} className="text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`text-xs ml-2 ${
                      filterBy === rating.toString() ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reset Filter Button */}
            {filterBy !== 'all' && (
              <button
                onClick={() => setFilterBy('all')}
                className="w-full mt-3 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Show All Reviews
              </button>
            )}

            {/* Active Filter Info */}
            {filterBy !== 'all' && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                Showing {ratingDistribution[parseInt(filterBy) as keyof typeof ratingDistribution]} {filterBy}-star reviews
              </div>
            )}
          </div>

          {/* Right: Reviews List */}
          <div className="lg:col-span-3">
            {/* Reviews Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter size={16} />
                    <span>Filter & Sort</span>
                  </button>
                  
                  {showFilters && (
                    <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Sort by
                      </div>
                      {[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'oldest', label: 'Oldest First' },
                        { value: 'highest', label: 'Highest Rated' },
                        { value: 'lowest', label: 'Lowest Rated' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value as SortOption);
                            setShowFilters(false);
                          }}
                          className={`flex items-center space-x-2 w-full px-3 py-2 text-sm text-left ${
                            sortBy === option.value 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  {reviewsToDisplay.length} of {safeTotalReviews} reviews
                  {filterBy !== 'all' && ` • ${filterBy} stars`}
                </div>
              </div>
            </div>

            {/* User's Review (if exists) */}
            {userReview && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Your Review</h3>
                  <button
                    onClick={() => handleEdit(userReview)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit Review
                  </button>
                </div>
                <ReviewItem 
                  key={userReview._id}
                  review={userReview} 
                  productId={productId} 
                  onEdit={handleEdit}
                  onDelete={handleReviewDelete}
                />
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsToDisplay.length === 0 && !userReview ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-400 mb-3">
                    <Star size={36} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filterBy === 'all' ? 'No reviews yet' : 'No matching reviews'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filterBy === 'all' 
                      ? 'Be the first to review this product!'
                      : `No ${filterBy}-star reviews found.`
                    }
                  </p>
                  {user && !userReview && filterBy === 'all' && (
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Write the First Review
                    </button>
                  )}
                </div>
              ) : (
                reviewsToDisplay.map((review) => (
                  <ReviewItem 
                    key={review._id}
                    review={review} 
                    productId={productId} 
                    onEdit={handleEdit}
                    onDelete={handleReviewDelete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {showEditForm && (
        <ReviewForm
          productId={productId}
          existingReview={editingReview}
          onClose={() => {
            setShowEditForm(false);
            setEditingReview(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default ReviewsList;