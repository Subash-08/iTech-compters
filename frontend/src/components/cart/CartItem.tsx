import React from 'react';
import { Link } from 'react-router-dom';
import { CartItem as CartItemType } from '../../redux/types/cartTypes';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  onRemove: (productId: string, variantId: string | undefined) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const product = item.product;

  if (!product) {
    return (
      <div className="p-4 border-b border-gray-200 text-center">
        <p className="text-gray-500">Product not available</p>
      </div>
    );
  }

  // 🆕 FIX: Find the matching variant from product data to get images
  const findVariantWithImages = () => {
    if (!item.variant?.variantId || !product.variants) return null;
    
    // Convert both to string for comparison
    const searchVariantId = item.variant.variantId.toString();
    
    return product.variants.find(variant => 
      variant._id?.toString() === searchVariantId || 
      variant.variantId?.toString() === searchVariantId
    );
  };
  const fullVariant = findVariantWithImages();
  // USE THE CART ITEM PRICE DIRECTLY - it's already set correctly
  const itemPrice = item.price;

  // Validate price before using toFixed
  if (itemPrice === undefined || itemPrice === null || typeof itemPrice !== 'number') {
    console.error('❌ Invalid price detected:', itemPrice);
    return (
      <div className="p-4 border-b border-gray-200 text-center bg-red-50">
        <p className="text-red-500">Price error - please remove and re-add this item</p>
        <button
          onClick={() => onRemove(product._id, item.variant?.variantId)}
          className="text-red-500 hover:text-red-700 text-sm mt-1"
        >
          Remove Item
        </button>
      </div>
    );
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 100) {
      onUpdateQuantity(product._id, item.variant?.variantId, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemove(product._id, item.variant?.variantId);
  };

  const itemTotal = itemPrice * item.quantity;
  
  // 🆕 FIX: Get variant-specific image from the full variant data
  const getProductImage = () => {
    // First try variant-specific images from the full variant data
    if (fullVariant?.images?.thumbnail?.url) {
      return fullVariant.images.thumbnail.url;
    }
    if (fullVariant?.images?.gallery && fullVariant.images.gallery.length > 0) {
      return fullVariant.images.gallery[0].url;
    }
    
    // Fallback to product images
    return product.images?.thumbnail?.url || 
           product.images?.[0]?.url || 
           'https://via.placeholder.com/300x300?text=Product+Image';
  };

  const productImage = getProductImage();

  // Get display name - show variant name if available
  const getDisplayName = () => {
    // Use full variant name if available, otherwise use cart item variant name
    if (fullVariant?.name) {
      return fullVariant.name;
    }
    if (item.variant?.name) {
      return item.variant.name;
    }
    return product.name;
  };

  const displayName = getDisplayName();

  // 🆕 Get variant attributes from full variant data
  const getVariantAttributes = () => {
    return fullVariant?.identifyingAttributes || item.variant?.attributes || [];
  };

  const variantAttributes = getVariantAttributes();

  // 🆕 FIX: Create product link with variant parameter
  const getProductLink = () => {
    const baseLink = `/product/${product.slug}`;
    
    const variantId = fullVariant?._id || item.variant?.variantId;
    if (variantId) {
      // Add variant parameter to URL
      return `${baseLink}?variant=${variantId}`;
    }
    
    return baseLink;
  };

  const productLink = getProductLink();

  return (
    <div className="p-6 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center space-x-4">
        {/* Product Image */}
        <Link to={productLink} className="flex-shrink-0">
          <img
            src={productImage}
            alt={displayName}
            className="w-20 h-20 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+Image';
            }}
          />
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <Link to={productLink}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {displayName}
              {(fullVariant?.name || item.variant?.name) && 
               (fullVariant?.name !== product.name || item.variant?.name !== product.name) && (
                <span className="text-sm font-normal text-gray-600 block">
                  ({product.name})
                </span>
              )}
            </h3>
          </Link>
          
          {/* Show variant attributes if available */}
          {variantAttributes.length > 0 && (
            <div className="text-sm text-gray-600 mt-1 space-y-1">
              {variantAttributes.map((attr, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium">{attr.label}:</span>
                  <span>{attr.displayValue || attr.value}</span>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-lg font-semibold text-gray-900 mt-2">
            ${itemPrice.toFixed(2)}
          </p>

          {/* Show variant-specific details */}
          {(fullVariant || item.variant) && (
            <div className="text-xs text-gray-500 mt-1">
              {fullVariant?.stockQuantity !== undefined && (
                <span>Stock: {fullVariant.stockQuantity} • </span>
              )}
              {item.variant?.stock !== undefined && !fullVariant && (
                <span>Stock: {item.variant.stock} • </span>
              )}
              <span>Variant ID: {item.variant?.variantId?.toString()}</span>
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            -
          </button>
          
          <span className="w-12 text-center font-semibold">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= 100}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            +
          </button>
        </div>

        {/* Total Price */}
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            ${itemTotal.toFixed(2)}
          </p>
          
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 text-sm mt-1 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;