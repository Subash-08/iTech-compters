import React from 'react';
import { ProductData, Variant } from './productTypes';
import VariantSelectors from './VariantSelectors';
import AddToCartButton from './AddToCartButton';

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
  // 🆕 UPDATED: Get current price and stock info using virtual fields
  const getCurrentPriceInfo = () => {
    if (selectedVariant) {
      return {
        // 🆕 Use variant MRP if available, otherwise use variant price as fallback
        price: selectedVariant.mrp || selectedVariant.price,
        sellingPrice: selectedVariant.price, // 🆕 What customer actually pays
        stockQuantity: selectedVariant.stockQuantity,
        hasDiscount: selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price
      };
    }
    
    // 🆕 Use virtual fields for base product
    return {
      price: productData.displayMrp || productData.basePrice || 0,
      sellingPrice: productData.sellingPrice || productData.basePrice || 0,
      stockQuantity: productData.stockQuantity || 0,
      hasDiscount: productData.calculDiscount && productData.calculatedDiscount > 0
    };
  };

  const currentPriceInfo = getCurrentPriceInfo();

  // 🆕 Calculate tax based on selling price
  const calculateTax = (price: number) => {
    const taxRate = productData.taxRate || 0;
    return (price * taxRate) / 100;
  };

  // Check if we have a valid variant selection
  const hasValidVariantSelection = () => {
    if (!productData.variantConfiguration?.hasVariants) {
      return true; // No variants required
    }
    
    if (productData.variants.length === 0) {
      return true; // No variants available
    }
    
    return selectedVariant !== null; // Variant is selected
  };

  // Get the variant ID for cart
  const getVariantId = () => {
    return selectedVariant?._id;
  };

  // Check if product can be added to cart
  const canAddToCart = currentPriceInfo.stockQuantity > 0 && hasValidVariantSelection();

  const getVariantData = () => {
    if (!selectedVariant) return null;

    return {
      variantId: selectedVariant._id, // Use _id as variantId
      name: selectedVariant.name,
      price: selectedVariant.price,
      mrp: selectedVariant.mrp,
      stock: selectedVariant.stockQuantity,
      attributes: selectedVariant.identifyingAttributes,
      sku: selectedVariant.sku
    };
  };

  // Get display name - show variant name if selected, otherwise product name
  const getDisplayName = () => {
    if (selectedVariant?.name) {
      return selectedVariant.name;
    }
    return productData.name;
  };

  // Get display SKU - show variant SKU if selected, otherwise product SKU
  const getDisplaySku = () => {
    if (selectedVariant?.sku) {
      return selectedVariant.sku;
    }
    return productData.sku;
  };

  // 🆕 Get discount percentage
  const getDiscountPercentage = () => {
    if (selectedVariant && selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price) {
      return Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100);
    }
    return productData.calculatedDiscount || 0;
  };

  // 🆕 Show price range for products with variants
  const renderPriceRange = () => {
    if (productData.priceRange?.hasRange && !selectedVariant) {
      return (
        <div className="text-lg text-gray-900 font-semibold">
          ${productData.priceRange.min.toFixed(2)} - ${productData.priceRange.max.toFixed(2)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Product Title - Shows variant name when selected */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getDisplayName()}
          {selectedVariant && selectedVariant.name !== productData.name && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              ({productData.name})
            </span>
          )}
        </h1>
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
          <span>SKU: {getDisplaySku()}</span>
          {productData.hsn && (
            <>
              <span>•</span>
              <span>HSN: {productData.hsn}</span>
            </>
          )}
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

      {/* 🆕 UPDATED: Price Display with New Virtual Fields */}
      <div className="space-y-2">
        {/* Price Range for Variants */}
        {renderPriceRange()}
        
        {/* Single Price Display */}
        {(!productData.priceRange?.hasRange || selectedVariant) && (
          <div className="flex items-center space-x-3">
            {/* 🆕 Show selling price (what customer pays) */}
            <span className="text-3xl font-bold text-gray-900">
              ${currentPriceInfo.sellingPrice.toFixed(2)}
            </span>
            
            {/* 🆕 Show MRP with strikethrough if there's a discount */}
            {currentPriceInfo.hasDiscount && currentPriceInfo.price > currentPriceInfo.sellingPrice && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ${currentPriceInfo.price.toFixed(2)}
                </span>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                  Save ${(currentPriceInfo.price - currentPriceInfo.sellingPrice).toFixed(2)}
                </span>
              </>
            )}
          </div>
        )}
        
        {/* 🆕 Discount Percentage */}
        {getDiscountPercentage() > 0 && (
          <div className="text-sm text-green-600 font-medium">
            {getDiscountPercentage()}% OFF
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          Inclusive of all taxes
          {productData.taxRate && productData.taxRate > 0 && (
            <span> (incl. ${calculateTax(currentPriceInfo.sellingPrice).toFixed(2)} tax)</span>
          )}
        </div>
      </div>

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
        
        {/* 🆕 Show total variants stock if product has variants */}
        {productData.hasActiveVariants && productData.totalStock && (
          <span className="text-blue-600 text-sm">
            • {productData.totalStock} total across all variants
          </span>
        )}
      </div>

      {/* Variant Selection Warning */}
      {productData.variantConfiguration?.hasVariants && !selectedVariant && productData.variants.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            ⚠️ Please select a variant before adding to cart
          </p>
        </div>
      )}

      <div className="flex space-x-4">
        {/* Add to Cart Button - FIXED: Pass variant data instead of variantId */}
        <AddToCartButton
          productId={productData._id}
          variant={getVariantData()} // ✅ CHANGED: Pass full variant object
          quantity={1}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            !canAddToCart
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
          }`}
          disabled={!canAddToCart}
        >
          Add to Cart
        </AddToCartButton>
        
        {/* Buy Now Button */}
        <button
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            !canAddToCart
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
          disabled={!canAddToCart}
        >
          Buy Now
        </button>
      </div>

      {/* Selected Variant Info */}
      {selectedVariant && selectedVariant.identifyingAttributes && selectedVariant.identifyingAttributes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            ✅ Selected: 
            {selectedVariant.identifyingAttributes.map(attr => (
              <span key={attr.key} className="ml-2">
                {attr.label}: {attr.displayValue || attr.value}
                {attr.hexCode && (
                  <div 
                    className="inline-block w-3 h-3 rounded-full border border-gray-300 ml-1 align-middle"
                    style={{ backgroundColor: attr.hexCode }}
                  />
                )}
              </span>
            ))}
          </p>
        </div>
      )}

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

      {/* 🆕 HSN Code Display */}
      {productData.hsn && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tax Information</h3>
          <p className="text-gray-600 text-sm">
            HSN Code: <span className="font-medium">{productData.hsn}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;