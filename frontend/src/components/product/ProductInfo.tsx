// src/components/product/ProductInfo.tsx
import React from 'react';
import { ProductData, Variant } from './productTypes';
import VariantSelectors from './VariantSelectors';

interface ProductInfoProps {
  productData: ProductData;
  selectedVariant: Variant | null;
  selectedAttributes: Record<string, string>;
  onAttributeChange: (key: string, value: string) => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  productData,
  selectedVariant,
  selectedAttributes,
  onAttributeChange
}) => {
  // Get current price and stock info
  const getCurrentPriceInfo = () => {
    if (selectedVariant) {
      return {
        price: selectedVariant.price,
        offerPrice: selectedVariant.offerPrice,
        stockQuantity: selectedVariant.stockQuantity
      };
    }
    
    return {
      price: productData.basePrice || 0,
      offerPrice: productData.offerPrice || 0,
      stockQuantity: productData.stockQuantity || 0
    };
  };

  const currentPriceInfo = getCurrentPriceInfo();

  // Calculate tax
  const calculateTax = (price: number) => {
    const taxRate = productData.taxRate || 0;
    return (price * taxRate) / 100;
  };

  return (
    <div className="space-y-6">
      {/* Product Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{productData.name}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {productData.brand && (
            <>
              <span>Brand: {productData.brand.name}</span>
              <span>•</span>
            </>
          )}
          <span>Condition: {productData.condition}</span>
          {productData.label && (
            <>
              <span>•</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                {productData.label}
              </span>
            </>
          )}
          <span>•</span>
          <span>SKU: {selectedVariant?.sku || productData.sku}</span>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-2">
        <div className="flex text-yellow-400">
          {'★'.repeat(Math.floor(productData.averageRating || 0)).padEnd(5, '☆')}
        </div>
        <span className="text-sm text-gray-600">
          {productData.totalReviews === 0 
            ? 'No reviews yet' 
            : `${productData.averageRating || 0} out of 5 (${productData.totalReviews} reviews)`
          }
        </span>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-gray-900">
            ${currentPriceInfo.offerPrice || currentPriceInfo.price}
          </span>
          {currentPriceInfo.offerPrice < currentPriceInfo.price && (
            <>
              <span className="text-xl text-gray-500 line-through">
                ${currentPriceInfo.price}
              </span>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                Save ${(currentPriceInfo.price - currentPriceInfo.offerPrice).toFixed(2)}
              </span>
            </>
          )}
        </div>
        {productData.discountPercentage > 0 && (
          <div className="text-sm text-green-600 font-medium">
            {productData.discountPercentage}% OFF
          </div>
        )}
        <div className="text-sm text-gray-600">
          Inclusive of all taxes
          {productData.taxRate && productData.taxRate > 0 && (
            <span> (incl. ${calculateTax(currentPriceInfo.offerPrice || currentPriceInfo.price).toFixed(2)} tax)</span>
          )}
        </div>
      </div>

      {/* 🚀 DYNAMIC VARIANT SELECTORS - ALL IN ONE PLACE */}
      <VariantSelectors
        productData={productData}
        selectedAttributes={selectedAttributes}
        selectedVariant={selectedVariant}
        onAttributeChange={onAttributeChange}
      />

      {/* Stock Status */}
      <div className="flex items-center space-x-2">
        {currentPriceInfo.stockQuantity > 0 ? (
          <>
            <span className="text-green-600 text-sm font-medium">In Stock</span>
            <span className="text-gray-500 text-sm">
              ({currentPriceInfo.stockQuantity} available)
            </span>
          </>
        ) : (
          <span className="text-red-600 text-sm font-medium">Out of Stock</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            currentPriceInfo.stockQuantity === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
          }`}
          disabled={currentPriceInfo.stockQuantity === 0}
        >
          {currentPriceInfo.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            currentPriceInfo.stockQuantity === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
          disabled={currentPriceInfo.stockQuantity === 0}
        >
          Buy Now
        </button>
      </div>

      {/* Delivery Info */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Delivery</span>
            <span className="font-medium">2-4 business days</span>
          </div>
          <div className="flex justify-between">
            <span>Returns</span>
            <span className="font-medium">30 days return policy</span>
          </div>
          <div className="flex justify-between">
            <span>Warranty</span>
            <span className="font-medium">{productData.warranty || '1 year manufacturer warranty'}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {productData.description && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{productData.description}</p>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;