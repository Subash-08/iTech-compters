// src/components/reviews/ReviewItem.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reviewActions } from '../../redux/actions/reviewActions';
import { RootState } from '../../redux/store';
import { Review } from '../../redux/types/reviewTypes';
import { Star, Edit, Trash2, User, MoreVertical, Flag } from 'lucide-react';
import { toast } from 'react-toastify';
import { baseURL } from '../config/config';

interface ReviewItemProps {
  review: Review;
  productId: string;
  onEdit: (review: Review) => void;
  onDelete?: () => void;
}

// Helper function to format user names
const formatUserName = (user: any) => {
  if (!user) return 'Anonymous';
  
  // Handle both data structures
  if (user.fullName && user.fullName !== 'undefined undefined') {
    return user.fullName;
  }
  
  if (user.firstName) {
    return `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim();
  }
  
  return user.email?.split('@')[0] || 'User';
};

// Helper function to get avatar URL
const getAvatarUrl = (user: any) => {
  if (!user) return null;
  
  // Handle avatar from user object
  if (user.avatar) {
    // If it's already a full URL, return as is
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    // If it's a path, prepend the base URL
    return `${process.env.REACT_APP_API_URL || baseURL}${user.avatar}`;
  }
  
  // Handle Google photo URL from social logins
  if (user.socialLogins && user.socialLogins.length > 0) {
    const googleLogin = user.socialLogins.find((login: any) => login.provider === 'google');
    if (googleLogin && googleLogin.photoURL) {
      return googleLogin.photoURL;
    }
  }
  
  return null;
};

const ReviewItem: React.FC<ReviewItemProps> = ({ review, productId, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.authState);
  const { loading } = useSelector((state: RootState) => state.reviewState);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Improved user review check
  const isCurrentUserReview = React.useMemo(() => {
    if (!user || !review.user) return false;
    
    const reviewUserId = typeof review.user === 'object' ? review.user._id : review.user;
    return reviewUserId === user._id;
  }, [user, review.user]);

  const getUserDisplayName = () => {
    return formatUserName(review.user);
  };

  const getUserInitial = () => {
    if (!review.user) return <User size={20} />;
    
    const name = formatUserName(review.user);
    if (name !== 'Anonymous' && name !== 'User') {
      return name.charAt(0).toUpperCase();
    }
    
    return <User size={20} />;
  };

  const handleDelete = async () => {
    try {      
      const result = await dispatch(reviewActions.deleteReview(productId)); 
      setShowDeleteConfirm(false);
      toast.success('Review deleted successfully');
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleReport = () => {
    toast.info('Thank you for reporting. We will review this content.');
    setShowMenu(false);
  };

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={16}
        className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      return formatDate(dateString);
    } catch (error) {
      return 'Recently';
    }
  };

  // Get avatar URL
  const avatarUrl = getAvatarUrl(review.user);
  
  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) setShowMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3 flex-1">
            {/* Avatar Image */}
            <div className="flex-shrink-0">
              {avatarUrl && !imageError ? (
                <img
                  src={avatarUrl}
                  alt={getUserDisplayName()}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                  {getUserInitial()}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {getUserDisplayName()}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-gray-500">
                  {getTimeAgo(review.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Menu */}
          {(isCurrentUserReview || user) && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                type="button"
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <div 
                  className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCurrentUserReview ? (
                    <>
                      <button
                        onClick={() => {
                          onEdit(review);
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={loading}
                        type="button"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        disabled={loading}
                        type="button"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleReport}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      type="button"
                    >
                      <Flag size={14} />
                      <span>Report</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {review.comment && (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
            {review.comment}
          </p>
        )}

        {review.updatedAt && review.updatedAt !== review.createdAt && (
          <div className="text-xs text-gray-400 border-t pt-2">
            Edited on {formatDate(review.updatedAt)}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Review
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete your review? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewItem;