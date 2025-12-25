// Create a new component: MoveToCartButton.tsx
import React, { useState } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { cartActions } from '../../redux/actions/cartActions';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { toast } from 'react-toastify';

interface VariantData {
  variantId: string;
  name?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  attributes?: Array<{ key: string; label: string; value: string }>;
  sku?: string;
}

interface MoveToCartButtonProps {
  itemId: string; // Wishlist item ID
  productId: string;
  product?: any;
  variant?: VariantData | null;
  productType?: 'product' | 'prebuilt-pc';
  className?: string;
  quantity?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

const MoveToCartButton: React.FC<MoveToCartButtonProps> = ({ 
  itemId,
  productId, 
  product,
  variant, 
  productType = 'product', 
  className = '', 
  quantity = 1, 
  disabled = false,
  children 
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

const handleMoveToCart = async () => {
  try {
   
    // Remove from wishlist first
    await dispatch(wishlistActions.removeFromWishlist({ 
      itemId: item._id
    }));
    
    // Then add to cart based on product type
    if (item.productType === 'prebuilt-pc') {
      await dispatch(cartActions.addPreBuiltPCToCart({ 
        pcId: item.product._id, 
        quantity: 1,
        preBuiltPC: item.product // Pass product data
      }));
    } else {
      // ✅ CRITICAL FIX: Create a DEEP COPY of product data
      const productData = {
        ...item.product,
        // Ensure images object is properly structured
        images: item.product.images ? {
          ...item.product.images,
          thumbnail: item.product.images.thumbnail ? {
            ...item.product.images.thumbnail
          } : undefined
        } : {},
        // Ensure all required fields are present
        name: item.product.name || 'Product',
        slug: item.product.slug || '',
        price: item.variant?.price || item.product.price || 0,
        mrp: item.variant?.mrp || item.product.mrp || 0,
        stockQuantity: item.variant?.stock || item.product.stockQuantity || 0
      };
      
      await dispatch(cartActions.addToCart({ 
        productId: item.product._id,
        variantId: item.variant?.variantId,
        variantData: item.variant ? {
          variantId: item.variant.variantId,
          name: item.variant.name,
          price: item.variant.price,
          mrp: item.variant.mrp,
          stock: item.variant.stock,
          attributes: item.variant.attributes,
          sku: item.variant.sku,
          // Include variant images if available
          images: item.variant.images
        } : undefined,
        quantity: 1,
        product: productData // Pass the complete product data
      }));
    }
    
  } catch (error) {
    console.error('❌ Failed to move to cart:', error);
  }
};

  return (
    <button
      onClick={handleMoveToCart}
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
          <span>Moving...</span>
        </div>
      ) : (
        children || 'Move to Cart'
      )}
    </button>
  );
};

export default MoveToCartButton;