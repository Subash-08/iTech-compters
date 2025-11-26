// VariantList.tsx
import React from 'react';
import { ProductFormData, ProductVariant } from '../../types/product';
import VariantItem from './VariantItem';

interface VariantListProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditMode?: boolean;
}

const VariantList: React.FC<VariantListProps> = ({
  formData,
  updateFormData,
  isEditMode = false
}) => {
  const generateSKU = () => {
    const baseSKU = formData.sku || 'PROD';
    const variantCount = formData.variants.length + 1;
    return `${baseSKU}-V${variantCount}`;
  };

  const generateBarcode = () => {
    return Date.now().toString() + Math.floor(Math.random() * 1000);
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      name: '',
      sku: generateSKU(),
      barcode: generateBarcode(),
      price: formData.basePrice || 0,
      offerPrice: formData.offerPrice || 0,
      stockQuantity: 0,
      identifyingAttributes: [],
      images: { 
        thumbnail: {
          url: formData.images?.thumbnail?.url || '',
          altText: formData.images?.thumbnail?.altText || ''
        },
        gallery: []
      },
      isActive: true,
      specifications: []
    };
    
    updateFormData({
      variants: [...formData.variants, newVariant]
    });
  };

  const handleVariantChange = (index: number, updatedVariant: ProductVariant) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = updatedVariant;
    updateFormData({ variants: updatedVariants });
  };

  const removeVariant = (index: number) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    updateFormData({ variants: updatedVariants });
  };

  const totalVariantsStock = formData.variants.reduce((total, variant) => total + (variant.stockQuantity || 0), 0);
  const activeVariants = formData.variants.filter(v => v.isActive).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formData.variants.length}</div>
            <div className="text-gray-600">Total Variants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{activeVariants}</div>
            <div className="text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalVariantsStock}</div>
            <div className="text-gray-600">Total Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formData.variants.length > 0 ? Math.min(...formData.variants.map(v => v.price)) : 0}
            </div>
            <div className="text-gray-600">Lowest Price</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Manage Variants</h3>
          <p className="text-sm text-gray-600">
            Add, edit, or remove individual variants
          </p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Variant
        </button>
      </div>

      {/* Variants List */}
      {formData.variants.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No variants created yet</h4>
          <p className="text-gray-600 mb-4">Get started by adding your first variant</p>
          <div className="space-x-3">
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add Manual Variant
            </button>
            <button
              type="button"
              onClick={() => {
                const generateTabButton = document.querySelector('[data-tab="generate"]') as HTMLButtonElement;
                if (generateTabButton) generateTabButton.click();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Generate Automatically
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.variants.map((variant, index) => (
            <VariantItem
              key={variant._id || index}
              variant={variant}
              index={index}
              onVariantChange={(updatedVariant) => handleVariantChange(index, updatedVariant)}
              onRemove={() => removeVariant(index)}
              baseThumbnail={formData.images?.thumbnail}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VariantList;