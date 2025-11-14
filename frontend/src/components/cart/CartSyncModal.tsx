// components/cart/CartSyncModal.tsx
import React from 'react';

interface CartSyncModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  guestCartCount: number;
}

const CartSyncModal: React.FC<CartSyncModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  guestCartCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sync Your Cart?</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          We found {guestCartCount} item{guestCartCount > 1 ? 's' : ''} in your guest cart. 
          Would you like to merge them with your account?
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
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Yes, Sync Now
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          You can always sync later from your cart page
        </p>
      </div>
    </div>
  );
};

export default CartSyncModal;