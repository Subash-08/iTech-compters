import React from 'react';
import { Review } from '../types/review';
import { Icons } from '../Icon';
import { baseURL } from '../../config/config';

interface ReviewTableProps {
  reviews: Review[];
  onDelete: (reviewId: string, review: Review) => void;
  loading: boolean;
}

const ReviewTable: React.FC<ReviewTableProps> = ({
  reviews,
  onDelete,
  loading
}) => {
  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return null;
    
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || baseURL;
    return `${baseUrl.replace(/\/$/, '')}/${avatarPath.replace(/^\//, '')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = (review: Review) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      onDelete(review._id, review);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.Loader className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading reviews...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Icons.Reviews className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
        <p className="text-gray-500">No reviews match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">All Reviews</h2>
        <p className="text-sm text-gray-600 mt-1">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {reviews.map((review) => (
          <div key={review._id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {review.user.avatar ? (
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={getAvatarUrl(review.user.avatar)}
                      alt={`${review.user.firstName} ${review.user.lastName}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {review.user.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.user.firstName} {review.user.lastName}
                    </h4>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icons.Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Product: 
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      {review.product?.name || 'Unknown Product'}
                    </span>
                  </div>

                  {review.comment ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                  ) : (
                    <p className="text-gray-400 italic">No comment provided</p>
                  )}

                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{review.user.email}</span>
                    {review.updatedAt !== review.createdAt && (
                      <span>Edited {formatDate(review.updatedAt)}</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      review.status === 'approved' ? 'bg-green-100 text-green-800' :
                      review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={() => handleDelete(review)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete review"
                >
                  <Icons.Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewTable;