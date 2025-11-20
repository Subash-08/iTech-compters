import React, { useState, useEffect } from 'react';
import { Review, ReviewFilters } from '../types/review';
import { reviewService } from '../services/reviewService';
import ReviewFiltersComponent from './ReviewFiltersComponent';
import ReviewTable from './ReviewTable';
import EmptyState from '../common/EmptyState';
import { Icons } from '../Icon';
import { baseURL } from '../../config/config';

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return null;
  
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || baseURL;
  return `${baseUrl.replace(/\/$/, '')}/${avatarPath.replace(/^\//, '')}`;
};

// Safe user data access
const getSafeUser = (user: any) => {
  return {
    _id: user?._id || 'unknown',
    firstName: user?.firstName || 'Unknown',
    lastName: user?.lastName || 'User',
    email: user?.email || 'No email',
    avatar: user?.avatar
  };
};

const ReviewList: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReviewFilters>({
    search: '',
    rating: '',
    page: 1,
    limit: 10
  });
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  // Load reviews directly from Review collection
  const fetchAdminReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reviewService.getAdminReviews(filters);
      setReviews(response.reviews || []);
      setPagination(response.pagination || {
        page: 1,
        pages: 1,
        total: 0
      });
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reviews');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReviews();
  }, [filters.search, filters.rating, filters.page]);

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to page 1 when filters change
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteReview = async (reviewId: string, review: Review) => {
    try {

      await reviewService.deleteReview(reviewId);
      
      setReviews(prev => prev.filter(rev => rev._id !== reviewId));
      
      fetchAdminReviews();
      
    } catch (err: any) {
      console.error('Detailed delete error:', {
        reviewId,
        error: err.response?.data
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete review';
      setError(errorMessage);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <Icons.AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={fetchAdminReviews}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
          <p className="text-gray-600">Manage and monitor all product reviews</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {pagination.total} reviews
        </div>
      </div>

      <ReviewFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {reviews.length === 0 && !loading ? (
        <EmptyState
          title="No reviews found"
          description="Try adjusting your search or filters to find what you're looking for."
          icon={<Icons.Reviews className="w-12 h-12 text-gray-400" />}
        />
      ) : (
        <>
          <ReviewTable
            reviews={reviews}
            onDelete={handleDeleteReview}
            loading={loading}
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-6">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Icons.Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading reviews...</span>
        </div>
      )}
    </div>
  );
};

export default ReviewList;