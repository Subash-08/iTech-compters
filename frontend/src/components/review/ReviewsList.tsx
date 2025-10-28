import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { reviewActions } from '../../redux/actions/reviewActions';
import { selectReviewsByProductId, selectUserReviewForProduct } from '../../redux/selectors/reviewSelectors';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import { Star, Filter } from 'lucide-react';
import { Review } from '../../redux/types/reviewTypes';

interface ReviewsListProps {
  productId: string;
   onReviewDelete?: () => void;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | '5-stars' | '4-stars' | '3-stars' | '2-stars' | '1-star';

const formatUserName = (user: any) => {
  if (!user) return 'Anonymous';
  
  // Handle the case where backend sends "undefined undefined"
  if (user.fullName === 'undefined undefined') {
    // Check if firstName and lastName are available
    if (user.firstName && user.firstName !== 'undefined') {
      return `${user.firstName}${user.lastName && user.lastName !== 'undefined' ? ' ' + user.lastName : ''}`.trim();
    }
    // Fallback to email
    return user.email?.split('@')[0] || 'User';
  }
  
  // Handle proper fullName
  if (user.fullName && user.fullName !== 'undefined undefined') {
    return user.fullName;
  }
  
  // Handle firstName/lastName structure
  if (user.firstName && user.firstName !== 'undefined') {
    return `${user.firstName}${user.lastName && user.lastName !== 'undefined' ? ' ' + user.lastName : ''}`.trim();
  }
  
  // Final fallback
  return user.email?.split('@')[0] || 'User';
};

const ReviewsList: React.FC<ReviewsListProps> = ({ productId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.authState);
  const { loading } = useSelector((state: RootState) => state.reviewState);
  
  const reviewsData = useSelector((state: RootState) => 
    selectReviewsByProductId(productId)(state)
  );
  const userReview = useSelector((state: RootState) => 
    selectUserReviewForProduct(productId, user?._id)(state)
  );
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ✅ FIXED: Safe destructuring with defaults
  const { reviews = [], averageRating = 0, totalReviews = 0 } = reviewsData;

  useEffect(() => {
    dispatch(reviewActions.getProductReviews(productId));
  }, [dispatch, productId]);

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setShowEditForm(true);
  };

    // ✅ ADDED: Handle review delete with callback
  const handleReviewDelete = () => {
    dispatch(reviewActions.getProductReviews(productId));
    // Call the parent callback to update the header section
    if (onReviewDelete) {
      onReviewDelete();
    }
  };

  const handleReviewSuccess = () => {
    setShowEditForm(false);
    setEditingReview(null);
    dispatch(reviewActions.getProductReviews(productId));
  };

  // Filter and sort reviews
  const filteredAndSortedReviews = React.useMemo(() => {
    let filtered = [...reviews];

    // ✅ FIXED: Safe rating filter
    if (filterBy !== 'all') {
      const rating = parseInt(filterBy.charAt(0));
      filtered = filtered.filter(review => review && review.rating === rating);
    }

    // ✅ FIXED: Safe sorting with date validation
    switch (sortBy) {
      case 'newest':
        return [...filtered].sort((a, b) => {
          const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return [...filtered].sort((a, b) => {
          const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      case 'highest':
        return [...filtered].sort((a, b) => (b?.rating || 0) - (a?.rating || 0));
      case 'lowest':
        return [...filtered].sort((a, b) => (a?.rating || 0) - (b?.rating || 0));
      default:
        return filtered;
    }
  }, [reviews, sortBy, filterBy]);

  // ✅ FIXED: Improved reviewsToDisplay logic
  const reviewsToDisplay = React.useMemo(() => {
    if (!userReview) return filteredAndSortedReviews;
    
    return filteredAndSortedReviews.filter(review => {
      if (!review || !userReview) return true;
      
      // Compare by user ID for embedded reviews
      const reviewUserId = review.user?._id || review.user;
      const userReviewUserId = userReview.user?._id || userReview.user;
      
      return reviewUserId !== userReviewUserId;
    });
  }, [filteredAndSortedReviews, userReview]);

  // Rating distribution
  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      if (review && typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();

  const renderStars = (rating: number, size: number = 16) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  // ✅ FIXED: Better key generation for reviews
  const generateReviewKey = (review: Review, index: number) => {
    if (!review) return `review-${index}-${Date.now()}`;
    
    // Use _id if available
    if (review._id) return review._id;
    
    // Use user ID + timestamp for embedded reviews
    if (review.user && review.createdAt) {
      const userId = typeof review.user === 'object' ? review.user._id : review.user;
      return `review-${userId}-${new Date(review.createdAt).getTime()}`;
    }
    
    // Fallback
    return `review-${index}-${Date.now()}`;
  };

  // ✅ FIXED: Safe calculations
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
    <div className="max-w-4xl mx-auto">
      {/* Reviews Header and Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-gray-900">
                {safeAverageRating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  {renderStars(Math.round(safeAverageRating), 20)}
                </div>
                <div className="text-sm text-gray-600">
                  Based on {safeTotalReviews} review{safeTotalReviews !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {user && !userReview && (
            <button
              onClick={() => setShowEditForm(true)}
              className="mt-4 lg:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating as keyof typeof ratingDistribution];
              const percentage = safeTotalReviews > 0 ? (count / safeTotalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <button
                    onClick={() => setFilterBy(`${rating}-stars` as FilterOption)}
                    className={`flex items-center space-x-1 text-sm ${
                      filterBy === `${rating}-stars` ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}
                  >
                    <span>{rating}</span>
                    <Star size={14} className="text-yellow-400 fill-current" />
                  </button>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              <span>Filter</span>
            </button>
            
            {showFilters && (
              <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[140px]">
                {[
                  { value: 'all', label: 'All Ratings' },
                  { value: '5-stars', label: '5 Stars' },
                  { value: '4-stars', label: '4 Stars' },
                  { value: '3-stars', label: '3 Stars' },
                  { value: '2-stars', label: '2 Stars' },
                  { value: '1-star', label: '1 Star' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterBy(option.value as FilterOption);
                      setShowFilters(false);
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-sm text-left ${
                      filterBy === option.value 
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {reviewsToDisplay.length} of {safeTotalReviews} reviews
          {filterBy !== 'all' && ` (${filterBy.replace('-', ' ')})`}
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
            key={generateReviewKey(userReview, 0)}
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
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-3">
              <Star size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No reviews found
            </h3>
            <p className="text-gray-600 mb-4">
              {filterBy === 'all' 
                ? 'No reviews yet. Be the first to review this product!'
                : `No ${filterBy.replace('-', ' ')} reviews found.`
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
          reviewsToDisplay.map((review, index) => (
            <ReviewItem 
              key={generateReviewKey(review, index)}
              review={review} 
              productId={productId} 
              onEdit={handleEdit}
              onDelete={handleReviewDelete}
            />
          ))
        )}
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