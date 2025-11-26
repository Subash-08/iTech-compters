// VariantsSection.tsx
import React, { useState, useEffect } from 'react';
import { ProductFormData } from '../../types/product';
import VariantConfiguration from './VariantConfiguration';
import VariantGenerator from './VariantGenerator';
import VariantList from './VariantList';

interface VariantsSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditMode?: boolean;
}

const VariantsSection: React.FC<VariantsSectionProps> = ({
  formData,
  updateFormData,
  isEditMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'generate' | 'manage'>('config');

  // Auto-detect if product has variants when in edit mode
  useEffect(() => {
    if (isEditMode && formData.variants && formData.variants.length > 0) {
      if (!formData.variantConfiguration.hasVariants) {
        updateFormData({
          variantConfiguration: {
            ...formData.variantConfiguration,
            hasVariants: true
          }
        });
      }
      setActiveTab('manage');
    }
  }, [isEditMode, formData.variants, formData.variantConfiguration.hasVariants, updateFormData]);

  const totalVariantsStock = formData.variants.reduce((total, variant) => total + (variant.stockQuantity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
        {isEditMode && formData.variants.length > 0 && (
          <span className="text-sm text-gray-500">
            {formData.variants.length} variants • {totalVariantsStock} total stock
          </span>
        )}
      </div>

      {/* Navigation Tabs */}
      {formData.variantConfiguration.hasVariants && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configuration
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generate Variants
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Variants ({formData.variants.length})
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-[400px]">
        {!formData.variantConfiguration.hasVariants ? (
          <VariantConfiguration
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={isEditMode}
            onEnableVariants={() => setActiveTab('config')}
          />
        ) : (
          <>
            {activeTab === 'config' && (
              <VariantConfiguration
                formData={formData}
                updateFormData={updateFormData}
                isEditMode={isEditMode}
              />
            )}
            
            {activeTab === 'generate' && (
              <VariantGenerator
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            
            {activeTab === 'manage' && (
              <VariantList
                formData={formData}
                updateFormData={updateFormData}
                isEditMode={isEditMode}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VariantsSection;