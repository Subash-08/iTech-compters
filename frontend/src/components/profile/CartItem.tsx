import React, { useState } from 'react';
import { CartItem as CartItemType } from '../../redux/types/cartTypes';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  onRemove: (productId: string, variantId: string | undefined) => void;
  updating: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove, updating }) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const product = item.product;
  const variant = item.variant;
  
  // Get display price - use variant price if available, otherwise product price
  const displayPrice = variant?.price || product.price;
  const totalPrice = displayPrice * item.quantity;
  
  // Get display image - use first product image
  const displayImage = product.images?.[0] || '/images/placeholder-product.jpg';
  
  // Get display name - include variant name if available
  const displayName = variant ? `${product.name} - ${variant.name}` : product.name;

  // Handle quantity change
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 100) return;
    
    setLocalQuantity(newQuantity);
    setIsUpdating(true);
    
    try {
      await onUpdateQuantity(product._id, variant?._id, newQuantity);
    } catch (error) {
      // Revert on error
      setLocalQuantity(item.quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle increment
  const handleIncrement = () => {
    handleQuantityChange(item.quantity + 1);
  };

  // Handle decrement
  const handleDecrement = () => {
    if (item.quantity > 1) {
      handleQuantityChange(item.quantity - 1);
    }
  };

  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      handleQuantityChange(value);
    }
  };

  // Handle remove item
  const handleRemove = () => {
    onRemove(product._id, variant?._id);
  };

  // Check stock availability
  const availableStock = variant?.stock || product.stock;
  const isOutOfStock = availableStock === 0;
  const isLowStock = availableStock > 0 && availableStock <= 10;

  return (
    <div className={`flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg ${
      isUpdating || updating ? 'opacity-60' : ''
    }`}>
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={displayImage}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder-product.jpg';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {displayName}
            </h3>
            
            {/* Variant Info */}
            {variant && (
              <p className="text-sm text-gray-600 mt-1">
                Variant: {variant.name}
              </p>
            )}

            {/* Stock Status */}
            <div className="mt-1">
              {isOutOfStock ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Only {availableStock} left
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  In Stock
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-2">
              <p className="text-lg font-bold text-gray-900">
                ${displayPrice.toFixed(2)}
              </p>
              {variant && variant.price !== product.price && (
                <p className="text-sm text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isUpdating || updating}
            className="ml-4 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50"
            aria-label="Remove item from cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Quantity Controls and Total */}
        <div className="flex items-center justify-between mt-4">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={handleDecrement}
                disabled={item.quantity <= 1 || isUpdating || updating || isOutOfStock}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Decrease quantity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <input
                type="number"
                min="1"
                max="100"
                value={localQuantity}
                onChange={handleInputChange}
                disabled={isUpdating || updating || isOutOfStock}
                className="w-16 py-1 text-center border-0 focus:ring-0 focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              
              <button
                onClick={handleIncrement}
                disabled={item.quantity >= 100 || isUpdating || updating || isOutOfStock || item.quantity >= availableStock}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Increase quantity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Loading Spinner */}
            {(isUpdating || updating) && (
              <div className="ml-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Item Total */}
          <div className="text-right">
            <p className="text-sm text-gray-600">Item Total:</p>
            <p className="text-xl font-bold text-gray-900">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Max quantity warning */}
        {item.quantity >= 100 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Maximum quantity per item is 100
            </p>
          </div>
        )}

        {/* Stock limit warning */}
        {availableStock > 0 && item.quantity > availableStock && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Only {availableStock} items available in stock
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;