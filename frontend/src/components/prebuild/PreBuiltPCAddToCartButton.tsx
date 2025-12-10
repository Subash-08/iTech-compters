// components/prebuilt/PreBuiltPCAddToCartButton.tsx - FIXED VERSION
import React, { useState } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';

interface PreBuiltPCAddToCartButtonProps {
  pcId: string;
  product?: any; // ✅ ADD THIS
  className?: string;
  quantity?: number;
  disabled?: boolean;
  showIcon?: boolean;
  iconSize?: string;
  children?: React.ReactNode;
}

const PreBuiltPCAddToCartButton: React.FC<PreBuiltPCAddToCartButtonProps> = ({ 
  pcId, 
  product, // ✅ ADD THIS
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
      await dispatch(cartActions.addPreBuiltPCToCart({ 
        pcId, 
        quantity,
        product // ✅ PASS PRODUCT DATA
      }));
    } catch (error) {
      console.error('Failed to add pre-built PC to cart:', error);
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

export default PreBuiltPCAddToCartButton;