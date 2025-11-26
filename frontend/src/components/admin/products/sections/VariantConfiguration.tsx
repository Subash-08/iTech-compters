// VariantConfiguration.tsx
import React, { useState } from 'react';
import { ProductFormData } from '../../types/product';

interface VariantConfigurationProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditMode?: boolean;
  onEnableVariants?: () => void;
}

const VariantConfiguration: React.FC<VariantConfigurationProps> = ({
  formData,
  updateFormData,
  isEditMode = false,
  onEnableVariants
}) => {
  const [newAttribute, setNewAttribute] = useState({ key: '', label: '', value: '' });
  const [newSpec, setNewSpec] = useState({ sectionTitle: '', specKey: '', specLabel: '', possibleValue: '' });

  const handleVariantConfigChange = (field: string, value: any) => {
    const updatedConfig = {
      ...formData.variantConfiguration,
      [field]: value
    };

    if (field === 'hasVariants' && value === true) {
      // Enable variants
      updateFormData({
        variantConfiguration: updatedConfig
      });
      onEnableVariants?.();
    } else if (field === 'hasVariants' && value === false && formData.variants.length > 0) {
      // Disable variants with confirmation
      const confirmDisable = window.confirm(
        'This product has existing variants. Disabling variants will remove all variant data. Are you sure?'
      );
      if (confirmDisable) {
        updateFormData({
          variantConfiguration: updatedConfig,
          variants: []
        });
      }
    } else {
      updateFormData({
        variantConfiguration: updatedConfig
      });
    }
  };

  const handleVariantSpecChange = (index: number, field: string, value: any) => {
    const updatedConfig = { ...formData.variantConfiguration };
    if (!updatedConfig.variantCreatingSpecs) {
      updatedConfig.variantCreatingSpecs = [];
    }
    
    if (!updatedConfig.variantCreatingSpecs[index]) {
      updatedConfig.variantCreatingSpecs[index] = { sectionTitle: '', specKey: '', specLabel: '', possibleValues: [] };
    }
    
    updatedConfig.variantCreatingSpecs[index] = {
      ...updatedConfig.variantCreatingSpecs[index],
      [field]: value
    };
    
    updateFormData({ variantConfiguration: updatedConfig });
  };

  const addVariantCreatingSpec = () => {
    const updatedConfig = { ...formData.variantConfiguration };
    if (!updatedConfig.variantCreatingSpecs) {
      updatedConfig.variantCreatingSpecs = [];
    }
    
    updatedConfig.variantCreatingSpecs.push({
      sectionTitle: '',
      specKey: '',
      specLabel: '',
      possibleValues: []
    });
    
    updateFormData({ variantConfiguration: updatedConfig });
  };

  const removeVariantCreatingSpec = (index: number) => {
    const updatedConfig = { ...formData.variantConfiguration };
    if (updatedConfig.variantCreatingSpecs) {
      updatedConfig.variantCreatingSpecs = updatedConfig.variantCreatingSpecs.filter((_, i) => i !== index);
      updateFormData({ variantConfiguration: updatedConfig });
    }
  };

  const addPossibleValue = (specIndex: number, value: string) => {
    if (!value.trim()) return;
    
    const updatedConfig = { ...formData.variantConfiguration };
    if (updatedConfig.variantCreatingSpecs && updatedConfig.variantCreatingSpecs[specIndex]) {
      if (!updatedConfig.variantCreatingSpecs[specIndex].possibleValues) {
        updatedConfig.variantCreatingSpecs[specIndex].possibleValues = [];
      }
      
      updatedConfig.variantCreatingSpecs[specIndex].possibleValues.push(value.trim());
      updateFormData({ variantConfiguration: updatedConfig });
      setNewSpec(prev => ({ ...prev, possibleValue: '' }));
    }
  };

  const removePossibleValue = (specIndex: number, valueIndex: number) => {
    const updatedConfig = { ...formData.variantConfiguration };
    if (updatedConfig.variantCreatingSpecs && updatedConfig.variantCreatingSpecs[specIndex]) {
      updatedConfig.variantCreatingSpecs[specIndex].possibleValues = 
        updatedConfig.variantCreatingSpecs[specIndex].possibleValues.filter((_, i) => i !== valueIndex);
      updateFormData({ variantConfiguration: updatedConfig });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Variants */}
      {!formData.variantConfiguration.hasVariants ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">Enable Product Variants</h3>
          <p className="text-blue-700 mb-4">
            Create multiple versions of this product with different attributes like color, size, storage, etc.
          </p>
          <button
            type="button"
            onClick={() => handleVariantConfigChange('hasVariants', true)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enable Variants
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Basic Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Configuration</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant Type
                </label>
                <select
                  value={formData.variantConfiguration.variantType}
                  onChange={(e) => handleVariantConfigChange('variantType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="None">No Variants</option>
                  <option value="Color">Color Only</option>
                  <option value="Specifications">Specifications</option>
                  <option value="Attributes">Attributes</option>
                  <option value="Mixed">Mixed</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose how variants will be created and managed
                </p>
              </div>

              <div className="flex items-start pt-6">
                <input
                  type="checkbox"
                  id="hasVariants"
                  checked={formData.variantConfiguration.hasVariants}
                  onChange={(e) => handleVariantConfigChange('hasVariants', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <label htmlFor="hasVariants" className="ml-2 text-sm text-gray-700">
                  This product has variants
                  {isEditMode && formData.variants.length > 0 && (
                    <span className="ml-1 text-xs text-green-600">
                      ({formData.variants.length} variants configured)
                    </span>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Specifications Configuration */}
          {(formData.variantConfiguration.variantType === 'Specifications' || 
            formData.variantConfiguration.variantType === 'Mixed') && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Variant Specifications</h3>
                <button
                  type="button"
                  onClick={addVariantCreatingSpec}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Add Specification
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Define specifications that will create different variants (e.g., Storage, RAM, Size)
              </p>

              {formData.variantConfiguration.variantCreatingSpecs?.map((spec, specIndex) => (
                <div key={specIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      Specification {specIndex + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeVariantCreatingSpec(specIndex)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Section Title *
                      </label>
                      <input
                        type="text"
                        value={spec.sectionTitle || ''}
                        onChange={(e) => handleVariantSpecChange(specIndex, 'sectionTitle', e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Memory"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Technical Key *
                      </label>
                      <input
                        type="text"
                        value={spec.specKey || ''}
                        onChange={(e) => handleVariantSpecChange(specIndex, 'specKey', e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., ram"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Used in code</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Label *
                      </label>
                      <input
                        type="text"
                        value={spec.specLabel || ''}
                        onChange={(e) => handleVariantSpecChange(specIndex, 'specLabel', e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., RAM"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Shown to customers</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Possible Values *
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={newSpec.possibleValue}
                        onChange={(e) => setNewSpec(prev => ({ ...prev, possibleValue: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPossibleValue(specIndex, newSpec.possibleValue);
                          }
                        }}
                        placeholder="e.g., 8GB"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => addPossibleValue(specIndex, newSpec.possibleValue)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add Value
                      </button>
                    </div>
                    
                    {spec.possibleValues && spec.possibleValues.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {spec.possibleValues.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-center bg-blue-100 px-3 py-2 rounded-lg">
                            <span className="text-sm font-medium text-blue-800">{value}</span>
                            <button
                              type="button"
                              onClick={() => removePossibleValue(specIndex, valueIndex)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                        No values added yet. Add possible values for this specification.
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {(!formData.variantConfiguration.variantCreatingSpecs || formData.variantConfiguration.variantCreatingSpecs.length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 mb-2">No specifications configured</p>
                  <p className="text-sm text-gray-500">Add specifications to automatically generate variants</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantConfiguration;