// components/cart/CartItem.tsx - FIXED IMAGE HANDLING
import React from 'react';
import { Link } from 'react-router-dom';

interface CartItemProps {
  item: any;
  onUpdateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  onRemove: (productId: string, variantId: string | undefined) => void;
  onUpdatePreBuiltPCQuantity?: (pcId: string, quantity: number) => void;
  onRemovePreBuiltPC?: (pcId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  onUpdatePreBuiltPCQuantity,
  onRemovePreBuiltPC 
}) => {
  // Debug logging to see the actual item structure
  console.log('🛒 CartItem Debug:', item);

  // Determine if this is a pre-built PC or regular product
  const isPreBuiltPC = item.productType === 'prebuilt-pc' || item.preBuiltPC || item.pcId;
  
  // Enhanced data extraction with comprehensive fallbacks
  const product = item.product || {};
  const preBuiltPC = item.preBuiltPC || {};
  
  // FIXED: Get item ID - check multiple possible locations
  const getItemId = () => {
    if (isPreBuiltPC) {
      // Check all possible locations for PC ID
      return preBuiltPC._id || item.pcId || item.preBuiltPC || item._id;
    } else {
      // For regular products
      return product._id || item.productId || item.product || item._id;
    }
  };

  // FIXED: Enhanced image handling with proper URL formatting
  const getItemImage = () => {
    let images = [];
    
    if (isPreBuiltPC) {
      images = preBuiltPC.images || item.images || [];
    } else {
      images = product.images || item.images || [];
    }
    
    console.log('🖼️ Raw images data:', images);
    
    // Handle different image formats
    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      
      // If array of image objects with url property
      if (firstImage?.url) {
        console.log('🖼️ Using image URL from object:', firstImage.url);
        return formatImageUrl(firstImage.url);
      }
      
      // If array of strings (URLs)
      if (typeof firstImage === 'string') {
        console.log('🖼️ Using image URL from string:', firstImage);
        return formatImageUrl(firstImage);
      }
      
      // If array of objects with public_id and url (Cloudinary)
      if (firstImage?.public_id && firstImage?.url) {
        console.log('🖼️ Using Cloudinary image:', firstImage.url);
        return formatImageUrl(firstImage.url);
      }
    }
    
    // Handle single image object
    if (images?.url) {
      console.log('🖼️ Using single image URL:', images.url);
      return formatImageUrl(images.url);
    }
    
    // Handle thumbnail
    if (images?.thumbnail?.url) {
      console.log('🖼️ Using thumbnail URL:', images.thumbnail.url);
      return formatImageUrl(images.thumbnail.url);
    }
    
    // Handle main image for pre-built PCs
    if (images?.main?.url) {
      console.log('🖼️ Using main image URL:', images.main.url);
      return formatImageUrl(images.main.url);
    }
    
    console.log('🖼️ No valid image found, using placeholder');
    return '/images/placeholder-image.jpg'; // Make sure this path exists
  };

  // Helper function to format image URLs
  const formatImageUrl = (url: string): string => {
    if (!url) return '/images/placeholder-image.jpg';
    
    // If it's already a full URL (http/https)
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's a data URL (base64)
    if (url.startsWith('data:')) {
      return url;
    }
    
    // If it's a relative path starting with /uploads or similar
    if (url.startsWith('/')) {
      // For development - adjust base URL as needed
      const baseURL = process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-domain.com' 
        : 'http://localhost:5000';
      return `${baseURL}${url}`;
    }
    
    // If it's a relative path without leading slash
    return `/${url}`;
  };

  // Get item link based on type
  const getItemLink = () => {
    const itemId = getItemId();
    
    if (isPreBuiltPC) {
      const pcSlug = preBuiltPC.slug || preBuiltPC._id || itemId;
      return `/prebuilt-pc/${pcSlug}`;
    } else {
      const baseLink = `/product/${product.slug || product._id || itemId}`;
      const variantId = item.variant?._id || item.variantId || item.variant?.variantId;
      if (variantId) {
        return `${baseLink}?variant=${variantId}`;
      }
      return baseLink;
    }
  };

  // Get item name
  const getItemName = () => {
    if (isPreBuiltPC) {
      return preBuiltPC.name || item.name || 'Pre-built PC';
    }
    return product.name || item.name || 'Product';
  };

  // Get item price
  const getItemPrice = () => {
    // Use item price first, then fall back to product/PC price
    if (item.price > 0) {
      return item.price;
    }
    
    if (isPreBuiltPC) {
      return preBuiltPC.discountPrice || preBuiltPC.totalPrice || preBuiltPC.offerPrice || preBuiltPC.basePrice || 0;
    }
    return product.offerPrice || product.basePrice || 0;
  };

  // Handle quantity update
  const handleUpdateQuantity = (newQuantity: number) => {
    const itemId = getItemId();
    console.log('🔄 Updating quantity for:', { itemId, newQuantity, isPreBuiltPC });
    
    if (isPreBuiltPC && onUpdatePreBuiltPCQuantity) {
      onUpdatePreBuiltPCQuantity(itemId, newQuantity);
    } else {
      onUpdateQuantity(itemId, item.variantId, newQuantity);
    }
  };

  // Handle remove
  const handleRemove = () => {
    const itemId = getItemId();
    console.log('🗑️ Removing item:', { itemId, isPreBuiltPC });
    
    if (isPreBuiltPC && onRemovePreBuiltPC) {
      onRemovePreBuiltPC(itemId);
    } else {
      onRemove(itemId, item.variantId);
    }
  };

  const itemImage = getItemImage();
  const itemName = getItemName();
  const itemPrice = getItemPrice();
  const itemId = getItemId();
  const itemLink = getItemLink();

  // Handle image error with better fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('🖼️ Image failed to load:', itemImage);
    const target = e.target as HTMLImageElement;
    
    // If the current src is already the placeholder, don't try to set it again
    if (target.src.includes('placeholder-image.jpg')) {
      console.log('🖼️ Placeholder also failed to load');
      return;
    }
    
    // Try different placeholder paths
    const placeholderPaths = [
      '/images/placeholder-image.jpg',
      '/placeholder-image.jpg',
      '/img/placeholder.jpg',
      'https://via.placeholder.com/150?text=No+Image'
    ];
    
    for (const path of placeholderPaths) {
      target.src = path;
      // If this loads successfully, break the loop
      target.onload = () => console.log('🖼️ Placeholder loaded successfully:', path);
      break;
    }
  };

  return (
    <div className="flex items-center p-4 border-b">
      <Link to={itemLink} className="flex-shrink-0">
        <img 
          src={itemImage} 
          alt={itemName}
          className="w-20 h-20 object-cover rounded hover:opacity-90 transition-opacity"
          onError={handleImageError}
          loading="lazy"
        />
      </Link>
      
      <div className="ml-4 flex-1">
        {/* Item type badge */}
        {isPreBuiltPC && (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-1">
            🖥️ Pre-built PC
          </span>
        )}
        
        <Link to={itemLink} className="hover:text-blue-600 transition-colors">
          <h3 className="font-semibold text-lg text-gray-900 hover:underline">
            {itemName}
          </h3>
        </Link>
        
        {/* Pre-built PC specifications */}
        {isPreBuiltPC && (
          <div className="text-sm text-gray-600 mt-1">
            {/* Check various locations for specifications */}
            {(preBuiltPC.specifications?.processor || preBuiltPC.processor) && (
              <div>CPU: {preBuiltPC.specifications?.processor || preBuiltPC.processor}</div>
            )}
            {(preBuiltPC.specifications?.graphicsCard || preBuiltPC.graphicsCard) && (
              <div>GPU: {preBuiltPC.specifications?.graphicsCard || preBuiltPC.graphicsCard}</div>
            )}
            {(preBuiltPC.performanceRating || item.performanceRating) && (
              <div className="flex items-center mt-1">
                <span className="text-yellow-500 mr-1">⭐</span>
                <span>Performance: {(preBuiltPC.performanceRating || item.performanceRating || 0)}/10</span>
              </div>
            )}
          </div>
        )}
        
        {/* Variant information for products */}
        {!isPreBuiltPC && item.variant && (
          <div className="text-sm text-gray-600 mt-1">
            {item.variant.color && <span>Color: {item.variant.color}</span>}
            {item.variant.size && <span className="ml-2">Size: {item.variant.size}</span>}
            {item.variant.name && <span className="ml-2">Variant: {item.variant.name}</span>}
          </div>
        )}
        
        <p className="text-gray-600 text-xl font-bold mt-1">${itemPrice.toFixed(2)}</p>
        
        {/* Enhanced debug info */}
        <div className="text-xs text-gray-400 mt-1">
          Type: {isPreBuiltPC ? 'Pre-built PC' : 'Product'} | 
          ID: {itemId} | 
          Price: ${itemPrice} | 
          Qty: {item.quantity}
          {!isPreBuiltPC && item.variantId && ` | Variant: ${item.variantId}`}
        </div>
        
        {/* Quantity controls */}
        <div className="flex items-center mt-3 space-x-2">
          <button 
            onClick={() => handleUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            -
          </button>
          <span className="mx-2 font-semibold text-gray-700 min-w-8 text-center">
            {item.quantity}
          </span>
          <button 
            onClick={() => handleUpdateQuantity(item.quantity + 1)}
            disabled={item.quantity >= 100}
            className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            +
          </button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">
          ${(itemPrice * item.quantity).toFixed(2)}
        </p>
        <button 
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700 font-semibold text-sm mt-2 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;