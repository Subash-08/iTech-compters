import React, { useState } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  className?: string;
  quantity?: number;
  disabled?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ 
  productId, 
  variantId, 
  className = '',
  quantity = 1,
  disabled = false
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      await dispatch(cartActions.addToCart({ 
        productId, 
        variantId, 
        quantity 
      }));
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
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Adding...</span>
        </div>
      ) : (
        'Add to Cart'
      )}
    </button>
  );
};

export default AddToCartButton;