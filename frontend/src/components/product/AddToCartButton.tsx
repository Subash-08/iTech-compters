import React, { useState } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';
import { toast } from 'react-toastify'; // ✅ ADD THIS IMPORT

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
  product?: any; // ✅ ADDED: Accept full product object
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
  product, // ✅ Destructure product
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent parent link clicks
    e.stopPropagation();

    if (loading || disabled) return;

    setLoading(true);
    try {
      if (productType === 'prebuilt-pc') {
        await dispatch(cartActions.addPreBuiltPCToCart({ 
          pcId: productId, 
          quantity,
          preBuiltPC: product // Pass PC data for guest cart
        }));
      } else {
        // ✅ ENHANCED: Create product data if not provided
        const productData = product || {
          _id: productId,
          name: 'Product',
          effectivePrice: variant?.price || 0,
          offerPrice: variant?.price || 0,
          price: variant?.price || 0,
          images: []
        };
        
        const cartPayload = {
          productId, 
          variantId: variant?.variantId, 
          variantData: variant, 
          quantity,
          product: productData
        };
        await dispatch(cartActions.addToCart(cartPayload));
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add product to cart');
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
        children || (
          <div className="flex items-center justify-center gap-2">
             {showIcon && (
               <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
               </svg>
             )}
             <span>Add to Cart</span>
          </div>
        )
      )}
    </button>
  );
};

export default AddToCartButton;