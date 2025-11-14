// components/wishlist/WishlistSyncModal.tsx
import React from 'react';

interface WishlistSyncModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  guestWishlistCount: number;
}

const WishlistSyncModal: React.FC<WishlistSyncModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  guestWishlistCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="bg-pink-100 p-3 rounded-full mr-4">
            <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sync Your Wishlist?</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          We found {guestWishlistCount} item{guestWishlistCount > 1 ? 's' : ''} in your guest wishlist. 
          Would you like to add them to your account?
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            No, Keep Separate
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors font-medium"
          >
            Yes, Sync Now
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          You can always sync later from your wishlist page
        </p>
      </div>
    </div>
  );
};

export default WishlistSyncModal;