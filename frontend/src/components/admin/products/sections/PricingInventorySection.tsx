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
  // 🆕 Check if product has variants
  const hasVariants = formData.variantConfiguration?.hasVariants && formData.variants?.length > 0;

  // 🆕 Disable pricing fields when variants exist
  const pricingDisabled = hasVariants;

  const handleInputChange = (field: string, value: any) => {

    // Make sure taxRate is parsed as a number
    if (field === 'taxRate') {
      const numValue = parseFloat(value);
      updateFormData({ [field]: numValue });
    } else {
      updateFormData({ [field]: value });
    }
  };

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateFormData({ taxRate: value });
  };

  const calculateDiscountPercentage = (basePrice: number, mrp: number) => {
    if (mrp > 0 && basePrice > 0 && basePrice < mrp) {
      return Math.round(((mrp - basePrice) / mrp) * 100);
    }
    return 0;
  };

  // 🆕 UPDATED: Handle inclusive price change with MRP
  const handleBasePriceChange = (value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    const mprValue = Number(formData.mrp) || Number(formData.inclusivePrice) || 0;
    const discountPercentage = calculateDiscountPercentage(numValue, mprValue);
    updateFormData({
      inclusivePrice: numValue,
      discountPercentage
    });
  };

  // 🆕 UPDATED: Handle MRP change
  const handleMrpChange = (value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    const baseValue = Number(formData.inclusivePrice) || 0;
    const discountPercentage = calculateDiscountPercentage(baseValue, numValue);
    updateFormData({
      mrp: numValue,
      discountPercentage
    });
  };

  // 🆕 Keep offerPrice for backward compatibility
  const handleOfferPriceChange = (value: string) => {
    updateFormData({
      offerPrice: value as any
    });
  };

  const handleManualDiscountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0 && numValue <= 100) {
      const mrp = Number(formData.mrp) || Number(formData.inclusivePrice) || 0;
      const inclusivePrice = mrp * (1 - numValue / 100);
      updateFormData({
        discountPercentage: numValue,
        inclusivePrice: Math.round(inclusivePrice * 100) / 100
      });
    } else if (value === '') {
      updateFormData({ discountPercentage: 0 });
    }
  };

  const generateSku = () => {
    if (!formData.sku || formData.sku === '') {
      const baseSku = formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newSku = `${baseSku}${random}`;
      handleInputChange('sku', newSku);
    }
  };

  useEffect(() => {
    if (!isEditing && formData.name && (!formData.sku || formData.sku === '')) {
      generateSku();
    }
  }, [formData.name, isEditing]);

  const hasActiveVariants = formData.variantConfiguration.hasVariants && formData.variants.length > 0;
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h2>

      {hasActiveVariants && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-center shadow-sm border border-blue-100">
          <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Pricing is managed at the variant level since this product has variants.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🆕 MRP (Maximum Retail Price) */}
        <div className={`relative ${pricingDisabled ? 'opacity-60' : ''}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MRP (Maximum Retail Price) ₹ <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.mrp !== undefined ? formData.mrp : (formData.inclusivePrice || '')}
            onChange={(e) => handleMrpChange(e.target.value)}
            disabled={pricingDisabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${pricingDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            required
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum Retail Price (strikethrough price)
          </p>
        </div>

        {/* Selling Price (Inclusive of Tax) */}
        <div className={`relative ${pricingDisabled ? 'opacity-60' : ''}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selling Price (Inclusive of Tax) ₹ <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.inclusivePrice !== undefined ? formData.inclusivePrice : ''}
            onChange={(e) => handleBasePriceChange(e.target.value)}
            disabled={pricingDisabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${pricingDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            required
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Final price shown to the customer (including GST)
          </p>
        </div>

        {/* 🆕 Keep Offer Price for backward compatibility (hidden but functional) */}
        <div className="hidden">
          <input
            type="number"
            value={formData.offerPrice !== undefined ? formData.offerPrice : ''}
            onChange={(e) => handleOfferPriceChange(e.target.value)}
          />
        </div>

        {/* Discount Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Percentage (%)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discountPercentage !== undefined ? formData.discountPercentage : ''}
              onChange={(e) => handleManualDiscountChange(e.target.value)}
              disabled={pricingDisabled}
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${pricingDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                }`}
            />
            {!isEditing && !pricingDisabled && (
              <button
                type="button"
                onClick={() => handleManualDiscountChange((formData.discountPercentage || 0).toString())}
                className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Set
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pricingDisabled
              ? 'Calculated from variant prices'
              : isEditing
                ? 'Manually set discount percentage'
                : 'Calculated automatically from MRP and selling price'
            }
          </p>
        </div>

        {/* Tax Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%) <span className="text-xs text-gray-400 font-normal">e.g. 5, 12, 18, 28</span>
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={formData.taxRate !== undefined && formData.taxRate !== null ? formData.taxRate : ''}
            onChange={handleTaxRateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current value: {formData.taxRate ?? 0}%
          </p>
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
        {!hasVariants && (
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
        {isEditing && !hasVariants && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Alert
            </label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity && formData.stockQuantity < 10 ? formData.stockQuantity : 10}
              onChange={(e) => {
                // Handle low stock alert
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get notified when stock falls below this level
            </p>
          </div>
        )}
      </div>

      {/* 🆕 UPDATED: Pricing Summary with MRP */}
      {(formData.mrp && formData.mrp > formData.basePrice) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">Pricing Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">MRP:</span>
              <div className="font-medium line-through text-gray-500">₹{formData.mrp.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">Selling Price:</span>
              <div className="font-medium text-green-600">₹{formData.basePrice.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">You Save:</span>
              <div className="font-medium text-red-600">
                ₹{(formData.mrp - formData.basePrice).toFixed(2)}
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
      {hasVariants ? (
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
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(formData.stockQuantity || 0) > 20
                ? 'bg-green-100 text-green-800'
                : (formData.stockQuantity || 0) > 5
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                {(formData.stockQuantity || 0) > 20 ? 'In Stock' :
                  (formData.stockQuantity || 0) > 5 ? 'Low Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingInventorySection;