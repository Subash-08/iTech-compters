// components/wishlist/AddToWishlistButton.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { selectIsInWishlist } from '../../redux/selectors/wishlistSelectors';

interface AddToWishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AddToWishlistButton: React.FC<AddToWishlistButtonProps> = ({ 
  productId, 
  className = '',
  size = 'md'
}) => {
  const dispatch = useAppDispatch();
  const isInWishlist = useAppSelector(selectIsInWishlist(productId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if product is in wishlist when component mounts
    dispatch(wishlistActions.checkWishlistItem({ productId }));
  }, [dispatch, productId]);

  const handleWishlistToggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isInWishlist) {
        await dispatch(wishlistActions.removeFromWishlist({ productId }));
      } else {
        await dispatch(wishlistActions.addToWishlist({ productId }));
      }
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={handleWishlistToggle}
      disabled={loading}
      className={`
        ${sizeClasses[size]} 
        rounded-full transition-all duration-300 
        flex items-center justify-center
        ${
          isInWishlist 
            ? 'text-red-500 bg-red-50 hover:bg-red-100 shadow-md' 
            : 'text-gray-400 bg-white hover:bg-gray-50 hover:text-red-500 shadow-sm hover:shadow-md'
        } 
        ${className}
      `}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? (
        <svg 
          className={`${iconSizes[size]} animate-spin`} 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg 
          className={iconSizes[size]} 
          fill={isInWishlist ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={isInWishlist ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
};

export default AddToWishlistButton;