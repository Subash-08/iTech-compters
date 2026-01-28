// components/wishlist/AddToWishlistButton.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { selectIsInWishlist, selectIsGuestWishlist } from '../../redux/selectors/wishlistSelectors';
import { toast } from 'react-toastify';

interface VariantData {
  variantId: string;
  name?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  attributes?: Array<{ key: string; label: string; value: string }>;
  sku?: string;
}

interface AddToWishlistButtonProps {
  productId: string;
  product?: any; // ✅ ADD THIS: Product data for guest wishlist
  variant?: VariantData | null;
  productType?: 'product' | 'prebuilt-pc';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const AddToWishlistButton: React.FC<AddToWishlistButtonProps> = ({ 
  productId, 
  product, // ✅ ADD THIS
  variant,
  productType = 'product',
  className = '',
  size = 'md',
  showTooltip = true
}) => {
  const dispatch = useAppDispatch();
  
  // CHANGED: Create unique identifier for wishlist items with variants
  const wishlistItemId = variant?.variantId ? `${productId}_${variant.variantId}` : productId;
  
  const isInWishlist = useAppSelector(selectIsInWishlist(wishlistItemId));
  const isGuestWishlist = useAppSelector(selectIsGuestWishlist);
  const wishlistItems = useAppSelector(state => state.wishlistState.items || []);
  const isAuthenticated = useAppSelector(state => state.authState.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [showGuestTooltip, setShowGuestTooltip] = useState(false);

  const handleWishlistToggle = async () => {
    if (loading) return;

    setLoading(true);
    
   try {
      if (isInWishlist) {
        // ✅ FIX: Changed property name from 'productId' to 'itemId' to match your Action
        await dispatch(wishlistActions.removeFromWishlist({ 
          itemId: wishlistItemId, 
          productType 
        }));
        
        toast.success(`${productType === 'prebuilt-pc' ? 'Pre-built PC' : 'Product'} removed from wishlist`, { toastId: 'wishlist-2' });
      } else {
        await dispatch(wishlistActions.addToWishlist({ 
          productId,
          product,
          variant, 
          productType
        }));
        
        if (!isAuthenticated && showTooltip) {
          setShowGuestTooltip(true);
          setTimeout(() => setShowGuestTooltip(false), 3000);
        }
        
        toast.success(`${productType === 'prebuilt-pc' ? 'Pre-built PC' : 'Product'} added to wishlist`, { toastId: 'wishlist-1' } );
      }
    } catch (error: any) {
      console.error('❌ Wishlist toggle error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update wishlist';
      
      if (!(productType === 'prebuilt-pc' && error.response?.status === 404)) {
        toast.error(errorMessage);
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
    <div className="relative">
      <button
        onClick={handleWishlistToggle}
        disabled={loading}
        className={`
          ${sizeClasses[size]} 
          rounded-full transition-all duration-300 
          flex items-center justify-center
          ${
            isInWishlist 
              ? 'text-red-500 bg-red-50 hover:bg-red-100 shadow-md border-red-200' 
              : 'text-gray-400 bg-white hover:bg-gray-50 hover:text-red-500 shadow-sm hover:shadow-md border-gray-200'
          } 
          ${className}
          border
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-red-200
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

      {/* Guest Tooltip */}
      {showGuestTooltip && !isAuthenticated && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-10 animate-bounce">
          💡 Added to guest wishlist
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default AddToWishlistButton;