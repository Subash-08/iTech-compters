import React from 'react';
import { ProductData, Variant } from './productTypes';
import VariantSelectors from './VariantSelectors';
import AddToCartButton from './AddToCartButton';
import AddToWishlistButton from './AddToWishlistButton';
import { motion } from 'framer-motion';

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
  // Get current price info
  const getCurrentPriceInfo = () => {
    if (selectedVariant) {
      return {
        mrp: selectedVariant.mrp || selectedVariant.price,
        offerPrice: selectedVariant.offerPrice || selectedVariant.price,
        price: selectedVariant.price,
        stockQuantity: selectedVariant.stockQuantity,
        hasDiscount: selectedVariant.mrp && selectedVariant.mrp > (selectedVariant.offerPrice || selectedVariant.price)
      };
    }
    
    // ✅ FIX: Logic updated to match ProductCard (check sellingPrice/effectivePrice)
    // If basePrice is 0, it now checks sellingPrice or effectivePrice
    const activePrice = productData.offerPrice || productData.effectivePrice || (productData as any).sellingPrice || productData.basePrice || 0;
    const activeMrp = productData.mrp || activePrice;

    return {
      mrp: activeMrp,
      offerPrice: activePrice,
      price: activePrice,
      stockQuantity: productData.stockQuantity || 0,
      hasDiscount: activeMrp > activePrice
    };
  };

  const currentPriceInfo = getCurrentPriceInfo();

  // Calculate savings
  const calculateSavings = () => {
    const mrp = currentPriceInfo.mrp;
    const offerPrice = currentPriceInfo.offerPrice;
    if (mrp <= 0 || offerPrice >= mrp) return 0;
    return Math.round(((mrp - offerPrice) / mrp) * 100);
  };

  const savings = calculateSavings();
  const canAddToCart = currentPriceInfo.stockQuantity > 0;

  // Get variant ID for cart
  const getVariantId = () => {
    return selectedVariant?._id;
  };

  // Get display name
  const getDisplayName = () => {
    if (selectedVariant?.name) {
      return selectedVariant.name;
    }
    return productData.name;
  };

  // Get variant data for cart
  const getVariantData = () => {
    if (!selectedVariant) return null;

    return {
      variantId: selectedVariant._id,
      name: selectedVariant.name,
      price: selectedVariant.price,
      mrp: selectedVariant.mrp,
      stock: selectedVariant.stockQuantity,
      attributes: selectedVariant.identifyingAttributes,
      sku: selectedVariant.sku
    };
  };

  // ✅ FIX: Create Normalized Data for Wishlist
  // This ensures the wishlist gets the price we just calculated, not 0
  const wishlistProductData = {
    ...productData,
    price: currentPriceInfo.offerPrice, 
    effectivePrice: currentPriceInfo.offerPrice,
    mrp: currentPriceInfo.mrp,
    images: selectedVariant?.images || productData.images 
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Product Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
          {getDisplayName()}
        </h1>
        
        {/* Brand and Rating */}
        <div className="flex items-center space-x-4 mb-2">
          <span className="text-sm text-gray-600">
            Brand: <span className="font-medium text-gray-900">{productData.brand?.name || 'HP'}</span>
          </span>
          <span className="text-gray-300">•</span>
          
          {/* Rating */}
          <div className="flex items-center">
            <div className="flex items-center mr-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(productData.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <a 
              href="#reviews" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
            >
              {productData.totalReviews > 0 
                ? `${productData.totalReviews} rating${productData.totalReviews !== 1 ? 's' : ''}`
                : 'No ratings yet'}
            </a>
          </div>
        </div>
      </div>

      {/* Price Block - Amazon Style */}
      <div className="space-y-3">
        {/* Offer Price */}
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            ₹{currentPriceInfo.offerPrice.toLocaleString('en-IN')}
          </span>
          
          {/* MRP with Strikethrough */}
          {currentPriceInfo.hasDiscount && (
            <>
              <span className="ml-3 text-lg text-gray-500 line-through">
                ₹{currentPriceInfo.mrp.toLocaleString('en-IN')}
              </span>
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded">
                Save {savings}%
              </span>
            </>
          )}
        </div>
        
        {/* Savings Message */}
        {savings > 0 && (
          <p className="text-green-600 text-sm font-medium">
            You save ₹{(currentPriceInfo.mrp - currentPriceInfo.offerPrice).toLocaleString('en-IN')} ({savings}% off)
          </p>
        )}
        
        {/* Tax Info */}
        <div className="text-gray-500 text-sm">
          Inclusive of all taxes
          {productData.taxRate ? ` • GST: ${productData.taxRate}%` : ''}
        </div>
        
      </div>

      {/* Variant Selection */}
      <VariantSelectors
        productData={productData}
        selectedAttributes={selectedAttributes}
        selectedVariant={selectedVariant}
        onAttributeChange={onAttributeChange}
      />

      {/* Stock & Delivery Info */}
      <div className="space-y-4">

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Add to Cart Button - Full width on mobile, 2/3 on desktop */}
          <AddToCartButton
            productId={productData._id}
            product={wishlistProductData}
            variant={getVariantData()}
            className={`flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              !canAddToCart ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            quantity={1}
            disabled={!canAddToCart}
            showIcon={true}
          >
            {/* Custom button content */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 w-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </motion.div>
          </AddToCartButton>
          
<motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="sm:w-1/3 py-3.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            // 👇 FIX: This makes the whole div clickable
            onClick={(e) => {
              // If the click is NOT on the button itself (e.g. text or whitespace), find the button and click it
              if (!(e.target as HTMLElement).closest('button')) {
                e.currentTarget.querySelector('button')?.click();
              }
            }}
          >
            <AddToWishlistButton
              productId={productData._id}
              product={wishlistProductData}
              variant={getVariantData()}
              productType="product"
              className="!w-5 !h-5"
              size="sm"
              showTooltip={false}
            />
            <span>Wishlist</span>
          </motion.div>
        </div>
      </div>
        {/* Warranty Info */}
        { productData.warranty &&  <div className="flex items-center text-sm text-gray-600">
       <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>{productData.warranty}</span>
        </div>}
      </div>

      {/* Quick Specifications */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Quick Specifications
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Model</p>
            <p className="font-medium text-gray-900">{productData.name}</p>
          </div>
          {selectedVariant?.identifyingAttributes?.[0] && (
            <div>
              <p className="text-sm text-gray-600">
                {selectedVariant.identifyingAttributes[0].label || 'RAM'}
              </p>
              <p className="font-medium text-gray-900">
                {selectedVariant.identifyingAttributes[0].displayValue || selectedVariant.identifyingAttributes[0].value}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {productData.description && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            About This Item
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">{productData.description}</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProductInfo;