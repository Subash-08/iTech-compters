// components/wishlist/Wishlist.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { removeFromWishlist, wishlistActions } from '../../redux/actions/wishlistActions';
import { selectWishlistItems, selectWishlistLoading, selectWishlistError } from '../../redux/selectors/wishlistSelectors';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import WishlistItem from './WishlistItem';

const Wishlist: React.FC = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const loading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);

  useEffect(() => {
    dispatch(wishlistActions.fetchWishlist());
  }, [dispatch]);

const handleRemoveFromWishlist = (productId: string) => {
  dispatch(removeFromWishlist({ productId })); // ✅ Correct usage
};
  const handleClearWishlist = () => {
    dispatch(wishlistActions.clearWishlist());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
        {wishlistItems && wishlistItems.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!wishlistItems || wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500">Start adding products you love!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <WishlistItem 
              key={item._id} 
              item={item} 
              onRemove={handleRemoveFromWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;