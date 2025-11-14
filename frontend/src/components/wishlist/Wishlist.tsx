// components/wishlist/Wishlist.tsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { 
  selectWishlistItems, 
  selectWishlistLoading, 
  selectWishlistError,
  selectIsGuestWishlist 
} from '../../redux/selectors/wishlistSelectors';
import { selectIsAuthenticated, selectUser } from '../../redux/selectors';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import WishlistItem from './WishlistItem';
import { Link } from 'react-router-dom';
import { localStorageUtils } from '../utils/localStorage';
import WishlistSyncModal from './WishlistSyncModal';

const Wishlist: React.FC = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const loading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);
  const isGuestWishlist = useAppSelector(selectIsGuestWishlist);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // State for sync modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [hasCheckedSync, setHasCheckedSync] = useState(false);
  useEffect(() => {
    dispatch(wishlistActions.fetchWishlist());
  }, [dispatch]);

  // Check if we need to show sync modal
  useEffect(() => {    
    if (!loading && isAuthenticated && user && !hasCheckedSync) {
      const guestWishlist = localStorageUtils.getGuestWishlist();

      // Show sync modal if there are guest wishlist items
      if (guestWishlist.length > 0) {
        setShowSyncModal(true);
      }
      
      setHasCheckedSync(true);
    }
  }, [loading, isAuthenticated, user, hasCheckedSync]);

  const handleSyncConfirm = async () => {
    try {
      setShowSyncModal(false);
      await dispatch(wishlistActions.syncGuestWishlist());
      // Refresh wishlist after sync
      await dispatch(wishlistActions.fetchWishlist());
    } catch (error) {
      console.error('Failed to sync wishlist:', error);
    }
  };

  const handleSyncCancel = () => {
    setShowSyncModal(false);
  };

  // ✅ FIX: Update to accept both productId and productType
  const handleRemoveFromWishlist = (productId: string, productType: 'product' | 'prebuilt-pc') => {
    dispatch(wishlistActions.removeFromWishlist({ 
      productId, 
      productType // ✅ Now passing productType
    }));
  };

  const handleClearWishlist = () => {
    dispatch(wishlistActions.clearWishlist());
  };

  const handleManualSync = () => {
    const guestWishlist = localStorageUtils.getGuestWishlist();
    if (guestWishlist.length > 0) {
      setShowSyncModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Get guest wishlist count for modal
  const guestWishlistCount = localStorageUtils.getGuestWishlist().length;

  return (
    <>
      <WishlistSyncModal
        isOpen={showSyncModal}
        onConfirm={handleSyncConfirm}
        onCancel={handleSyncCancel}
        guestWishlistCount={guestWishlistCount}
      />

      <div className="container mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            {isGuestWishlist && isAuthenticated && guestWishlistCount > 0 && (
              <div className="mt-2 flex items-center space-x-2">
                <p className="text-orange-600 text-sm">
                  🔄 You have {guestWishlistCount} item{guestWishlistCount > 1 ? 's' : ''} in guest wishlist
                </p>
                <button
                  onClick={handleManualSync}
                  className="text-pink-600 hover:text-pink-800 text-sm font-medium underline"
                >
                  Sync now
                </button>
              </div>
            )}
            {isGuestWishlist && !isAuthenticated && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  💡 Your wishlist is saved in this browser. 
                  <Link 
                    to="/login" 
                    className="ml-1 font-semibold text-yellow-900 hover:text-yellow-700 underline"
                  >
                    Login to save it permanently
                  </Link>
                </p>
              </div>
            )}
          </div>
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
            <p className="text-gray-500 mb-6">Start adding products you love!</p>
            
            {isAuthenticated && guestWishlistCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm mb-3">
                  You have {guestWishlistCount} item{guestWishlistCount > 1 ? 's' : ''} saved in your guest wishlist
                </p>
                <button
                  onClick={handleManualSync}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm"
                >
                  Sync Guest Wishlist Items
                </button>
              </div>
            )}
            
            {!isAuthenticated && (
              <div className="p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  💡 <Link to="/login" className="font-semibold underline">Login</Link> to access your wishlist across devices
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <WishlistItem 
                  key={item._id} 
                  item={item} 
                  onRemove={handleRemoveFromWishlist} // ✅ Now passes both productId and productType
                />
              ))}
            </div>
            
            {/* Guest info footer */}
            {isGuestWishlist && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Save your wishlist</h3>
                    <p className="text-blue-800 text-sm">
                      Create an account to access your wishlist from any device
                    </p>
                  </div>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up Free
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Wishlist;