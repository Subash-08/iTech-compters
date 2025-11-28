// components/product/AddToCartButton.tsx - ENHANCED DEBUG
import React, { useState } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';

interface VariantData {
  variantId: string;
  name?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  attributes?: Array<{ key: string; label: string; value: string }>;
  sku?: string;
}

interface AddToCartButtonProps {
  productId: string;
  variant?: VariantData | null;
  productType?: 'product' | 'prebuilt-pc';
  className?: string;
  quantity?: number;
  disabled?: boolean;
  showIcon?: boolean;
  iconSize?: string;
  children?: React.ReactNode;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ 
  productId, 
  variant,
  productType = 'product',
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
    
    console.log('🛒 AddToCartButton clicked with:', {
      productId,
      variant,
      productType,
      quantity,
      hasVariant: !!variant,
      variantId: variant?.variantId
    });
    
    setLoading(true);
    try {
      if (productType === 'prebuilt-pc') {
        await dispatch(cartActions.addPreBuiltPCToCart({ 
          pcId: productId, 
          quantity 
        }));
      } else {
        // ✅ FIXED: Send both productId and variant data
        const cartPayload = {
          productId, 
          variantId: variant?.variantId, // Extract variantId from variant object
          variantData: variant, // Send full variant data
          quantity 
        };
        
        console.log('🛒 Dispatching cart payload:', cartPayload);
        
        await dispatch(cartActions.addToCart(cartPayload));
      }
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