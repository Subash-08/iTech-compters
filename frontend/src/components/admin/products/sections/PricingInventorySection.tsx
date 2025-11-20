import React, { useEffect } from 'react';
import { ProductFormData } from '../../types/product';

interface PricingInventorySectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditing?: boolean;
}

const PricingInventorySection: React.FC<PricingInventorySectionProps> = ({
  formData,
  updateFormData,
  isEditing = false
}) => {
  const handleInputChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
  };

  const calculateDiscountPercentage = (basePrice: number, offerPrice: number) => {
    if (basePrice > 0 && offerPrice > 0 && offerPrice < basePrice) {
      return Math.round(((basePrice - offerPrice) / basePrice) * 100);
    }
    return 0;
  };

  const handleBasePriceChange = (value: number) => {
    const discountPercentage = calculateDiscountPercentage(value, formData.offerPrice);
    updateFormData({ 
      basePrice: value,
      discountPercentage 
    });
  };

  const handleOfferPriceChange = (value: number) => {
    const discountPercentage = calculateDiscountPercentage(formData.basePrice, value);
    updateFormData({ 
      offerPrice: value,
      discountPercentage 
    });
  };

  const handleManualDiscountChange = (value: number) => {
    if (value >= 0 && value <= 100) {
      const offerPrice = formData.basePrice * (1 - value / 100);
      updateFormData({ 
        discountPercentage: value,
        offerPrice: Math.round(offerPrice * 100) / 100 // Round to 2 decimal places
      });
    }
  };

  const generateSku = () => {
    if (!formData.sku || formData.sku === '') {
      // Generate SKU from product name and random numbers
      const baseSku = formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newSku = `${baseSku}${random}`;
      handleInputChange('sku', newSku);
    }
  };

  // Auto-generate SKU when product name changes (only for new products)
  useEffect(() => {
    if (!isEditing && formData.name && (!formData.sku || formData.sku === '')) {
      generateSku();
    }
  }, [formData.name, isEditing]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Base Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Price (Rs) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.basePrice || ''}
            onChange={(e) => handleBasePriceChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Offer Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offer Price (Rs)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.offerPrice || ''}
            onChange={(e) => handleOfferPriceChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* Discount Percentage - Now editable for updates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Percentage (%)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discountPercentage || 0}
              onChange={(e) => handleManualDiscountChange(parseInt(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isEditing} // Only editable when updating
            />
            {!isEditing && (
              <button
                type="button"
                onClick={() => handleManualDiscountChange(formData.discountPercentage || 0)}
                className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Set
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isEditing ? 'Manually set discount percentage' : 'Calculated automatically from prices'}
          </p>
        </div>

        {/* Tax Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.taxRate || ''}
            onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Auto-generated if empty"
            />
            {!isEditing && (
              <button
                type="button"
                onClick={generateSku}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200"
              >
                Generate
              </button>
            )}
          </div>
          {!isEditing && (
            <p className="text-xs text-gray-500 mt-1">
              SKU will be auto-generated from product name
            </p>
          )}
        </div>

        {/* Barcode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barcode
          </label>
          <input
            type="text"
            value={formData.barcode}
            onChange={(e) => handleInputChange('barcode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional barcode"
          />
        </div>

        {/* Stock Quantity - Only show for non-variant products */}
        {!formData.variantConfiguration.hasVariants && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity || ''}
              onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={!isEditing}
            />
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Current stock: {formData.stockQuantity || 0} units
              </p>
            )}
          </div>
        )}

        {/* Low Stock Alert - Only for editing */}
        {isEditing && !formData.variantConfiguration.hasVariants && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Alert
            </label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity && formData.stockQuantity < 10 ? formData.stockQuantity : 10}
              onChange={(e) => {
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get notified when stock falls below this level
            </p>
          </div>
        )}
      </div>

      {/* Pricing Summary */}
      {(formData.offerPrice > 0 && formData.offerPrice < formData.basePrice) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Pricing Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Original Price:</span>
              <div className="font-medium">${formData.basePrice.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">Sale Price:</span>
              <div className="font-medium text-green-600">${formData.offerPrice.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">You Save:</span>
              <div className="font-medium text-red-600">
                ${(formData.basePrice - formData.offerPrice).toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Discount:</span>
              <div className="font-medium text-red-600">
                {formData.discountPercentage}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Management Notice */}
      {formData.variantConfiguration.hasVariants ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-sm font-medium text-yellow-800">
                {isEditing ? 'Variant Stock Management' : 'Stock Management'}
              </span>
              <p className="text-sm text-yellow-700 mt-1">
                {isEditing 
                  ? 'Stock quantity is managed at the variant level. Edit individual variants to update stock.'
                  : 'Stock quantity will be managed at the variant level. You can set stock for each variant individually.'
                }
              </p>
            </div>
          </div>
        </div>
      ) : isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-800">Stock Management</span>
              <p className="text-sm text-gray-600 mt-1">
                Current stock level: <strong>{formData.stockQuantity || 0}</strong> units
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                (formData.stockQuantity || 0) > 20 
                  ? 'bg-green-100 text-green-800' 
                  : (formData.stockQuantity || 0) > 5 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                { (formData.stockQuantity || 0) > 20 ? 'In Stock' : 
                  (formData.stockQuantity || 0) > 5 ? 'Low Stock' : 'Out of Stock' }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode Additional Info */}
      {isEditing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-green-800">Edit Mode</span>
              <p className="text-sm text-green-700 mt-1">
                You are currently editing an existing product. Some fields may have different behaviors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingInventorySection;