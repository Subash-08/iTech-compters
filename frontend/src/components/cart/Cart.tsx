// components/cart/Cart.tsx - FIXED VERSION
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
  selectPreBuiltPCItems,
  selectProductItems,
  selectEnhancedCartSummary
} from '../../redux/selectors/cartSelectors';
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
  const preBuiltPCItems = useAppSelector(selectPreBuiltPCItems);
  const productItems = useAppSelector(selectProductItems);
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const cartTotal = useAppSelector(selectCartTotal);
  const itemsCount = useAppSelector(selectCartItemsCount);
  const isGuestCart = useAppSelector(selectIsGuestCart);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const cartSummary = useAppSelector(selectEnhancedCartSummary);

  // State for sync modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [hasCheckedSync, setHasCheckedSync] = useState(false);

  // Enhanced cart fetch with product data
  useEffect(() => {
    dispatch(cartActions.fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && isAuthenticated && user && !hasCheckedSync) {
      const guestCart = localStorageUtils.getGuestCart();
      const shouldShowModal = guestCart.length > 0;

      if (shouldShowModal) {
        setShowSyncModal(true);
      }
      
      setHasCheckedSync(true);
    }
  }, [loading, isAuthenticated, user, hasCheckedSync]);

  const handleSyncConfirm = async () => {
    try {
      setShowSyncModal(false);
      await dispatch(cartActions.syncGuestCart());
      await dispatch(cartActions.fetchCart());
      toast.success('Cart synced successfully!');
    } catch (error) {
      console.error('Failed to sync cart:', error);
      toast.error('Failed to sync cart');
    }
  };

  const handleSyncCancel = () => {
    setShowSyncModal(false);
    localStorage.setItem('cart_sync_seen', 'true');
  };

  // Enhanced handlers for both product types
  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
   if (quantity === 0) {
     // Remove item if quantity is 0
     dispatch(cartActions.removeFromCart({ productId, variantId }));
     toast.info('Item removed from cart');
   } else {
     dispatch(cartActions.updateCartQuantity({ productId, variantId, quantity }));
     toast.success('Quantity updated', { toastId: 'cart-quantity-update' });
   }
  };

  const handleUpdatePreBuiltPCQuantity = (pcId: string, quantity: number) => {    
    if (quantity === 0) {
      dispatch(cartActions.removePreBuiltPCFromCart(pcId));
      toast.info('PC removed from cart');
    } else {
      dispatch(cartActions.updatePreBuiltPCQuantity(pcId, quantity));
      toast.success('PC quantity updated', { toastId: 'prebuilt-pc-quantity-update' });
    }
  };

  const handleRemoveItem = (productId: string, variantId?: string) => {
    dispatch(cartActions.removeFromCart({ 
      productId,
      variantId
    }));
    toast.info('Item removed from cart');
  };

  const handleRemovePreBuiltPC = (pcId: string) => {
    dispatch(cartActions.removePreBuiltPCFromCart(pcId));
    toast.info('PC removed from cart');
  };

  const handleClearCart = () => {
    dispatch(cartActions.clearCart());
    toast.info('Cart cleared');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?returnUrl=/cart&checkout=true');
      return;
    }
    
    // Validate cart before checkout
    const invalidItems = cartItems.filter(item => 
      (!item.product && !item.preBuiltPC) || item.price === 0
    );
    
    if (invalidItems.length > 0) {
      toast.error('Some items in your cart have issues. Please refresh the page.');
      console.error('Invalid items in cart:', invalidItems);
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


  const handleRefreshCart = () => {
    dispatch(cartActions.fetchCart());
    toast.info('Refreshing cart data...');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner />
        <span className="mt-4 text-gray-500 font-medium animate-pulse">Loading your cart...</span>
      </div>
    );
  }

  const guestCartCount = localStorageUtils.getGuestCart().length;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <CartSyncModal
        isOpen={showSyncModal}
        onConfirm={handleSyncConfirm}
        onCancel={handleSyncCancel}
        guestCartCount={guestCartCount}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Shopping Cart</h1>
            {(preBuiltPCItems.length > 0 || productItems.length > 0) && (
              <p className="mt-1 text-sm text-gray-500">
                You have {itemsCount} items in your cart
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
             {/* Guest Cart Badge/Button */}
             {isGuestCart && isAuthenticated && guestCartCount > 0 && (
              <button
                onClick={handleManualSync}
                className="inline-flex items-center px-4 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <span className="mr-2">🔄</span>
                Sync {guestCartCount} Guest Item{guestCartCount > 1 ? 's' : ''}
              </button>
            )}

            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">⚠️</div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Guest Warning */}
        {isGuestCart && !isAuthenticated && (
          <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg mb-6 flex items-start sm:items-center gap-3">
            <span className="text-lg">🔒</span>
            <p className="text-sm">
              You are viewing a <strong>Guest Cart</strong>. <a href="/login" className="underline font-bold hover:text-blue-900">Login now</a> to save your items permanently across devices.
            </p>
          </div>
        )}

        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-2xl mx-auto mt-8">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-gray-300">🛒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Browse our products to find the perfect gear.</p>
            
  <button 
              onClick={() => navigate('/products')}
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              Start Shopping
            </button>

            {isAuthenticated && guestCartCount > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-3">
                  Wait! You have {guestCartCount} items saved in your guest history.
                </p>
                <button
                  onClick={handleManualSync}
                  className="text-blue-600 font-medium text-sm hover:underline"
                >
                  Retrieve Guest Items
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Cart Content Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
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

            {/* Right Column: Order Summary (Sticky) */}
            <div className="lg:col-span-4 sticky top-24">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                  Order Summary
                </h3>
                
                {isGuestCart && isAuthenticated && guestCartCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-600 mt-0.5">💡</span>
                      <div>
                        <p className="text-yellow-800 text-xs font-semibold mb-1 uppercase tracking-wide">Pending Items</p>
                        <p className="text-yellow-900 text-sm mb-2">
                          You have {guestCartCount} item{guestCartCount > 1 ? 's' : ''} in your guest history.
                        </p>
                        <button
                          onClick={handleManualSync}
                          className="text-yellow-800 hover:text-yellow-950 text-xs font-bold underline"
                        >
                          Sync to Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 mb-6">
                  {/* Subtotal */}
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({itemsCount} items)</span>
                    <span className="font-medium text-gray-900">₹{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  
                  {/* Item type breakdown (Mini details) */}
                  <div className="text-xs space-y-2 pt-2 pb-2 border-y border-dashed border-gray-100">
                    {productItems.length > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>• Products ({productItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                        <span>₹{productItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}</span>
                      </div>
                    )}
                    {preBuiltPCItems.length > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>• PCs ({preBuiltPCItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                        <span>₹{preBuiltPCItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-0.5 rounded">Calculated at checkout</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="text-gray-400 text-sm">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-base font-medium text-gray-900">Total Amount</span>
                    <span className="text-2xl font-extrabold text-gray-900">₹{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-1">Including GST where applicable</p>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={cartItems.some(item => (!item.product && !item.preBuiltPC) || item.price === 0)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-lg shadow-sm transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                    cartItems.some(item => (!item.product && !item.preBuiltPC) || item.price === 0)
                      ? 'bg-gray-200 cursor-not-allowed text-gray-400 shadow-none'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white'
                  }`}
                >
                  {cartItems.some(item => (!item.product && !item.preBuiltPC) || item.price === 0)
                    ? 'Fix Cart Issues'
                    : (
                      <>
                        Checkout 
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                    )
                  }
                </button>
                
                {/* Security Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;