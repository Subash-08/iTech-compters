// VariantGenerator.tsx
import React, { useState } from 'react';
import { ProductFormData, ProductVariant } from '../../types/product';

interface VariantGeneratorProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const VariantGenerator: React.FC<VariantGeneratorProps> = ({
  formData,
  updateFormData
}) => {
  const [basePrice, setBasePrice] = useState(formData.basePrice || 0);
  const [baseStock, setBaseStock] = useState(0);

  const generateSKU = (combination: any[]) => {
    const baseSKU = formData.sku || 'PROD';
    const variantCodes = combination.map(attr =>
      attr.value.replace(/[^a-z0-9]/gi, '').toUpperCase().substring(0, 3)
    );
    return `${baseSKU}-${variantCodes.join('-')}`;
  };

  const generateBarcode = () => {
    return Date.now().toString() + Math.floor(Math.random() * 1000);
  };

  const generateVariantName = (combination: any[]) => {
    const attributeStrings = combination.map(attr =>
      `${attr.label}: ${attr.value}`
    );
    return `${formData.name} - ${attributeStrings.join(' | ')}`;
  };

  const generateAttributeCombinations = () => {
    if (!formData.variantConfiguration.variantCreatingSpecs) {
      return [];
    }

    const combinations: any[] = [];
    const specs = formData.variantConfiguration.variantCreatingSpecs;

    function generate(index: number, current: any[]) {
      if (index === specs.length) {
        combinations.push([...current]);
        return;
      }

      const spec = specs[index];
      for (const value of spec.possibleValues || []) {
        current.push({
          key: spec.specKey,
          label: spec.specLabel,
          value: value
        });
        generate(index + 1, current);
        current.pop();
      }
    }

    generate(0, []);
    return combinations;
  };

  const generateVariants = () => {
    const combinations = generateAttributeCombinations();
    
    if (combinations.length === 0) {
      alert('No variant combinations found. Please check your specification configuration.');
      return;
    }

    if (combinations.length > 50) {
      const confirmGenerate = window.confirm(
        `This will generate ${combinations.length} variants. This might be too many. Do you want to continue?`
      );
      if (!confirmGenerate) return;
    }

    const newVariants: ProductVariant[] = combinations.map(combination => {
      return {
        name: generateVariantName(combination),
        sku: generateSKU(combination),
        barcode: generateBarcode(),
        price: basePrice || formData.basePrice || 0,
        offerPrice: basePrice || formData.basePrice || 0,
        stockQuantity: baseStock,
        identifyingAttributes: combination.map(attr => ({
          key: attr.key,
          label: attr.label,
          value: attr.value,
          displayValue: attr.value,
          hexCode: '',
          isColor: false
        })),
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
    });

    updateFormData({
      variants: [...formData.variants, ...newVariants]
    });

    alert(`Successfully generated ${newVariants.length} variants!`);
  };

  const combinations = generateAttributeCombinations();
  const hasSpecs = formData.variantConfiguration.variantCreatingSpecs && 
                  formData.variantConfiguration.variantCreatingSpecs.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Variants Automatically</h3>
        <p className="text-gray-600 mb-6">
          Create all possible variant combinations based on your specifications configuration.
        </p>

        {!hasSpecs ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-2">No specifications configured</p>
            <p className="text-sm text-gray-500 mb-4">
              Configure specifications in the Configuration tab to generate variants automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Total Combinations:</span>
                  <span className="ml-2 text-blue-700">{combinations.length}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Specifications:</span>
                  <span className="ml-2 text-blue-700">
                    {formData.variantConfiguration.variantCreatingSpecs?.length}
                  </span>
                </div>
              </div>
              
              {combinations.length > 0 && (
                <div className="mt-3">
                  <span className="font-medium text-blue-800 text-sm">Sample Combinations:</span>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {combinations.slice(0, 5).map((combo, index) => (
                      <div key={index} className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        {combo.map((attr: any) => `${attr.label}: ${attr.value}`).join(' | ')}
                      </div>
                    ))}
                    {combinations.length > 5 && (
                      <div className="text-xs text-blue-600 text-center">
                        ... and {combinations.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price for All Variants ($)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default price for all generated variants
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Stock Quantity
                </label>
                <input
                  type="number"
                  value={baseStock}
                  onChange={(e) => setBaseStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default stock for all generated variants
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  This will generate <span className="font-medium text-gray-900">{combinations.length}</span> variants
                </p>
                {formData.variants.length > 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠️ This will add to existing {formData.variants.length} variants
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={generateVariants}
                disabled={combinations.length === 0}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate {combinations.length} Variants
              </button>
            </div>
          </>
        )}
      </div>

      {/* Manual Add Option */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Manual Option</h4>
        <p className="text-sm text-gray-600 mb-4">
          Prefer to add variants one by one? You can manually create variants in the Manage tab.
        </p>
        <button
          type="button"
          onClick={() => {
            // This would be handled by the parent component to switch tabs
            const manageTabButton = document.querySelector('[data-tab="manage"]') as HTMLButtonElement;
            if (manageTabButton) manageTabButton.click();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Go to Manage Tab
        </button>
      </div>
    </div>
  );
};

export default VariantGenerator;