// components/wishlist/Wishlist.tsx - LIST VIEW REDESIGN
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
import { ShoppingBag } from 'lucide-react';

const Wishlist: React.FC = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const loading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);
  const isGuestWishlist = useAppSelector(selectIsGuestWishlist);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [hasCheckedSync, setHasCheckedSync] = useState(false);

  useEffect(() => {
    dispatch(wishlistActions.fetchWishlist());
  }, [dispatch]);

  // Check if we need to show sync modal
  useEffect(() => {    
    if (!loading && isAuthenticated && user && !hasCheckedSync) {
      const guestWishlist = localStorageUtils.getGuestWishlist();
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
      await dispatch(wishlistActions.fetchWishlist());
    } catch (error) {
      console.error('Failed to sync wishlist:', error);
    }
  };

  const handleSyncCancel = () => {
    setShowSyncModal(false);
  };

  const handleRemoveFromWishlist = (itemId: string, productType: 'product' | 'prebuilt-pc') => {
    dispatch(wishlistActions.removeFromWishlist({ 
        itemId: itemId, 
        productType 
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
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  const guestWishlistCount = localStorageUtils.getGuestWishlist().length;

  return (
    <>
      <WishlistSyncModal
        isOpen={showSyncModal}
        onConfirm={handleSyncConfirm}
        onCancel={handleSyncCancel}
        guestWishlistCount={guestWishlistCount}
      />

      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          
          {/* Header - Minimalist */}
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              My Wishlist <span className="text-gray-400 font-normal ml-2 text-xl">{wishlistItems.length} items</span>
            </h1>

            {wishlistItems && wishlistItems.length > 0 && (
                <button
                onClick={handleClearWishlist}
                className="text-sm text-gray-500 hover:text-black underline underline-offset-4 transition-colors"
                >
                Clear All
                </button>
            )}
          </div>

          {/* Guest / Error Alerts */}
          {error && <div className="p-4 bg-red-50 text-red-600 mb-6 text-sm">{error}</div>}
          
          {isGuestWishlist && isAuthenticated && guestWishlistCount > 0 && (
            <div className="mb-8 flex items-center justify-between bg-gray-50 p-4 border border-gray-100">
                <span className="text-sm text-gray-600">You have items saved from a previous session.</span>
                <button onClick={handleManualSync} className="text-sm font-bold text-black border-b border-black">Sync Now</button>
            </div>
          )}

          {/* Content */}
          {!wishlistItems || wishlistItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex justify-center items-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                <ShoppingBag size={24} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
              <Link to="/products" className="inline-block mt-4 bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
                  Shop Now
              </Link>
            </div>
          ) : (
            /* LIST LAYOUT (Matches Image) */
            <div className="flex flex-col divide-y divide-gray-100 border-t border-b border-gray-100">
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
      </div>
    </>
  );
};

export default Wishlist;