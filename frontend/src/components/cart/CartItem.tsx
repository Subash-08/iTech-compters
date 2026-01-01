// components/cart/CartItem.tsx - PROFESSIONAL UI REDESIGN
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { baseURL } from '../config/config';
import { Trash2, Minus, Plus, Cpu, Zap, Eye } from 'lucide-react';

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
  const [isRemoving, setIsRemoving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isPreBuiltPC = item.productType === 'prebuilt-pc' || !!item.preBuiltPC || !!item.pcId;
  const product = item.product || {};
  const preBuiltPC = item.preBuiltPC || {};

  // Image extraction function
  const extractImageUrl = (images: any, type: string): string => {
    if (!images) {
      return '/images/placeholder-image.jpg';
    }
    
    // Handle object with numeric keys
    if (typeof images === 'object' && !Array.isArray(images)) {
      const keys = Object.keys(images);
      if (keys.length > 0 && /^\d+$/.test(keys[0])) {
        const firstKey = keys[0];
        const firstImage = images[firstKey];
        
        if (firstImage && firstImage.url) {
          return formatImageUrl(firstImage.url);
        }
        
        if (firstImage && firstImage.public_id) {
          return `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload/w_300,h_300/${firstImage.public_id}`;
        }
        
        if (typeof firstImage === 'string') {
          return formatImageUrl(firstImage);
        }
      }
      
      if (images.url) {
        return formatImageUrl(images.url);
      }
      
      if (images.thumbnail && images.thumbnail.url) {
        return formatImageUrl(images.thumbnail.url);
      }
      
      if (images.main && images.main.url) {
        return formatImageUrl(images.main.url);
      }
      
      if (images.gallery && Array.isArray(images.gallery) && images.gallery.length > 0) {
        return extractImageUrl(images.gallery, `${type} Gallery`);
      }
    }
    
    // Array of images
    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      
      if (firstImage && firstImage.url) {
        return formatImageUrl(firstImage.url);
      }
      
      if (typeof firstImage === 'string') {
        return formatImageUrl(firstImage);
      }
      
      if (firstImage && firstImage.public_id) {
        return `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload/w_300,h_300/${firstImage.public_id}`;
      }
    }
    
    // Direct string URL
    if (typeof images === 'string' && images.trim() !== '') {
      return formatImageUrl(images);
    }
    
    // Check variant thumbnail
    if (type === 'Variant' && images.thumbnail) {
      return extractImageUrl(images.thumbnail, `${type} Thumbnail`);
    }
    
    return '/images/placeholder-image.jpg';
  };

  const getItemImage = (): string => {
    const isPreBuiltPC = item.productType === 'prebuilt-pc' || !!item.preBuiltPC || !!item.pcId;
    
    if (isPreBuiltPC) {
      const preBuiltPC = item.preBuiltPC || {};
      const pcImages = preBuiltPC.images || item.images || [];
      return extractImageUrl(pcImages, 'Pre-built PC');
    } else {
      // Check variant images first
      if (item.variant && item.variant.images) {
        const variantImage = extractImageUrl(item.variant.images, 'Variant');
        if (variantImage !== '/images/placeholder-image.jpg') {
          return variantImage;
        }
      }
      
      // Check variant other properties
      if (item.variant && !item.variant.images) {
        if (item.variant.thumbnail) {
          return extractImageUrl(item.variant.thumbnail, 'Variant Thumbnail');
        }
        if (item.variant.image) {
          return extractImageUrl(item.variant.image, 'Variant Image');
        }
      }
      
      // Check product images
      const product = item.product || {};
      const productImages = product.images || item.images || [];
      const productImage = extractImageUrl(productImages, 'Product');
      if (productImage !== '/images/placeholder-image.jpg') {
        return productImage;
      }
      
      // Check item images
      if (item.images) {
        return extractImageUrl(item.images, 'Item');
      }
      
      return '/images/placeholder-image.jpg';
    }
  };

  const formatImageUrl = (url: string): string => {
    if (!url || url === 'undefined' || url === 'null') {
      return '/images/placeholder-image.jpg';
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('data:')) {
      return url;
    }
    
    if (url.startsWith('/')) {
      const baseURL_fetched = baseURL;
      return `${baseURL_fetched}${url}`;
    }
    
    return `/${url}`;
  };

  // Get item name
  const getItemName = (): string => {
    if (isPreBuiltPC) {
      if (typeof preBuiltPC === 'string') {
        return item.name || 'Pre-built PC';
      } else {
        return preBuiltPC.name || item.name || 'Pre-built PC';
      }
    }
    
    if (item.variant && item.variant.name && item.variant.name !== 'Default') {
      return `${product.name || item.name || 'Product'} - ${item.variant.name}`;
    }
    
    return product.name || item.name || 'Product';
  };

  // Get item ID
  const getItemId = (): string => {
    if (isPreBuiltPC) {
      if (typeof preBuiltPC === 'string') {
        return preBuiltPC || item.pcId || item._id || 'unknown-pc-id';
      } else {
        return preBuiltPC._id || item.pcId || item._id || 'unknown-pc-id';
      }
    } else {
      return product._id || item.productId || item._id || 'unknown-product-id';
    }
  };

  // Get variant ID
  const getVariantId = (): string | undefined => {
    if (isPreBuiltPC) return undefined;
    
    if (item.variant) {
      return item.variant.variantId || item.variant._id || item.variant.id;
    }
    return item.variantId;
  };

  // Get item link
  const getItemLink = (): string => {
    const itemId = getItemId();
    
    if (isPreBuiltPC) {
      let pcSlug;
      if (typeof preBuiltPC === 'string') {
        pcSlug = itemId;
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

  // Get item price
  const getItemPrice = (): number => {
    if (item.variant && item.variant.price) {
      return item.variant.price;
    }
    
    if (item.price && item.price > 0) {
      return item.price;
    }
    
    if (isPreBuiltPC) {
      if (typeof preBuiltPC === 'string') {
        return item.price || 0;
      } else {
        return preBuiltPC.discountPrice || preBuiltPC.totalPrice || preBuiltPC.offerPrice || preBuiltPC.basePrice || 0;
      }
    }
    
    return product.offerPrice || product.basePrice || 0;
  };

  // Get product SKU/ID
  const getProductSKU = (): string => {
    if (item.variant && item.variant.sku) {
      return item.variant.sku;
    }
    if (product.sku) {
      return product.sku;
    }
    return getItemId().slice(-8).toUpperCase();
  };

  // Get category
  const getCategory = (): string => {
    if (isPreBuiltPC) return 'Computers';
    
    if (product.category?.name) return product.category.name;
    if (product.categoryName) return product.categoryName;
    if (item.category) return item.category;
    return 'Products';
  };

  // Handle quantity update
  const handleUpdateQuantity = (newQuantity: number) => {
    const itemId = getItemId();    
    if (isPreBuiltPC && onUpdatePreBuiltPCQuantity) {
      onUpdatePreBuiltPCQuantity(itemId, newQuantity);
    } else {
      const variantId = getVariantId();
      onUpdateQuantity(itemId, variantId, newQuantity);
    }
  };

  // Handle remove
  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      const itemId = getItemId();
      const variantId = getVariantId();
      
      if (isPreBuiltPC && onRemovePreBuiltPC) {
        onRemovePreBuiltPC(itemId);
      } else {
        onRemove(itemId, variantId);
      }
      setIsRemoving(false);
    }, 300);
  };

  const itemImage = getItemImage();
  const itemName = getItemName();
  const itemPrice = getItemPrice();
  const itemLink = getItemLink();
  const productSKU = getProductSKU();
  const category = getCategory();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/images/placeholder-image.jpg';
  };

  return (
    <div 
      className={`group relative bg-white border border-slate-200 rounded-xl mb-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Image Container */}
          <div className="sm:w-48 sm:h-48 bg-white relative overflow-hidden rounded-lg border border-slate-100">
            <Link to={itemLink} className="block w-full h-full">
              <img 
                src={itemImage} 
                alt={itemName}
                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                onError={handleImageError}
                loading="lazy"
              />
            </Link>
            
            {/* Product Type Badge */}
            <div className="absolute top-3 left-3">
              <div className={`px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm border ${
                isPreBuiltPC
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}>
                {isPreBuiltPC ? (
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    PC System
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Product
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-col h-full">
              {/* Product Info */}
              <div className="mb-4">
                <Link to={itemLink} className="block">
                  <h3 className="text-lg font-semibold text-slate-900 hover:text-indigo-600 transition-colors duration-200 leading-tight">
                    {itemName}
                  </h3>
                </Link>
                
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-500">
                    SKU: <span className="font-mono text-slate-700">{productSKU}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    Category: <span className="text-slate-700">{category}</span>
                  </p>
                </div>
                
                {/* Variant Info */}
                {!isPreBuiltPC && item.variant && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {item.variant.color && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          Color: {item.variant.color}
                        </span>
                      )}
                      {item.variant.size && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          Size: {item.variant.size}
                        </span>
                      )}
                      {item.variant.ram && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          RAM: {item.variant.ram}
                        </span>
                      )}
                      {item.variant.storage && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          Storage: {item.variant.storage}
                        </span>
                      )}
                    </div>
                    
                    {/* Variant Attributes */}
                    {item.variant.attributes && Object.keys(item.variant.attributes).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(item.variant.attributes).map(([key, value]) => (
                          <span key={key} className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <div className="mt-auto pt-4 border-t border-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Pricing */}
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-slate-900">
                      ₹ {(itemPrice * item.quantity).toFixed(2)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-slate-400 font-medium">
                        ₹ {itemPrice.toFixed(2)} each
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                      <button 
                        onClick={() => handleUpdateQuantity(item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all duration-200 rounded-l-lg active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-bold text-slate-900 text-sm min-w-[2rem] text-center select-none">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.quantity + 1)}
                        disabled={item.quantity >= 100}
                        className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all duration-200 rounded-r-lg active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* View Details */}
                    <Link
                      to={itemLink}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 text-sm shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </Link>

                    {/* Remove Button */}
                    <button 
                      onClick={handleRemove}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all duration-200 text-sm shadow-sm ${
                        isHovered
                          ? 'border-rose-200 text-rose-600 bg-rose-50'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>

                {/* Additional Info (Hidden on mobile) */}
                <div className="hidden sm:flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-400 font-medium">
                    <span className="text-slate-500">Type:</span> {isPreBuiltPC ? 'Pre-built PC' : 'Product'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Added: {new Date(item.addedAt || Date.now()).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;