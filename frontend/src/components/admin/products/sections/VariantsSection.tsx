import React, { useState, useEffect } from 'react';
import { ProductFormData, ProductVariant, IdentifyingAttribute, ImageData } from '../../types/product';

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
  const [newAttribute, setNewAttribute] = useState({ key: '', label: '', value: '' });
  const [newSpec, setNewSpec] = useState({ sectionTitle: '', specKey: '', specLabel: '', possibleValue: '' });
  const [newVariantSpec, setNewVariantSpec] = useState({ sectionTitle: '', key: '', value: '' });
  const [newGalleryImage, setNewGalleryImage] = useState({ url: '', altText: '' });

  // FIX: Auto-detect if product has variants when in edit mode
  useEffect(() => {
    if (isEditMode && formData.variants && formData.variants.length > 0) {
      // If product has variants but hasVariants is false, auto-enable it
      if (!formData.variantConfiguration.hasVariants) {
        updateFormData({
          variantConfiguration: {
            ...formData.variantConfiguration,
            hasVariants: true
          }
        });
      }
    }
  }, [isEditMode, formData.variants, formData.variantConfiguration.hasVariants, updateFormData]);

  // 🆕 NEW: Handle variant gallery images
  const handleVariantGalleryChange = (variantIndex: number, galleryIndex: number, field: string, value: string) => {
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[variantIndex];
    
    if (!variant.images.gallery) {
      variant.images.gallery = [];
    }
    
    const updatedGallery = [...variant.images.gallery];
    updatedGallery[galleryIndex] = {
      ...updatedGallery[galleryIndex],
      [field]: value
    };
    
    variant.images.gallery = updatedGallery;
    updateFormData({ variants: updatedVariants });
  };

  // 🆕 NEW: Add gallery image to variant
  const addVariantGalleryImage = (variantIndex: number) => {
    if (!newGalleryImage.url.trim()) return;
    
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[variantIndex];
    
    if (!variant.images.gallery) {
      variant.images.gallery = [];
    }
    
    variant.images.gallery.push({
      url: newGalleryImage.url,
      altText: newGalleryImage.altText || `Variant ${variant.name || variantIndex + 1} gallery image`
    });
    
    updateFormData({ variants: updatedVariants });
    setNewGalleryImage({ url: '', altText: '' });
  };

  // 🆕 NEW: Remove gallery image from variant
  const removeVariantGalleryImage = (variantIndex: number, galleryIndex: number) => {
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[variantIndex];
    
    if (variant.images.gallery) {
      variant.images.gallery = variant.images.gallery.filter((_, i) => i !== galleryIndex);
      updateFormData({ variants: updatedVariants });
    }
  };

  const handleVariantConfigChange = (field: string, value: any) => {
    const updatedConfig = {
      ...formData.variantConfiguration,
      [field]: value
    };

    // FIX: If disabling variants but variants exist, show confirmation
    if (field === 'hasVariants' && value === false && formData.variants.length > 0) {
      const confirmDisable = window.confirm(
        'This product has existing variants. Disabling variants will remove all variant data. Are you sure?'
      );
      if (!confirmDisable) {
        return; // Don't proceed if user cancels
      }
      
      // Clear variants when disabling variant configuration
      updateFormData({
        variantConfiguration: updatedConfig,
        variants: []
      });
    } else {
      updateFormData({
        variantConfiguration: updatedConfig
      });
    }
  };

  // FIXED: Better variant change handler that preserves all fields
  const handleVariantChange = (index: number, field: string, value: any) => {
    const updatedVariants = [...formData.variants];
    const existingVariant = updatedVariants[index];
    
    // Create updated variant with all existing fields preserved
    const updatedVariant = { 
      ...existingVariant,
      [field]: value
    };
    
    // Ensure _id is preserved for existing variants
    if (existingVariant._id) {
      updatedVariant._id = existingVariant._id;
    }
    if (existingVariant.id) {
      updatedVariant.id = existingVariant.id;
    }
    
    updatedVariants[index] = updatedVariant;
    updateFormData({ variants: updatedVariants });
  };

  // FIXED: Handle nested variant fields (like pricing, stock, etc.)
  const handleVariantNestedChange = (variantIndex: number, parentField: string, field: string, value: any) => {
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[variantIndex];
    
    updatedVariants[variantIndex] = {
      ...variant,
      [parentField]: {
        ...(variant[parentField] || {}),
        [field]: value
      }
    };
    
    updateFormData({ variants: updatedVariants });
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

  // Helper functions for generating unique identifiers
  const generateSKU = () => {
    const baseSKU = formData.sku || 'PROD';
    const variantCount = formData.variants.length + 1;
    return `${baseSKU}-V${variantCount}`;
  };

  const generateBarcode = () => {
    return Date.now().toString() + Math.floor(Math.random() * 1000);
  };

  const addVariant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
          url: formData.images?.thumbnail?.url || '', // Use product thumbnail as default
          altText: formData.images?.thumbnail?.altText || ''
        },
        gallery: [] // 🆕 Start with empty gallery
      },
      isActive: true,
      specifications: []
    };
    
    updateFormData({
      variants: [...formData.variants, newVariant]
    });
  };

  const removeVariant = (index: number) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    updateFormData({ variants: updatedVariants });
  };

  const addAttributeToVariant = (variantIndex: number) => {
    if (!newAttribute.key || !newAttribute.value) return;
    
    const attribute: IdentifyingAttribute = {
      key: newAttribute.key,
      label: newAttribute.label || newAttribute.key,
      value: newAttribute.value,
      displayValue: newAttribute.value.charAt(0).toUpperCase() + newAttribute.value.slice(1),
      hexCode: getColorHexCode(newAttribute.value),
      isColor: newAttribute.key.toLowerCase().includes('color')
    };
    
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].identifyingAttributes.push(attribute);
    updateFormData({ variants: updatedVariants });
    
    setNewAttribute({ key: '', label: '', value: '' });
  };

  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].identifyingAttributes = 
      updatedVariants[variantIndex].identifyingAttributes.filter((_, i) => i !== attrIndex);
    updateFormData({ variants: updatedVariants });
  };

  // Handle variant specifications (the specs array inside each variant)
  const addVariantSpecification = (variantIndex: number) => {
    if (!newVariantSpec.sectionTitle || !newVariantSpec.key || !newVariantSpec.value) return;
    
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[variantIndex];
    
    // Find if section already exists
    let specSection = variant.specifications?.find(s => s.sectionTitle === newVariantSpec.sectionTitle);
    
    if (!specSection) {
      // Create new section
      specSection = {
        sectionTitle: newVariantSpec.sectionTitle,
        specs: []
      };
      if (!variant.specifications) variant.specifications = [];
      variant.specifications.push(specSection);
    }
    
    // Add spec to section
    specSection.specs.push({
      key: newVariantSpec.key,
      value: newVariantSpec.value
    });
    
    updateFormData({ variants: updatedVariants });
    setNewVariantSpec({ sectionTitle: '', key: '', value: '' });
  };

  const removeVariantSpecification = (variantIndex: number, sectionIndex: number, specIndex: number) => {
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[variantIndex];
    
    if (variant.specifications && variant.specifications[sectionIndex]) {
      variant.specifications[sectionIndex].specs = 
        variant.specifications[sectionIndex].specs.filter((_, i) => i !== specIndex);
      
      // Remove section if empty
      if (variant.specifications[sectionIndex].specs.length === 0) {
        variant.specifications = variant.specifications.filter((_, i) => i !== sectionIndex);
      }
      
      updateFormData({ variants: updatedVariants });
    }
  };

  // Helper function to generate color hex codes
  function getColorHexCode(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'red': '#dc2626',
      'blue': '#2563eb',
      'green': '#16a34a',
      'yellow': '#ca8a04',
      'black': '#000000',
      'white': '#ffffff',
      'gray': '#6b7280',
      'purple': '#9333ea',
      'pink': '#db2777',
      'orange': '#ea580c',
      'space black': '#1D1D1F',
      'silver': '#E2E2E2',
      'space gray': '#535353',
      'gold': '#ffd700',
      'rose gold': '#b76e79'
    };
    
    return colorMap[colorName.toLowerCase()] || '#6b7280';
  }

  // Prevent form submission on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Calculate total variants stock for display
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

      {/* Variant Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-md font-medium text-gray-900">Variant Configuration</h3>
            <p className="text-sm text-gray-600">
              {isEditMode ? 'Configure product variants' : 'Configure how variants work for this product'}
            </p>
            {/* FIX: Show warning if product has variants but hasVariants is disabled */}
            {isEditMode && formData.variants.length > 0 && !formData.variantConfiguration.hasVariants && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                ⚠️ This product has {formData.variants.length} variants but variant configuration is disabled. 
                Enable variants to manage them.
              </div>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasVariants"
              checked={formData.variantConfiguration.hasVariants || (isEditMode && formData.variants.length > 0)}
              onChange={(e) => handleVariantConfigChange('hasVariants', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasVariants" className="ml-2 text-sm text-gray-700">
              This product has variants
              {isEditMode && formData.variants.length > 0 && (
                <span className="ml-1 text-xs text-green-600">
                  ({formData.variants.length} detected)
                </span>
              )}
            </label>
          </div>
        </div>

        {formData.variantConfiguration.hasVariants && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Variant Creating Specs */}
            {(formData.variantConfiguration.variantType === 'Specifications' || 
              formData.variantConfiguration.variantType === 'Mixed') && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Variant Specifications</h4>
                  <button
                    type="button"
                    onClick={addVariantCreatingSpec}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Add Spec
                  </button>
                </div>

                {formData.variantConfiguration.variantCreatingSpecs?.map((spec, specIndex) => (
                  <div key={specIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-medium text-gray-900">Spec {specIndex + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeVariantCreatingSpec(specIndex)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={spec.sectionTitle || ''}
                          onChange={(e) => handleVariantSpecChange(specIndex, 'sectionTitle', e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="e.g., Memory"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Spec Key
                        </label>
                        <input
                          type="text"
                          value={spec.specKey || ''}
                          onChange={(e) => handleVariantSpecChange(specIndex, 'specKey', e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="e.g., ram"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Spec Label
                        </label>
                        <input
                          type="text"
                          value={spec.specLabel || ''}
                          onChange={(e) => handleVariantSpecChange(specIndex, 'specLabel', e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="e.g., RAM"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Possible Values
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={newSpec.possibleValue}
                          onChange={(e) => setNewSpec(prev => ({ ...prev, possibleValue: e.target.value }))}
                          onKeyDown={handleKeyDown}
                          placeholder="e.g., 8GB"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => addPossibleValue(specIndex, newSpec.possibleValue)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {spec.possibleValues?.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-center bg-gray-100 px-3 py-1 rounded text-sm">
                            {value}
                            <button
                              type="button"
                              onClick={() => removePossibleValue(specIndex, valueIndex)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variants List */}
      {formData.variantConfiguration.hasVariants && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">
              Variants {formData.variants.length > 0 && `(${formData.variants.length})`}
            </h3>
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add Variant
            </button>
          </div>

          {formData.variants.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mb-2">No variants added yet</p>
              <p className="text-sm text-gray-500">Click "Add Variant" to create your first product variant</p>
            </div>
          ) : (
            formData.variants.map((variant, variantIndex) => (
              <div key={variant._id || variantIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Variant {variantIndex + 1}
                      {variant._id && (
                        <span className="ml-2 text-xs text-gray-500">(ID: {variant._id})</span>
                      )}
                    </h4>
                    {variant.name && (
                      <p className="text-sm text-gray-600">{variant.name}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant Name *
                    </label>
                    <input
                      type="text"
                      value={variant.name || ''}
                      onChange={(e) => handleVariantChange(variantIndex, 'name', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., MacBook Pro 16-inch - M3 Pro - 1TB - Space Black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={variant.sku || ''}
                      onChange={(e) => handleVariantChange(variantIndex, 'sku', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., MBP16-M3P-1TB-BLK"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode *
                    </label>
                    <input
                      type="text"
                      value={variant.barcode || ''}
                      onChange={(e) => handleVariantChange(variantIndex, 'barcode', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 194253058802"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be unique for each variant
                    </p>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={variant.price || ''}
                      onChange={(e) => handleVariantChange(variantIndex, 'price', parseFloat(e.target.value) || 0)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2499"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Price ($)
                    </label>
                    <input
                      type="number"
                      value={variant.offerPrice || ''}
                      onChange={(e) => handleVariantChange(variantIndex, 'offerPrice', parseFloat(e.target.value) || 0)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2399"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={variant.stockQuantity || ''}
                      onChange={(e) => handleVariantChange(variantIndex, 'stockQuantity', parseInt(e.target.value) || 0)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`variant-active-${variantIndex}`}
                      checked={variant.isActive !== false}
                      onChange={(e) => handleVariantChange(variantIndex, 'isActive', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`variant-active-${variantIndex}`} className="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                {/* Identifying Attributes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifying Attributes
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newAttribute.key}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, key: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      placeholder="Attribute key (e.g., color)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={newAttribute.label}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, label: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      placeholder="Display label (e.g., Color)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={newAttribute.value}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      placeholder="Value (e.g., space-black)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => addAttributeToVariant(variantIndex)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variant.identifyingAttributes?.map((attr, attrIndex) => (
                      <div key={attrIndex} className="flex items-center bg-blue-100 px-3 py-1 rounded text-sm">
                        <span className="font-medium">{attr.label}:</span>
                        <span className="ml-1">{attr.value}</span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(variantIndex, attrIndex)}
                          className="ml-2 text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🆕 ENHANCED: Variant Images with Gallery Support */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variant Images
                  </label>
                  
                  {/* Thumbnail Section */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Thumbnail Image</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Thumbnail URL</label>
                        <input
                          type="text"
                          value={variant.images?.thumbnail?.url || ''}
                          onChange={(e) => handleVariantNestedChange(variantIndex, 'images', 'thumbnail', {
                            ...variant.images?.thumbnail,
                            url: e.target.value
                          })}
                          onKeyDown={handleKeyDown}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Alt Text</label>
                        <input
                          type="text"
                          value={variant.images?.thumbnail?.altText || ''}
                          onChange={(e) => handleVariantNestedChange(variantIndex, 'images', 'thumbnail', {
                            ...variant.images?.thumbnail,
                            altText: e.target.value
                          })}
                          onKeyDown={handleKeyDown}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Product variant image"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images Section */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Gallery Images</h5>
                    
                    {/* Add New Gallery Image */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                          <input
                            type="text"
                            value={newGalleryImage.url}
                            onChange={(e) => setNewGalleryImage(prev => ({ ...prev, url: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="https://example.com/gallery-image.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Alt Text</label>
                          <input
                            type="text"
                            value={newGalleryImage.altText}
                            onChange={(e) => setNewGalleryImage(prev => ({ ...prev, altText: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Description of the image"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addVariantGalleryImage(variantIndex)}
                        disabled={!newGalleryImage.url.trim()}
                        className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Gallery Image
                      </button>
                    </div>

                    {/* Gallery Images List */}
                    <div className="space-y-3">
                      {variant.images.gallery && variant.images.gallery.length > 0 ? (
                        variant.images.gallery.map((galleryImage, galleryIndex) => (
                          <div key={galleryIndex} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
                            {/* Image Preview */}
                            <div className="flex-shrink-0">
                              {galleryImage.url ? (
                                <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                                  <img
                                    src={galleryImage.url}
                                    alt="Gallery preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                  <span className="text-xs text-gray-500">No image</span>
                                </div>
                              )}
                            </div>

                            {/* Image Inputs */}
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                                <input
                                  type="text"
                                  value={galleryImage.url}
                                  onChange={(e) => handleVariantGalleryChange(variantIndex, galleryIndex, 'url', e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Alt Text</label>
                                <input
                                  type="text"
                                  value={galleryImage.altText}
                                  onChange={(e) => handleVariantGalleryChange(variantIndex, galleryIndex, 'altText', e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder="Description of the image"
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => removeVariantGalleryImage(variantIndex, galleryIndex)}
                              className="px-3 py-1 text-red-600 hover:text-red-700 text-sm border border-red-300 rounded hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-sm text-gray-500">No gallery images added</p>
                          <p className="text-xs text-gray-400 mt-1">Add images using the form above</p>
                        </div>
                      )}
                    </div>

                    {/* Gallery Stats */}
                    {variant.images.gallery && variant.images.gallery.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {variant.images.gallery.length} gallery image{variant.images.gallery.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VariantsSection;