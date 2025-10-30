import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';
import { selectCartItems, selectCartLoading, selectCartError, selectCartTotal, selectCartItemsCount } from '../../redux/selectors/cartSelectors';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import CartItem from './CartItem';

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const cartTotal = useAppSelector(selectCartTotal);
  const itemsCount = useAppSelector(selectCartItemsCount);

  useEffect(() => {
    dispatch(cartActions.fetchCart());
  }, [dispatch]);

  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    dispatch(cartActions.updateCartQuantity({ productId, variantId, quantity }));
  };

  const handleRemoveItem = (productId: string, variantId: string | undefined) => {
    dispatch(cartActions.removeFromCart({ productId, variantId }));
  };

  const handleClearCart = () => {
    dispatch(cartActions.clearCart());
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
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
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
          <p className="text-gray-500">Start adding some products!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {cartItems.map((item) => (
                <CartItem
                    key={`${item.product._id}-${item.variant?.variantId || 'no-variant'}`}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                />
                ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Items ({itemsCount})</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
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

            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;