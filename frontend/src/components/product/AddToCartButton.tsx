// components/product/AddToCartButton.tsx - UPDATED VERSION
import React, { useState } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  productData?: any;
  productType?: 'product' | 'prebuilt-pc'; // NEW: Add productType
  className?: string;
  quantity?: number;
  disabled?: boolean;
  showIcon?: boolean;
  iconSize?: string;
  children?: React.ReactNode;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ 
  productId, 
  variantId, 
  productData,
  productType = 'product', // Default to 'product' for backward compatibility
  className = '',
  quantity = 1,
  disabled = false,
  showIcon = true,
  iconSize = "w-4 h-4",
  children 
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      if (productType === 'prebuilt-pc') {
        // Use pre-built PC specific action
        await dispatch(cartActions.addPreBuiltPCToCart({ 
          pcId: productId, 
          quantity 
        }));
      } else {
        // Use regular product action
        await dispatch(cartActions.addToCart({ 
          productId, 
          variantId, 
          quantity 
        }));
      }
      // Optional: Show success message or notification
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || disabled}
      className={`${className} ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      } transition-opacity duration-200`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Adding...</span>
        </div>
      ) : (
        children || 'Add to Cart'
      )}
    </button>
  );
};

export default AddToCartButton;