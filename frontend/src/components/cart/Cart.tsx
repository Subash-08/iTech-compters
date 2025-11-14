// components/cart/Cart.tsx - UPDATE IMPORTS
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';
import { 
  selectCartItems, 
  selectCartLoading, 
  selectCartError, 
  selectCartTotal, 
  selectCartItemsCount,
  selectIsGuestCart,
  selectPreBuiltPCItems, // Now from cartSelectors
  selectProductItems      // Now from cartSelectors
} from '../../redux/selectors/cartSelectors'; // Import from cartSelectors
import { selectIsAuthenticated, selectUser } from '../../redux/selectors';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import CartItem from './CartItem';
import CartSyncModal from './CartSyncModal';
import { useNavigate } from 'react-router-dom';
import { localStorageUtils } from '../utils/localStorage';
import { toast } from 'react-toastify';

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const cartItems = useAppSelector(selectCartItems);
  const preBuiltPCItems = useAppSelector(selectPreBuiltPCItems); // NEW
  const productItems = useAppSelector(selectProductItems); // NEW
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const cartTotal = useAppSelector(selectCartTotal);
  const itemsCount = useAppSelector(selectCartItemsCount);
  const isGuestCart = useAppSelector(selectIsGuestCart);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // State for sync modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [hasCheckedSync, setHasCheckedSync] = useState(false);

  useEffect(() => {
    dispatch(cartActions.fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && isAuthenticated && user && !hasCheckedSync) {
      const guestCart = localStorageUtils.getGuestCart();
      const lastSyncedUser = localStorageUtils.getLastSyncedUser();
      const currentUserId = user._id;

      console.log('🛒 Cart Sync Debug:');
      console.log('🛒 guestCart length:', guestCart.length);
      console.log('🛒 lastSyncedUser:', lastSyncedUser);
      console.log('🛒 currentUserId:', currentUserId);
      console.log('🛒 hasCheckedSync:', hasCheckedSync);

      // Show modal if there are guest items
      const shouldShowModal = guestCart.length > 0;

      console.log('🛒 shouldShowModal:', shouldShowModal);

      if (shouldShowModal) {
        console.log('🛒 Showing sync modal');
        setShowSyncModal(true);
      } else {
        console.log('🛒 Not showing modal - conditions not met');
      }
      
      setHasCheckedSync(true);
    }
  }, [loading, isAuthenticated, user, hasCheckedSync]);

  const handleSyncConfirm = async () => {
    try {
      setShowSyncModal(false);
      await dispatch(cartActions.syncGuestCart());
      // Refresh cart after sync
      await dispatch(cartActions.fetchCart());
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  };

  const handleSyncCancel = () => {
    setShowSyncModal(false);
    localStorage.setItem('cart_sync_seen', 'true');
  };

  // Enhanced handlers for both product types
  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    dispatch(cartActions.updateCartQuantity({ productId, variantId, quantity }));
  };

  const handleUpdatePreBuiltPCQuantity = (pcId: string, quantity: number) => {
    dispatch(cartActions.updatePreBuiltPCQuantity(pcId, quantity));
  };

  const handleRemoveItem = (productId: string, variantId: string | undefined) => {
    dispatch(cartActions.removeFromCart({ productId, variantId }));
  };

  const handleRemovePreBuiltPC = (pcId: string) => {
    dispatch(cartActions.removePreBuiltPCFromCart(pcId));
  };

  const handleClearCart = () => {
    dispatch(cartActions.clearCart());
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?returnUrl=/cart&checkout=true');
      return;
    }
    
    navigate('/checkout');
  };

  const handleManualSync = () => {
    const guestCart = localStorageUtils.getGuestCart();
    if (guestCart.length > 0) {
      setShowSyncModal(true);
    } else {
      toast.info('No guest cart items to sync');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Get guest cart count for modal
  const guestCartCount = localStorageUtils.getGuestCart().length;

  return (
    <>
      <CartSyncModal
        isOpen={showSyncModal}
        onConfirm={handleSyncConfirm}
        onCancel={handleSyncCancel}
        guestCartCount={guestCartCount}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            
            {/* Cart type breakdown */}
            {(preBuiltPCItems.length > 0 || productItems.length > 0) && (
              <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                {productItems.length > 0 && (
                  <span>Products: {productItems.length}</span>
                )}
                {preBuiltPCItems.length > 0 && (
                  <span>Pre-built PCs: {preBuiltPCItems.length}</span>
                )}
              </div>
            )}
            
            {isGuestCart && isAuthenticated && guestCartCount > 0 && (
              <div className="mt-2 flex items-center space-x-2">
                <p className="text-orange-600 text-sm">
                  🔄 You have {guestCartCount} item{guestCartCount > 1 ? 's' : ''} in guest cart
                </p>
                <button
                  onClick={handleManualSync}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                  Sync now
                </button>
              </div>
            )}
            {isGuestCart && !isAuthenticated && (
              <p className="text-orange-600 mt-1 text-sm">
                🔒 Guest cart - <a href="/login" className="underline font-medium">Login</a> to save your items
              </p>
            )}
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Start adding some products!</p>
            
            {isAuthenticated && guestCartCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm mb-3">
                  You have {guestCartCount} item{guestCartCount > 1 ? 's' : ''} saved in your guest cart
                </p>
                <button
                  onClick={handleManualSync}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Sync Guest Cart Items
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                {cartItems.map((item, index) => (
                  <CartItem
                    key={`${item._id}-${item.productType}-${index}`}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    onUpdatePreBuiltPCQuantity={handleUpdatePreBuiltPCQuantity}
                    onRemovePreBuiltPC={handleRemovePreBuiltPC}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 h-fit">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
              
              {isGuestCart && isAuthenticated && guestCartCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    💡 <strong>Guest items available:</strong> You have {guestCartCount} item{guestCartCount > 1 ? 's' : ''} in guest cart
                  </p>
                  <button
                    onClick={handleManualSync}
                    className="text-yellow-800 hover:text-yellow-900 text-sm font-medium underline mt-1"
                  >
                    Sync to account
                  </button>
                </div>
              )}
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Items ({itemsCount})</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                {/* Item type breakdown */}
                {productItems.length > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Products ({productItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    <span>${productItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</span>
                  </div>
                )}
                
                {preBuiltPCItems.length > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Pre-built PCs ({preBuiltPCItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    <span>${preBuiltPCItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;