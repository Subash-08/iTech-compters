// src/components/product/VariantSelectors.tsx
import React from 'react';
import { ProductData, Variant } from './productTypes';

interface VariantSelectorsProps {
  productData: ProductData;
  selectedAttributes: Record<string, string>;
  selectedVariant: Variant | null;
  onAttributeChange: (key: string, value: string) => void;
}

const VariantSelectors: React.FC<VariantSelectorsProps> = ({
  productData,
  selectedAttributes,
  selectedVariant,
  onAttributeChange
}) => {
  // Helper function for color hex codes
  const getColorHexCode = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'black': '#000000', 'white': '#FFFFFF', 'silver': '#C0C0C0', 'gray': '#808080',
      'space black': '#333333', 'space gray': '#535353', 'blue': '#007AFF', 'red': '#FF3B30',
      'green': '#34C759', 'yellow': '#FFCC00', 'pink': '#FF2D55', 'purple': '#AF52DE',
      'gold': '#FFD700', 'midnight': '#171717', 'starlight': '#F8F9FA', 'space blue': '#1E3A5F'
    };
    
    return colorMap[colorName.toLowerCase()] || '#CCCCCC';
  };

  // 🆕 FIX: Get variant specifications from actual variants when variantCreatingSpecs is empty
  const getVariantSpecs = () => {
    // First check if we have variantCreatingSpecs
    if (productData?.variantConfiguration?.variantCreatingSpecs?.length > 0) {
      return productData.variantConfiguration.variantCreatingSpecs;
    }
    
    // If not, extract specs from variants' identifyingAttributes
    if (!productData?.variants) return [];
    
    const specMap = new Map();
    
    productData.variants.forEach(variant => {
      variant.identifyingAttributes?.forEach(attr => {
        if (!specMap.has(attr.key)) {
          specMap.set(attr.key, {
            specKey: attr.key,
            specLabel: attr.label || attr.key.charAt(0).toUpperCase() + attr.key.slice(1),
            possibleValues: new Set()
          });
        }
        specMap.get(attr.key).possibleValues.add(attr.value);
      });
    });
    
    // Convert Set to Array and sort if it's a numeric-like value
    return Array.from(specMap.values()).map(spec => ({
      ...spec,
      possibleValues: Array.from(spec.possibleValues).sort((a, b) => {
        // Sort RAM values numerically (8GB, 16GB, 32GB, etc.)
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      })
    }));
  };

  // 🆕 FIX: Detect if product has color variants
  const hasColorVariants = () => {
    if (!productData?.variants) return false;
    
    return productData.variants.some(variant => 
      variant.identifyingAttributes?.some(attr => 
        attr.isColor || attr.key === 'color' || attr.key.toLowerCase().includes('color')
      )
    );
  };

  // 🆕 FIX: Get all unique attributes from actual variants
  const getAllVariantAttributes = () => {
    if (!productData?.variants) return [];
    
    const attributeMap = new Map();
    
    productData.variants.forEach(variant => {
      variant.identifyingAttributes?.forEach(attr => {
        if (!attributeMap.has(attr.key)) {
          attributeMap.set(attr.key, {
            key: attr.key,
            label: attr.label || attr.key,
            isColor: attr.isColor || attr.key === 'color' || attr.key.toLowerCase().includes('color'),
            values: new Set()
          });
        }
        attributeMap.get(attr.key).values.add(attr.value);
      });
    });
    
    return Array.from(attributeMap.values()).map(attr => ({
      ...attr,
      values: Array.from(attr.values)
    }));
  };

  // Get available colors with stock info
  const getAvailableColors = () => {
    if (!productData?.variants) return [];
    
    const colorMap = new Map();
    
    productData.variants.forEach(variant => {
      if (!variant.isActive) return;
      
      // Look for color attribute
      const colorAttr = variant.identifyingAttributes?.find(attr => 
        attr.isColor || attr.key === 'color' || attr.key.toLowerCase().includes('color')
      );
      
      if (colorAttr) {
        const existing = colorMap.get(colorAttr.value) || {
          value: colorAttr.value,
          displayValue: attr.displayValue || attr.value,
          hexCode: attr.hexCode || getColorHexCode(attr.value),
          stock: 0,
          inStock: false,
          variantCount: 0
        };
        
        existing.stock += variant.stockQuantity || 0;
        existing.variantCount += 1;
        existing.inStock = existing.stock > 0;
        colorMap.set(colorAttr.value, existing);
      }
    });
    
    return Array.from(colorMap.values());
  };

  // Get display value for any variant type
  const getDisplayValue = (specKey: string, value: string) => {
    if (!productData?.variants) return value;
    
    const variant = productData.variants.find(v => 
      v.identifyingAttributes?.some(attr => attr.key === specKey && attr.value === value)
    );
    
    const attr = variant?.identifyingAttributes?.find(attr => attr.key === specKey);
    return attr?.displayValue || attr?.value || value;
  };

  // Find variant based on selected attributes
  const findVariantByAttributes = (attributes: Record<string, string>): Variant | null => {
    if (!productData || !productData.variants) return null;
    
    return productData.variants.find(variant => 
      variant.identifyingAttributes?.every(attr => 
        attributes[attr.key] === attr.value
      )
    ) || null;
  };

  // Check if an option is compatible with current selections
  const isOptionCompatible = (specKey: string, value: string): boolean => {
    const testAttributes = { ...selectedAttributes, [specKey]: value };
    return findBestCompatibleVariant(testAttributes) !== null;
  };

  // Find the best compatible variant when exact match isn't available
  const findBestCompatibleVariant = (targetAttributes: Record<string, string>) => {
    if (!productData?.variants) return null;
    
    const activeVariants = productData.variants.filter(v => v.isActive && (v.stockQuantity || 0) > 0);
    
    const scoredVariants = activeVariants.map(variant => {
      if (!variant.identifyingAttributes) return { variant, score: 0 };
      
      const variantAttrs = {};
      variant.identifyingAttributes.forEach(attr => {
        variantAttrs[attr.key] = attr.value;
      });
      
      let score = 0;
      let priorityScore = 0;
      
      Object.keys(targetAttributes).forEach(key => {
        if (targetAttributes[key] === variantAttrs[key]) {
          score++;
          const changedKey = Object.keys(targetAttributes).find(k => 
            selectedAttributes[k] !== targetAttributes[k]
          );
          if (key === changedKey) {
            priorityScore += 2;
          }
        }
      });
      
      return { 
        variant, 
        score: score + priorityScore,
        exactKeyMatch: targetAttributes[Object.keys(targetAttributes).find(k => selectedAttributes[k] !== targetAttributes[k])] === 
                      variantAttrs[Object.keys(targetAttributes).find(k => selectedAttributes[k] !== targetAttributes[k])]
      };
    });
    
    scoredVariants.sort((a, b) => {
      if (a.exactKeyMatch !== b.exactKeyMatch) return a.exactKeyMatch ? -1 : 1;
      return b.score - a.score;
    });
    
    return scoredVariants[0]?.variant || null;
  };

  // Enhanced getAvailableOptions that considers current selections
  const getAvailableOptions = (specKey: string) => {
    if (!productData?.variants) return [];
    
    const optionMap = new Map();
    const otherSelectedAttributes = { ...selectedAttributes };
    delete otherSelectedAttributes[specKey];
    
    productData.variants.forEach(variant => {
      if (!variant.isActive) return;
      
      const attr = variant.identifyingAttributes?.find(attr => attr.key === specKey);
      
      if (attr) {
        const isCompatible = Object.keys(otherSelectedAttributes).every(key => {
          if (!otherSelectedAttributes[key]) return true;
          const variantAttr = variant.identifyingAttributes?.find(a => a.key === key);
          return variantAttr && variantAttr.value === otherSelectedAttributes[key];
        });
        
        const existing = optionMap.get(attr.value) || {
          value: attr.value,
          displayValue: attr.displayValue || attr.value,
          stock: 0,
          inStock: false,
          variantCount: 0,
          isCompatible: true
        };
        
        existing.stock += variant.stockQuantity || 0;
        existing.variantCount += 1;
        existing.inStock = existing.stock > 0;
        if (!existing.hasOwnProperty('isCompatible')) {
          existing.isCompatible = isCompatible;
        } else {
          existing.isCompatible = existing.isCompatible || isCompatible;
        }
        optionMap.set(attr.value, existing);
      }
    });
    
    return Array.from(optionMap.values());
  };

  // Early return if no variants
  if (!productData?.variants || productData.variants.length <= 1) {
    return null;
  }

  // 🆕 FIX: Get all variant specs (using fallback when variantCreatingSpecs is empty)
  const variantSpecs = getVariantSpecs();
  const allAttributes = getAllVariantAttributes();

  // If no variant specs found, don't show selectors
  if (variantSpecs.length === 0) {
    return null;
  }

  return (
    <>
      {/* 🆕 FIX: Show Color Selector if variants have color attributes */}
      {hasColorVariants() && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color:
              {selectedAttributes.color && (
                <span className="ml-2 text-gray-600 font-normal">
                  {getAvailableColors().find(c => c.value === selectedAttributes.color)?.displayValue}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-3">
              {getAvailableColors().map((colorInfo) => {
                const isSelected = selectedAttributes.color === colorInfo.value;
                const isCompatible = isOptionCompatible('color', colorInfo.value);

                return (
                  <button
                    key={colorInfo.value}
                    onClick={() => onAttributeChange('color', colorInfo.value)}
                    disabled={!isCompatible}
                    className={`
                      relative flex flex-col items-center p-2 border-2 rounded-lg transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : isCompatible
                        ? 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-100'
                      }
                      ${!isCompatible ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    title={`${colorInfo.displayValue}${!isCompatible ? ' - Not available with current selection' : colorInfo.stock > 0 ? ` (${colorInfo.stock} available)` : ''}`}
                  >
                    {/* Color Swatch */}
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-300 mb-1 shadow-sm"
                      style={{ backgroundColor: colorInfo.hexCode }}
                    />
                    
                    {/* Color Name */}
                    <span className={`text-xs max-w-16 truncate ${
                      isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                    }`}>
                      {colorInfo.displayValue}
                    </span>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Low Stock Badge */}
                    {isCompatible && colorInfo.stock > 0 && colorInfo.stock < 5 && !isSelected && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded">
                        Low
                      </span>
                    )}
                    
                    {/* Compatibility Overlay */}
                    {!isCompatible && (
                      <div className="absolute inset-0 bg-gray-100 bg-opacity-70 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 font-medium rotate-45">X</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Stock information */}
            {selectedAttributes.color && (
              <div className="mt-2 text-sm">
                {isOptionCompatible('color', selectedAttributes.color) ? (
                  <span className="text-green-600 font-medium">
                    ✓ In Stock ({getAvailableColors().find(c => c.value === selectedAttributes.color)?.stock || 0} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Not available with current selection</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Variant Selectors for ALL variant specs */}
      {variantSpecs.map((spec) => {
        // Skip color if we already showed it
        if (spec.specKey === 'color' || spec.specKey.toLowerCase().includes('color')) {
          return null;
        }
        
        const availableOptions = getAvailableOptions(spec.specKey);
        
        return (
          <div key={spec.specKey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {spec.specLabel}:
                {selectedAttributes[spec.specKey] && (
                  <span className="ml-2 text-gray-600 font-normal">
                    {getDisplayValue(spec.specKey, selectedAttributes[spec.specKey])}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-3">
                {spec.possibleValues?.map((value) => {
                  const isSelected = selectedAttributes[spec.specKey] === value;
                  const optionInfo = availableOptions.find(opt => opt.value === value);
                  const isCompatible = isOptionCompatible(spec.specKey, value);
                  const stockInfo = optionInfo?.stock ?? 0;

                  return (
                    <button
                      key={value}
                      onClick={() => onAttributeChange(spec.specKey, value)}
                      disabled={!isCompatible}
                      className={`
                        relative px-4 py-2 border rounded-lg text-sm font-medium transition-colors
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                          : isCompatible
                          ? 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                          : 'border-gray-200 text-gray-400 bg-gray-100'
                        }
                        ${!isCompatible ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      title={!isCompatible ? 'Not available with current selection' : `${getDisplayValue(spec.specKey, value)}${stockInfo > 0 ? ` (${stockInfo} available)` : ''}`}
                    >
                      {getDisplayValue(spec.specKey, value)}
                      
                      {/* Low Stock Badge */}
                      {isCompatible && stockInfo > 0 && stockInfo < 5 && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded">
                          Low
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Stock information */}
              {selectedAttributes[spec.specKey] && (
                <div className="mt-2 text-sm">
                  {isOptionCompatible(spec.specKey, selectedAttributes[spec.specKey]) ? (
                    <span className="text-green-600 font-medium">
                      ✓ In Stock ({availableOptions.find(opt => opt.value === selectedAttributes[spec.specKey])?.stock || 0} available)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Not available with current selection</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default VariantSelectors;