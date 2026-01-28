// components/wishlist/WishlistItem.tsx - MINIMALIST REDESIGN
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WishlistItem as WishlistItemType } from '../../redux/types/wishlistTypes';
import { useAppDispatch } from '../../redux/hooks';
import { wishlistActions } from '../../redux/actions/wishlistActions';
import { cartActions } from '../../redux/actions/cartActions';
import { baseURL } from '../config/config';
import { Trash2, ShoppingCart, Tag, Cpu, Zap, Eye, Clock, CheckCircle } from 'lucide-react';

interface WishlistItemProps {
  item: WishlistItemType;
  onRemove: (itemId: string, productType: 'product' | 'prebuilt-pc') => void;
}

// Helper function to get full image URL
const getFullImageUrl = (url: string): string => {
  if (!url || url.trim() === '') {
    return 'https://images.unsplash.com/photo-1556656793-08538906a9f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
  }
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  const LOCAL_API_URL = process.env.REACT_APP_API_URL || baseURL;
  const cleanBaseUrl = LOCAL_API_URL.endsWith('/') ? LOCAL_API_URL.slice(0, -1) : LOCAL_API_URL;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBaseUrl}${cleanUrl}`;
};

// Helper to extract image from product
const extractImageUrl = (item: WishlistItemType): string => {
  const product = item.product as any;
  
  if (item.productType === 'prebuilt-pc') {
    if (product.images) {
      if (Array.isArray(product.images)) {
        if (product.images.length > 0) {
          return product.images[0]?.url || product.images[0]?.imageUrl || '';
        }
      }
      else if (typeof product.images === 'object') {
        const keys = Object.keys(product.images);
        if (keys.length > 0) {
          const firstImage = product.images[keys[0]];
          return firstImage?.url || firstImage?.imageUrl || '';
        }
      }
    }
    
    if (item.preBuiltPC && typeof item.preBuiltPC === 'object') {
      const pcData = item.preBuiltPC as any;
      if (pcData.images) {
        if (Array.isArray(pcData.images) && pcData.images.length > 0) {
          return pcData.images[0]?.url || '';
        }
      }
    }
  }
  
  if (product.images?.thumbnail?.url) {
    return product.images.thumbnail.url;
  }
  
  if (product.primaryImage?.url) {
    return product.primaryImage.url;
  }
  
  if (product.images?.gallery && Array.isArray(product.images.gallery) && product.images.gallery.length > 0) {
    return product.images.gallery[0]?.url || '';
  }
  
  if (product.image) {
    return product.image;
  }
  
  if (item.variant?.images?.thumbnail?.url) {
    return item.variant.images.thumbnail.url;
  }
  
  return '';
};

const WishlistItem: React.FC<WishlistItemProps> = ({ item, onRemove }) => {
  const dispatch = useAppDispatch();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isMovingToCart, setIsMovingToCart] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(item._id, item.productType || 'product');
      setIsRemoving(false);
    }, 300);
  };

const handleMoveToCart = async () => {
    if (!stockStatus.isInStock) return;
    
    setIsMovingToCart(true);
    try {
      await dispatch(wishlistActions.removeFromWishlist({ 
        itemId: item._id
      }));
      
      if (item.productType === 'prebuilt-pc') {
        await dispatch(cartActions.addPreBuiltPCToCart({ 
          pcId: (item.product as any)._id, 
          quantity: 1,
          product: item.product
        }));
      } else {
        await dispatch(cartActions.addToCart({ 
          productId: (item.product as any)._id,
          // 👇 ADD THIS LINE
          product: item.product as any, 
          variantData: item.variant ? {
            variantId: item.variant.variantId,
            name: item.variant.name,
            price: item.variant.price,
            mrp: item.variant.mrp,
            stock: item.variant.stock,
            attributes: item.variant.attributes,
            sku: item.variant.sku,
            // You might also want to ensure images are passed here if your variant type requires it
             images: item.variant.images 
          } : undefined,
          quantity: 1 
        }));
      }
    } catch (error) {
      console.error('Failed to move to cart:', error);
    } finally {
      setTimeout(() => setIsMovingToCart(false), 500);
    }
  };

  const getDisplayData = () => {
    let price = 0;
    let mrp = 0;
    let name = item.product?.name || 'Product';
    let imageUrl = extractImageUrl(item);
    
    if (item.productType === 'prebuilt-pc') {
      const pc = item.product as any;
      
      if (item.preBuiltPC && typeof item.preBuiltPC === 'object') {
        const pcData = item.preBuiltPC as any;
        price = pcData.discountPrice || pcData.totalPrice || 0;
        mrp = pcData.totalPrice || price;
        name = pcData.name || 'Pre-built PC';
      } else {
        price = pc.offerPrice || pc.totalPrice || pc.basePrice || 0;
        mrp = pc.basePrice || pc.totalPrice || price;
        name = pc.name || 'Pre-built PC';
      }
    }
    else if (item.variant && item.variant.price !== undefined) {
      price = item.variant.price || 0;
      mrp = item.variant.mrp || price;
      if (item.variant.name) {
        name = `${item.product?.name || ''} - ${item.variant.name}`;
      }
    } 
    else {
      const product = item.product as any;
      
      const possiblePriceFields = [
        product.effectivePrice,
        product.sellingPrice,
        product.displayPrice,
        product.basePrice,
        product.price,
        product.lowestPrice,
        product.offerPrice
      ];
      
      const possibleMrpFields = [
        product.mrp,
        product.displayMrp,
        product.basePrice,
        product.totalPrice
      ];
      
      for (const field of possiblePriceFields) {
        if (field !== undefined && field !== null && !isNaN(field) && field > 0) {
          price = Number(field);
          break;
        }
      }
      
      for (const field of possibleMrpFields) {
        if (field !== undefined && field !== null && !isNaN(field) && field > 0) {
          mrp = Number(field);
          break;
        }
      }
      
      if (mrp === 0 && price > 0) {
        mrp = price;
      }
    }

    const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const fullImageUrl = getFullImageUrl(imageUrl);
    
    return { 
      price, 
      mrp, 
      discountPercentage, 
      name, 
      image: fullImageUrl 
    };
  };

  const { price, mrp, discountPercentage, name, image } = getDisplayData();
  const hasDiscount = discountPercentage > 0;
  const productSlug = item.productType === 'prebuilt-pc' 
    ? `/prebuilt-pcs/${item.product?.slug}`
    : `/product/${item.product?.slug}`;

  const formatPrice = (amount: number) => {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = () => {
    let stock = 0;
    
    if (item.variant?.stock !== undefined) {
      stock = item.variant.stock;
    } else if (item.product?.stockQuantity !== undefined) {
      stock = item.product.stockQuantity;
    } else if ((item.product as any)?.stock !== undefined) {
      stock = (item.product as any).stock;
    } else if ((item.product as any)?.totalStock !== undefined) {
      stock = (item.product as any).totalStock;
    }
    
    const isInStock = stock > 0;
    
    return {
      isInStock,
      stock,
      stockText: isInStock ? 'In Stock' : 'Out of Stock',
      stockColor: isInStock ? 'text-green-700' : 'text-red-600',
      dotColor: isInStock ? 'bg-green-500' : 'bg-red-500'
    };
  };

  const stockStatus = getStockStatus();
  const savings = mrp - price;

  // Get category name
  const getCategory = () => {
    if (item.productType === 'prebuilt-pc') return 'Computers';
    
    const product = item.product as any;
    if (product.category?.name) return product.category.name;
    if (product.categoryName) return product.categoryName;
    if (item.product?.category) return item.product.category;
    return 'Products';
  };

  // Get product ID
  const getProductId = () => {
    const product = item.product as any;
    return product?.productId || product?.sku || item._id?.slice(-8) || 'N/A';
  };

  return (
    <div className={`group bg-white rounded border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300 ${
      isRemoving ? 'opacity-0 scale-95' : 'opacity-100'
    }`}>
      {/* Product Layout */}
      <div className="flex flex-col sm:flex-row">
        {/* Image Container */}
        <div className="sm:w-48 sm:h-48 bg-gray-50 relative overflow-hidden">
          <Link to={productSlug} className="block w-full h-full">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { 
                e.currentTarget.src = 'https://www.shutterstock.com/image-illustration/product-image-default-thumbnail-icon-600nw-2377730867.jpg';
              }}
            />
          </Link>
          
          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-50 transition-colors duration-200 border border-gray-300"
            title="Remove from wishlist"
          >
            <Trash2 className={`w-3.5 h-3.5 text-gray-600 transition-all duration-300 ${
              isRemoving ? 'scale-0 rotate-180' : 'scale-100 rotate-0'
            }`} />
            {isRemoving && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
          
          {/* Product Type Badge */}
          <div className="absolute bottom-3 left-3">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              item.productType === 'prebuilt-pc'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.productType === 'prebuilt-pc' ? (
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  PC
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Product
                </span>
              )}
            </div>
          </div>
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <Tag className="w-3 h-3" />
              -{discountPercentage}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-col h-full">
            {/* Product Info */}
            <div className="mb-4">
              <Link to={productSlug} className="block">
                <h3 className="text-lg font-normal text-gray-900 hover:text-gray-700 transition-colors duration-200 leading-tight">
                  {name}
                </h3>
              </Link>
              
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Item ID: <span className="font-medium">{getProductId()}</span>
                </p>
                <p className="text-sm text-gray-600">
                  {getCategory()}
                </p>
              </div>
              
              {/* Variant Attributes */}
              {item.variant?.attributes && item.variant.attributes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.variant.attributes.map((attr, index) => (
                    <span 
                      key={index}
                      className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded"
                    >
                      {attr.label}: {attr.displayValue || attr.value}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & Stock */}
            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xl font-medium text-gray-900">
                  {formatPrice(price)}
                </span>
                {hasDiscount && mrp > price && (
                  <>
                    <span className="text-base text-gray-500 line-through">
                      {formatPrice(mrp)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Save {formatPrice(savings)}
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className={`flex items-center gap-2 mb-4 text-sm ${
                stockStatus.isInStock ? 'text-green-700' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${stockStatus.dotColor}`}></div>
                <span className="font-medium">
                  {stockStatus.stockText}
                  {stockStatus.isInStock && stockStatus.stock > 0 && (
                    <span className="text-gray-600 font-normal ml-1">
                      ({stockStatus.stock} available)
                    </span>
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleMoveToCart}
                  disabled={!stockStatus.isInStock || isMovingToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded border transition-all duration-200 ${
                    stockStatus.isInStock 
                      ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900' 
                      : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  }`}
                >
                  {!isMovingToCart ? (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {stockStatus.isInStock ? 'Add to Cart' : 'Out of Stock'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Adding...</span>
                    </>
                  )}
                </button>
                
                <Link
                  to={productSlug}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View Details</span>
                </Link>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Added on {new Date(item.addedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;