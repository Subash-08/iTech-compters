// src/components/reviews/ReviewsList.tsx
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import { Star, ArrowUpDown, Filter } from 'lucide-react';
import { Review } from '../../redux/types/reviewTypes';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewsListProps {
  productId: string;
  reviews: Review[];
  onReviewDelete?: () => void;
}

// ✅ Correct type definition
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1';

const ReviewsList: React.FC<ReviewsListProps> = ({ productId, reviews = [], onReviewDelete }) => {
  const { user } = useSelector((state: RootState) => state.authState);
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 1. Identify User Review
  const userReview = useMemo(() => {
    if (!user || reviews.length === 0) return null;
    return reviews.find(review => {
      if (!review?.user) return false;
      const reviewUserId = typeof review.user === 'object' ? review.user._id : review.user;
      return String(reviewUserId) === String(user._id);
    });
  }, [reviews, user]);

  // 2. Filter & Sort Logic
  const displayReviews = useMemo(() => {
    // Start by excluding the user's review (it gets its own section)
    let filtered = userReview 
      ? reviews.filter(r => r._id !== userReview._id) 
      : [...reviews];

    // ✅ FIXED FILTER LOGIC: Ensure rating is a valid number
    if (filterBy !== 'all') {
      const targetRating = parseInt(filterBy);
      filtered = filtered.filter(review => {
        const rating = Number(review.rating);
        return !isNaN(rating) && Math.round(rating) === targetRating;
      });
    }

    // Sort Logic
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest': return b.rating - a.rating;
        case 'lowest': return a.rating - b.rating;
        default: return 0;
      }
    });
  }, [reviews, userReview, sortBy, filterBy]);

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setShowEditForm(true);
  };

  const handleReviewSuccess = () => {
    setShowEditForm(false);
    setEditingReview(null);
    onReviewDelete?.();
  };

  return (
    <div className="w-full">
      
      {/* 🟢 Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
         {/* Filters */}
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            <button
              onClick={() => setFilterBy('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filterBy === 'all' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Reviews
            </button>
            {['5', '4', '3', '2', '1'].map((star) => (
               <button
                 key={star}
                 // ✅ FIXED: Cast as FilterOption to satisfy TS
                 onClick={() => setFilterBy(star as FilterOption)}
                 className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                   filterBy === star
                   ? 'bg-yellow-50 border-yellow-200 text-yellow-700 shadow-sm'
                   : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                 }`}
               >
                 <span>{star}</span>
                 <Star size={10} className="fill-current" />
               </button>
            ))}
         </div>

         {/* Sort Dropdown */}
         <div className="relative">
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowUpDown size={14} />
              <span>Sort: <span className="text-gray-900 capitalize">{sortBy}</span></span>
            </button>
            
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden">
                   {['newest', 'oldest', 'highest', 'lowest'].map((opt) => (
                     <button
                       key={opt}
                       onClick={() => { setSortBy(opt as SortOption); setShowSortMenu(false); }}
                       className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 capitalize font-medium ${
                         sortBy === opt ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                       }`}
                     >
                       {opt.replace('highest', 'Highest Rated').replace('newest', 'Most Recent')}
                     </button>
                   ))}
                </div>
              </>
            )}
         </div>
      </div>

      {/* 🟢 Your Review Section */}
      {userReview && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
           <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Review</h3>
              <button onClick={() => handleEdit(userReview)} className="text-blue-600 text-xs font-bold hover:underline">
                Edit
              </button>
           </div>
           <div className="ring-1 ring-blue-100 rounded-2xl bg-blue-50/20">
              <ReviewItem review={userReview} productId={productId} onEdit={handleEdit} onDelete={onReviewDelete} isOwnReview />
           </div>
        </motion.div>
      )}

      {/* 🟢 Reviews List */}
      <div className="space-y-4">
        <AnimatePresence mode='popLayout'>
          {displayReviews.length > 0 ? (
            displayReviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <ReviewItem review={review} productId={productId} onEdit={handleEdit} onDelete={onReviewDelete} />
              </motion.div>
            ))
          ) : (
            // Only show "No reviews" if user filter resulted in 0 items AND it's not just because user has the only review
            (filterBy !== 'all') && (
               <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3 text-gray-400">
                    <Filter size={20} />
                  </div>
                  <p className="text-gray-500 font-medium">No reviews match your filter.</p>
                  <button onClick={() => setFilterBy('all')} className="mt-2 text-blue-600 text-sm font-bold hover:underline">
                    Clear Filters
                  </button>
               </div>
            )
          )}
        </AnimatePresence>
      </div>

      {showEditForm && (
        <ReviewForm
          productId={productId}
          existingReview={editingReview}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default ReviewsList;