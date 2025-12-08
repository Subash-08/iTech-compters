// components/cart/CartItem.tsx - FIXED IMAGE HANDLING FOR PRE-BUILT PCS
import React from 'react';
import { Link } from 'react-router-dom';
import { baseURL } from '../config/config';

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

  const isPreBuiltPC = item.productType === 'prebuilt-pc' || !!item.preBuiltPC || !!item.pcId;
  const product = item.product || {};
  const preBuiltPC = item.preBuiltPC || {};

  // In CartItem.tsx - Enhanced extractImageUrl function
const extractImageUrl = (images: any, type: string): string => {
  console.log(`🖼️ ${type} images:`, images);
  
  if (!images) {
    console.log(`🖼️ No ${type} images provided`);
    return '/images/placeholder-image.jpg';
  }
  
  // Case 1: Array of images
  if (Array.isArray(images) && images.length > 0) {
    const firstImage = images[0];
    
    // Array of objects with url property
    if (firstImage && firstImage.url) {
      const url = formatImageUrl(firstImage.url);
      console.log(`🖼️ Using array object URL: ${url}`);
      return url;
    }
    
    // Array of strings (direct URLs)
    if (typeof firstImage === 'string') {
      const url = formatImageUrl(firstImage);
      console.log(`🖼️ Using array string URL: ${url}`);
      return url;
    }
    
    // Array of Cloudinary objects
    if (firstImage && firstImage.public_id) {
      const url = `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload/w_150,h_150/${firstImage.public_id}`;
      console.log(`🖼️ Using Cloudinary URL: ${url}`);
      return url;
    }
  }
  
  // Case 2: Single image object
  if (images && typeof images === 'object' && !Array.isArray(images)) {
    // Direct url property
    if (images.url) {
      const url = formatImageUrl(images.url);
      console.log(`🖼️ Using object URL: ${url}`);
      return url;
    }
    
    // Thumbnail
    if (images.thumbnail && images.thumbnail.url) {
      const url = formatImageUrl(images.thumbnail.url);
      console.log(`🖼️ Using thumbnail URL: ${url}`);
      return url;
    }
    
    // Main image
    if (images.main && images.main.url) {
      const url = formatImageUrl(images.main.url);
      console.log(`🖼️ Using main image URL: ${url}`);
      return url;
    }
    
    // Gallery array inside object
    if (images.gallery && Array.isArray(images.gallery) && images.gallery.length > 0) {
      console.log(`🖼️ Using gallery from object`);
      return extractImageUrl(images.gallery, `${type} Gallery`);
    }
  }
  
  // Case 3: Direct string URL
  if (typeof images === 'string' && images.trim() !== '') {
    const url = formatImageUrl(images);
    console.log(`🖼️ Using direct string URL: ${url}`);
    return url;
  }
  
  // ✅ NEW: Check for variant structure that might have thumbnail
  if (type === 'Variant' && images.thumbnail) {
    console.log(`🖼️ Checking variant thumbnail`);
    return extractImageUrl(images.thumbnail, `${type} Thumbnail`);
  }
  
  console.log(`🖼️ No ${type} image found, using placeholder`);
  return '/images/placeholder-image.jpg';
};
  
// In CartItem.tsx - Update getItemImage() function
const getItemImage = (): string => {
  console.log('🖼️ CartItem debug - item:', item);
  console.log('🖼️ Variant data:', item.variant);
  console.log('🖼️ Product data:', item.product);
  
  const isPreBuiltPC = item.productType === 'prebuilt-pc' || !!item.preBuiltPC || !!item.pcId;
  
  if (isPreBuiltPC) {
    const preBuiltPC = item.preBuiltPC || {};
    const pcImages = preBuiltPC.images || item.images || [];
    return extractImageUrl(pcImages, 'Pre-built PC');
  } else {
    // ✅ ENHANCED: Check multiple image sources in priority order
    
    // 1. First, check variant images
    if (item.variant && item.variant.images) {
      console.log('🖼️ Checking variant images:', item.variant.images);
      const variantImage = extractImageUrl(item.variant.images, 'Variant');
      if (variantImage !== '/images/placeholder-image.jpg') {
        return variantImage;
      }
    }
    
    // 2. Check if variant has images in a different structure
    if (item.variant && !item.variant.images) {
      console.log('🖼️ Variant exists but no images property, checking other properties');
      // Sometimes images might be directly on variant object
      if (item.variant.thumbnail) {
        return extractImageUrl(item.variant.thumbnail, 'Variant Thumbnail');
      }
      if (item.variant.image) {
        return extractImageUrl(item.variant.image, 'Variant Image');
      }
    }
    
    // 3. Check product images
    const product = item.product || {};
    const productImages = product.images || item.images || [];
    console.log('🖼️ Checking product images:', productImages);
    
    const productImage = extractImageUrl(productImages, 'Product');
    if (productImage !== '/images/placeholder-image.jpg') {
      return productImage;
    }
    
    // 4. Last resort: Check if there are any images directly on the item
    if (item.images) {
      console.log('🖼️ Checking item.images:', item.images);
      return extractImageUrl(item.images, 'Item');
    }
    
    // 5. If nothing found, use placeholder
    return '/images/placeholder-image.jpg';
  }
};



  const formatImageUrl = (url: string): string => {
    if (!url || url === 'undefined' || url === 'null') {
      return '/images/placeholder-image.jpg';
    }
    
    // Already full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Data URL
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Relative path starting with /
    if (url.startsWith('/')) {
      const baseURL_fetched = process.env.NODE_ENV === 'production' 
        ? 'https://itech-compters.onrender.com' 
        : baseURL;
      return `${baseURL_fetched}${url}`;
    }
    
    // Relative path without /
    return `/${url}`;
  };

  // FIXED: Get item name with better handling
  const getItemName = (): string => {
    if (isPreBuiltPC) {
      // Handle both string ID and populated object cases
      if (typeof preBuiltPC === 'string') {
        return item.name || 'Pre-built PC';
      } else {
        return preBuiltPC.name || item.name || 'Pre-built PC';
      }
    }
    
    // For products with variants, show variant name if available
    if (item.variant && item.variant.name && item.variant.name !== 'Default') {
      return `${product.name || item.name || 'Product'} - ${item.variant.name}`;
    }
    
    // Show base product name
    return product.name || item.name || 'Product';
  };

  // Safe item ID extraction
  const getItemId = (): string => {
    if (isPreBuiltPC) {
      // Handle both string ID and populated object cases
      if (typeof preBuiltPC === 'string') {
        return preBuiltPC || item.pcId || item._id || 'unknown-pc-id';
      } else {
        return preBuiltPC._id || item.pcId || item._id || 'unknown-pc-id';
      }
    } else {
      return product._id || item.productId || item._id || 'unknown-product-id';
    }
  };

  // Safe variant ID extraction
  const getVariantId = (): string | undefined => {
    if (isPreBuiltPC) return undefined;
    
    if (item.variant) {
      return item.variant.variantId || item.variant._id || item.variant.id;
    }
    return item.variantId;
  };

  // Safe item link generation
  const getItemLink = (): string => {
    const itemId = getItemId();
    
    if (isPreBuiltPC) {
      // Handle both string ID and populated object cases
      let pcSlug;
      if (typeof preBuiltPC === 'string') {
        pcSlug = itemId; // Use the ID as slug
      } else {
        pcSlug = preBuiltPC.slug || preBuiltPC._id || itemId;
      }
      return `/prebuilt-pcs/${pcSlug}`;
    } else {
      const baseLink = `/product/${product.slug || product._id || itemId}`;
      const variantId = getVariantId();
      if (variantId) {
        return `${baseLink}?variant=${variantId}`;
      }
      return baseLink;
    }
  };

  // Safe price extraction
  const getItemPrice = (): number => {
    // Use variant price if available
    if (item.variant && item.variant.price) {
      return item.variant.price;
    }
    
    // Use item price
    if (item.price && item.price > 0) {
      return item.price;
    }
    
    if (isPreBuiltPC) {
      // Handle both string ID and populated object cases
      if (typeof preBuiltPC === 'string') {
        return item.price || 0;
      } else {
        return preBuiltPC.discountPrice || preBuiltPC.totalPrice || preBuiltPC.offerPrice || preBuiltPC.basePrice || 0;
      }
    }
    
    return product.offerPrice || product.basePrice || 0;
  };

  // Safe quantity update
  const handleUpdateQuantity = (newQuantity: number) => {
    const itemId = getItemId();    
    if (isPreBuiltPC && onUpdatePreBuiltPCQuantity) {
      onUpdatePreBuiltPCQuantity(itemId, newQuantity);
    } else {
      const variantId = getVariantId();
      onUpdateQuantity(itemId, variantId, newQuantity);
    }
  };

  // Safe remove function
  const handleRemove = () => {
    const itemId = getItemId();
    const variantId = getVariantId();
    
    if (isPreBuiltPC && onRemovePreBuiltPC) {
      onRemovePreBuiltPC(itemId);
    } else {
      onRemove(itemId, variantId);
    }
  };

  const itemImage = getItemImage();
  const itemName = getItemName();
  const itemPrice = getItemPrice();
  const itemId = getItemId();
  const itemLink = getItemLink();
  const variantId = getVariantId();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;    
    // Use a reliable placeholder that doesn't require internet
    target.src = '/images/placeholder-image.jpg';
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
            {/* Handle both string ID and populated object cases */}
            {(typeof preBuiltPC !== 'string' && (preBuiltPC.specifications?.processor || preBuiltPC.processor)) && (
              <div>CPU: {preBuiltPC.specifications?.processor || preBuiltPC.processor}</div>
            )}
            {(typeof preBuiltPC !== 'string' && (preBuiltPC.specifications?.graphicsCard || preBuiltPC.graphicsCard)) && (
              <div>GPU: {preBuiltPC.specifications?.graphicsCard || preBuiltPC.graphicsCard}</div>
            )}
          </div>
        )}
        
        {/* Enhanced variant information for products */}
        {!isPreBuiltPC && item.variant && (
          <div className="text-sm text-gray-600 mt-1">
            {item.variant.color && <span>Color: {item.variant.color}</span>}
            {item.variant.size && <span className="ml-2">Size: {item.variant.size}</span>}
            {item.variant.ram && <span className="ml-2">RAM: {item.variant.ram}</span>}
            {item.variant.storage && <span className="ml-2">Storage: {item.variant.storage}</span>}
            {/* Show variant attributes if available */}
            {item.variant.attributes && Object.keys(item.variant.attributes).length > 0 && (
              <div className="mt-1">
                {Object.entries(item.variant.attributes).map(([key, value]) => (
                  <span key={key} className="mr-2">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        
        <p className="text-gray-600 text-xl font-bold mt-1">Rs {itemPrice.toFixed(2)}</p>
        
        {/* Debug info - shows if preBuiltPC is string or object */}
        <div className="text-xs text-gray-400 mt-1">
          Type: {isPreBuiltPC ? 'Pre-built PC' : 'Product'} | 
          PC Type: {isPreBuiltPC ? (typeof preBuiltPC === 'string' ? 'String ID' : 'Populated Object') : 'N/A'} |
          ID: {itemId} | 
          Qty: {item.quantity}
          {variantId && ` | Variant: ${variantId}`}
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
          Rs {(itemPrice * item.quantity).toFixed(2)}
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