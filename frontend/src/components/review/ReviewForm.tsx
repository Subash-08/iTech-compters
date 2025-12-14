// src/components/reviews/ReviewForm.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reviewActions } from '../../redux/actions/reviewActions';
import { RootState } from '../../redux/store';
import { Review, CreateReviewData } from '../../redux/types/reviewTypes';
import { X, Star, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Success Side Effect
  useEffect(() => {
    if (success) {
      toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
      if (onSuccess) onSuccess();
      onClose();
      dispatch(reviewActions.clearReviewSuccess());
    }
  }, [success, onSuccess, onClose, dispatch, existingReview]);

  // Error Side Effect
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(reviewActions.clearReviewError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (!user) return toast.error('Please login to continue');
    if (rating === 0) return;

    const reviewData: CreateReviewData = { rating, comment };
    
    if (existingReview) {
      // @ts-ignore
      await dispatch(reviewActions.updateReview(productId, reviewData));
    } else {
      // @ts-ignore
      await dispatch(reviewActions.createReview(productId, reviewData));
    }
  };

  const getRatingLabel = (r: number) => {
    const labels = { 1: 'Poor', 2: 'Fair', 3: 'Average', 4: 'Good', 5: 'Excellent' };
    return labels[r as keyof typeof labels] || 'Select Rating';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
           <h3 className="text-xl font-bold text-gray-900 tracking-tight">
             {existingReview ? 'Edit Review' : 'Write a Review'}
           </h3>
           <button 
             onClick={onClose} 
             className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
           >
             <X size={20} />
           </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* Rating Section */}
            <div className="flex flex-col items-center space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                 Overall Rating
               </label>
               
               <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none group"
                    >
                      <Star 
                        size={42} 
                        className={`transition-all duration-200 ${
                           star <= (hoverRating || rating) 
                           ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                           : 'fill-gray-100 text-gray-200 group-hover:text-gray-300'
                        }`} 
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
               </div>

               <div className="h-6 text-center">
                 <motion.span 
                   key={hoverRating || rating}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`text-sm font-bold tracking-wide ${
                     (hoverRating || rating) > 0 ? 'text-blue-600' : 'text-gray-300'
                   }`}
                 >
                    {getRatingLabel(hoverRating || rating)}
                 </motion.span>
               </div>

               {touched && rating === 0 && (
                 <div className="flex items-center text-red-500 text-sm bg-red-50 px-3 py-1.5 rounded-full">
                   <AlertCircle size={14} className="mr-1.5" />
                   Please select a star rating
                 </div>
               )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Comment Section */}
            <div className="space-y-3">
               <label htmlFor="comment" className="block text-sm font-bold text-gray-700">
                  Your Review
               </label>
               <div className="relative">
                 <textarea
                   id="comment"
                   rows={5}
                   value={comment}
                   onChange={(e) => setComment(e.target.value)}
                   className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all resize-none text-sm leading-relaxed"
                   placeholder="What did you like or dislike? How was the quality?"
                   maxLength={1000}
                 />
                 <span className="absolute bottom-3 right-3 text-xs font-medium text-gray-400 bg-white/80 px-2 py-0.5 rounded-md border border-gray-100">
                   {comment.length} / 1000
                 </span>
               </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
           <button
             type="button"
             onClick={onClose}
             className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
           >
             Cancel
           </button>
           <button
             type="button"
             onClick={handleSubmit}
             disabled={loading || rating === 0}
             className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
           >
             {loading && <Loader2 size={18} className="animate-spin" />}
             {existingReview ? 'Update Review' : 'Submit Review'}
           </button>
        </div>

      </motion.div>
    </div>
  );
};

export default ReviewForm;