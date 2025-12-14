// src/components/review/ProductReviewsSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../redux/store';
import { reviewActions } from '../../redux/actions/reviewActions';
import ReviewsList from './ReviewsList';
import ReviewForm from './ReviewForm';
import { Star, MessageSquare, PenLine, Lock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.authState);
  
  // 1️⃣ Access Data from the Correct Slice Path
  const productReviewData = useSelector((state: RootState) => 
    state.reviewState.productReviews?.[productId] || { reviews: [], averageRating: 0, totalReviews: 0 }
  );
  
  const { reviews } = productReviewData; // We rely on the array for live calc
  const [showReviewForm, setShowReviewForm] = useState(false);

  // 2️⃣ LIVE STATS CALCULATION (The "Immediate Update" Fix)
  // Instead of waiting for backend 'averageRating', we calculate it from the loaded reviews
  // This ensures that when you edit your review, the stars update instantly.
  const liveStats = useMemo(() => {
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    
    // If no reviews loaded yet, fallback to Product props
    if (safeReviews.length === 0) {
      return {
        averageRating: product?.averageRating || 0,
        totalReviews: product?.totalReviews || 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    // Calculate Distribution & Sum
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    safeReviews.forEach(review => {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating || 0)));
      // @ts-ignore
      distribution[rating]++;
      sum += rating;
    });

    const average = sum / safeReviews.length;

    return {
      averageRating: average,
      totalReviews: safeReviews.length,
      distribution
    };
  }, [reviews, product]);

  // Initial Fetch
  useEffect(() => {    
    if (productId && productId !== 'undefined') {
      // @ts-ignore
      dispatch(reviewActions.getProductReviews(productId));
    }
  }, [dispatch, productId]);

  const handleReviewAction = () => {
    setShowReviewForm(false);
    // Silent refetch to ensure consistency with backend
    // @ts-ignore
    dispatch(reviewActions.getProductReviews(productId));
  };

  const renderStars = (rating: number) => (
    <div className="flex text-yellow-400 gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={20}
          className={`transition-colors ${star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`}
        />
      ))}
    </div>
  );

  return (
    <section className="bg-white border-t border-gray-100 mt-16 pt-16 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h2 className="text-2xl font-bold text-gray-900 mb-10 tracking-tight flex items-center gap-3">
          Customer Reviews
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {liveStats.totalReviews}
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* 📊 LEFT COLUMN: Rating Dashboard */}
          <div className="lg:col-span-4 xl:col-span-3">
             <div className="sticky top-28 space-y-8">
                
                {/* Score Card */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-end gap-3 mb-4">
                     <span className="text-6xl font-extrabold text-gray-900 leading-none tracking-tighter">
                       {liveStats.averageRating.toFixed(1)}
                     </span>
                     <div className="mb-1.5">
                        {renderStars(liveStats.averageRating)}
                        <p className="text-sm text-gray-500 font-medium mt-1">out of 5 stars</p>
                     </div>
                  </div>

                  {/* Histogram */}
                  <div className="space-y-2.5 pt-2">
                     {[5, 4, 3, 2, 1].map((star) => {
                        // @ts-ignore
                        const count = liveStats.distribution[star];
                        const total = liveStats.totalReviews || 1; 
                        const percentage = (count / total) * 100;

                        return (
                          <div key={star} className="flex items-center gap-3 text-sm group">
                             <div className="flex items-center gap-1 w-8 text-gray-600 font-medium">
                               <span>{star}</span>
                               <Star size={10} className="fill-gray-400 text-gray-400" />
                             </div>
                             <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full bg-yellow-400 rounded-full group-hover:bg-yellow-500 transition-colors"
                                />
                             </div>
                             <span className="w-8 text-right text-gray-400 text-xs tabular-nums group-hover:text-gray-600">
                                {Math.round(percentage)}%
                             </span>
                          </div>
                        );
                     })}
                  </div>
                </div>

                {/* Call to Action */}
                <div className="hidden lg:block space-y-4">
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Share your thoughts</h3>
                   <p className="text-sm text-gray-500">If you've used this product, share your thoughts with other customers.</p>
                   
                   {user ? (
                     <button
                       onClick={() => setShowReviewForm(true)}
                       className="w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                     >
                       <PenLine size={16} />
                       Write a Review
                     </button>
                   ) : (
                     <button
                       onClick={() => navigate('/login')}
                       className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                     >
                       <Lock size={16} />
                       Sign in to Review
                     </button>
                   )}
                </div>
             </div>
          </div>

          {/* 📝 RIGHT COLUMN: Reviews List */}
          <div className="lg:col-span-8 xl:col-span-9">
            
            {/* Mobile CTA */}
            <div className="lg:hidden mb-8">
               {user ? (
                 <button
                   onClick={() => setShowReviewForm(true)}
                   className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                 >
                   <PenLine size={18} /> Write a Review
                 </button>
               ) : (
                 <button
                   onClick={() => navigate('/login')}
                   className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                 >
                   <Lock size={18} /> Sign in to Review
                 </button>
               )}
            </div>

            {/* List Component */}
            <div className="min-h-[400px]">
               <ReviewsList 
                 productId={productId} 
                 // ✅ PASS REVIEWS AS PROP: Ensures the list uses the same data as our liveStats
                 reviews={reviews || []}
                 onReviewDelete={handleReviewAction}
               />
               
               {(!reviews || reviews.length === 0) && (
                 <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                       <BarChart3 className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No reviews yet</h3>
                    <p className="text-gray-500 mt-1 mb-6 text-center max-w-xs">
                      There are no reviews for this product yet. Be the first to let others know what you think!
                    </p>
                    {user && (
                      <button 
                        onClick={() => setShowReviewForm(true)}
                        className="text-blue-600 font-bold hover:text-blue-800 hover:underline"
                      >
                        Write the first review
                      </button>
                    )}
                 </div>
               )}
            </div>
          </div>

        </div>

        {/* Modal Form */}
        {showReviewForm && (
          <ReviewForm
            productId={productId}
            onClose={() => setShowReviewForm(false)}
            onSuccess={handleReviewAction}
          />
        )}
      </div>
    </section>
  );
};

export default ProductReviewsSection;