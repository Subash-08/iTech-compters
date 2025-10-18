import React, { useState, useEffect } from 'react';
import { ProductFormData } from '../../types/product';

interface DimensionsWeightSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditing?: boolean;
}

const DimensionsWeightSection: React.FC<DimensionsWeightSectionProps> = ({
  formData,
  updateFormData,
  isEditing = false
}) => {
  const [showConversions, setShowConversions] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    dimensions: { ...formData.dimensions },
    weight: { ...formData.weight },
    warranty: formData.warranty
  });

  // Store original values when component mounts in edit mode
  useEffect(() => {
    if (isEditing) {
      setOriginalValues({
        dimensions: { ...formData.dimensions },
        weight: { ...formData.weight },
        warranty: formData.warranty
      });
    }
  }, [isEditing]);

  const handleDimensionsChange = (field: string, value: any) => {
    updateFormData({
      dimensions: {
        ...formData.dimensions,
        [field]: value
      }
    });
  };

  const handleWeightChange = (field: string, value: any) => {
    updateFormData({
      weight: {
        ...formData.weight,
        [field]: value
      }
    });
  };

  const handleWarrantyChange = (value: string) => {
    updateFormData({ warranty: value });
  };

  const resetToOriginal = () => {
    updateFormData({
      dimensions: { ...originalValues.dimensions },
      weight: { ...originalValues.weight },
      warranty: originalValues.warranty
    });
  };

  const hasChanges = () => {
    return (
      formData.dimensions.length !== originalValues.dimensions.length ||
      formData.dimensions.width !== originalValues.dimensions.width ||
      formData.dimensions.height !== originalValues.dimensions.height ||
      formData.dimensions.unit !== originalValues.dimensions.unit ||
      formData.weight.value !== originalValues.weight.value ||
      formData.weight.unit !== originalValues.weight.unit ||
      formData.warranty !== originalValues.warranty
    );
  };

  const getPackageType = (volume: number, weight: number, unit: string): string => {
    const volumeInCm3 = unit === 'm' ? volume * 1000000 : unit === 'in' ? volume * 16.387 : volume;
    const weightInKg = convertWeight(weight, unit, 'kg');
    
    if (volumeInCm3 < 1000 && weightInKg < 0.5) return 'Small Packet';
    if (volumeInCm3 < 5000 && weightInKg < 2) return 'Standard Package';
    if (volumeInCm3 < 25000 && weightInKg < 10) return 'Medium Package';
    if (volumeInCm3 < 50000 && weightInKg < 25) return 'Large Package';
    return 'Oversized Package';
  };

  const getShippingCostEstimate = (volume: number, weight: number, unit: string): string => {
    const packageType = getPackageType(volume, weight, unit);
    const weightInKg = convertWeight(weight, unit, 'kg');
    
    const estimates: { [key: string]: string } = {
      'Small Packet': '$5 - $15',
      'Standard Package': '$10 - $25',
      'Medium Package': '$20 - $50',
      'Large Package': '$40 - $100',
      'Oversized Package': '$75+'
    };
    
    return estimates[packageType] || 'Contact for quote';
  };

  const commonWarrantyOptions = [
    '30 days return policy',
    '90 days limited warranty',
    '1 year manufacturer warranty',
    '2 years manufacturer warranty',
    '3 years extended warranty',
    'Lifetime warranty',
    'No warranty'
  ];

  const commonProductPresets = {
    'Smartphone': { length: 15, width: 7, height: 0.8, unit: 'cm', weight: 180, weightUnit: 'g' },
    'Laptop': { length: 35, width: 25, height: 2, unit: 'cm', weight: 1.5, weightUnit: 'kg' },
    'Tablet': { length: 25, width: 17, height: 0.7, unit: 'cm', weight: 500, weightUnit: 'g' },
    'Book': { length: 23, width: 15, height: 2, unit: 'cm', weight: 0.4, weightUnit: 'kg' },
    'Shoes': { length: 30, width: 20, height: 12, unit: 'cm', weight: 1.2, weightUnit: 'kg' }
  };

  const applyPreset = (presetName: string) => {
    const preset = commonProductPresets[presetName as keyof typeof commonProductPresets];
    if (preset) {
      updateFormData({
        dimensions: {
          length: preset.length,
          width: preset.width,
          height: preset.height,
          unit: preset.unit
        },
        weight: {
          value: preset.weight,
          unit: preset.weightUnit
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dimensions, Weight & Warranty</h2>
        {isEditing && hasChanges() && (
          <button
            type="button"
            onClick={resetToOriginal}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Reset Changes
          </button>
        )}
      </div>

      {/* Edit Mode Notice */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-blue-800">Edit Mode</span>
              <p className="text-sm text-blue-700 mt-1">
                Accurate dimensions and weight help customers understand your product size and calculate shipping costs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets - Only show in create mode or when no data exists */}
      {(!isEditing || (formData.dimensions.length === 0 && formData.weight.value === 0)) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Quick Presets</h3>
          <p className="text-sm text-green-700 mb-3">
            Start with common product dimensions and weight:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(commonProductPresets).map((presetName) => (
              <button
                key={presetName}
                type="button"
                onClick={() => applyPreset(presetName)}
                className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg border border-green-300 hover:bg-green-200 transition-colors"
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dimensions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900">Dimensions</h3>
          {isEditing && (
            <div className="text-sm text-gray-500">
              Volume: {calculateVolume(formData.dimensions).toFixed(2)} {formData.dimensions.unit}³
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="flex">
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.dimensions.length || ''}
                onChange={(e) => handleDimensionsChange('length', parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!isEditing}
              />
              <select
                value={formData.dimensions.unit}
                onChange={(e) => handleDimensionsChange('unit', e.target.value)}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
                <option value="m">m</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="flex">
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.dimensions.width || ''}
                onChange={(e) => handleDimensionsChange('width', parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!isEditing}
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-500 flex items-center min-w-12 justify-center">
                {formData.dimensions.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="flex">
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.dimensions.height || ''}
                onChange={(e) => handleDimensionsChange('height', parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!isEditing}
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-500 flex items-center min-w-12 justify-center">
                {formData.dimensions.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-center">
              <div className="font-semibold">{calculateVolume(formData.dimensions).toFixed(2)}</div>
              <div className="text-xs text-gray-500">{formData.dimensions.unit}³</div>
            </div>
          </div>
        </div>

        {/* Dimension Conversions */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowConversions(!showConversions)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            {showConversions ? 'Hide' : 'Show'} Unit Conversions
            <svg className={`w-4 h-4 ml-1 transition-transform ${showConversions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showConversions && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Dimension Conversions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">In Centimeters:</span>
                  <div className="font-medium">{convertDimensions(formData.dimensions, 'cm').toFixed(1)} cm³</div>
                </div>
                <div>
                  <span className="text-gray-600">In Inches:</span>
                  <div className="font-medium">{convertDimensions(formData.dimensions, 'in').toFixed(1)} in³</div>
                </div>
                <div>
                  <span className="text-gray-600">In Meters:</span>
                  <div className="font-medium">{convertDimensions(formData.dimensions, 'm').toFixed(3)} m³</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weight */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Weight</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="flex">
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight.value || ''}
                onChange={(e) => handleWeightChange('value', parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!isEditing}
              />
              <select
                value={formData.weight.unit}
                onChange={(e) => handleWeightChange('unit', e.target.value)}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="lb">lb</option>
                <option value="oz">oz</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Conversions
            </label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Kilograms:</span>
                <span className="font-medium">{convertWeight(formData.weight.value, formData.weight.unit, 'kg').toFixed(3)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pounds:</span>
                <span className="font-medium">{convertWeight(formData.weight.value, formData.weight.unit, 'lb').toFixed(3)} lb</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ounces:</span>
                <span className="font-medium">{convertWeight(formData.weight.value, formData.weight.unit, 'oz').toFixed(1)} oz</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Estimate */}
      {(formData.dimensions.length > 0 && formData.dimensions.width > 0 && formData.dimensions.height > 0 && formData.weight.value > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Shipping Estimate</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-yellow-700">Package Type:</span>
              <div className="font-medium text-yellow-800">
                {getPackageType(
                  calculateVolume(formData.dimensions),
                  formData.weight.value,
                  formData.dimensions.unit
                )}
              </div>
            </div>
            <div>
              <span className="text-yellow-700">Estimated Shipping:</span>
              <div className="font-medium text-yellow-800">
                {getShippingCostEstimate(
                  calculateVolume(formData.dimensions),
                  formData.weight.value,
                  formData.dimensions.unit
                )}
              </div>
            </div>
            <div>
              <span className="text-yellow-700">Weight Class:</span>
              <div className="font-medium text-yellow-800">
                {convertWeight(formData.weight.value, formData.weight.unit, 'kg') < 1 ? 'Light' : 
                 convertWeight(formData.weight.value, formData.weight.unit, 'kg') < 5 ? 'Medium' : 'Heavy'}
              </div>
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-2">
            * This is an estimate. Actual shipping costs may vary based on carrier and destination.
          </p>
        </div>
      )}

      {/* Warranty */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900">Warranty Information</h3>
          {isEditing && formData.warranty && (
            <span className="text-sm text-green-600 font-medium">✓ Set</span>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warranty Description {!isEditing && '(Recommended)'}
            </label>
            <input
              type="text"
              value={formData.warranty}
              onChange={(e) => handleWarrantyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2 years manufacturer warranty, Lifetime support, 90 days return policy"
            />
          </div>

          {/* Quick Warranty Options */}
          {(!isEditing || !formData.warranty) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Common Warranty Options
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {commonWarrantyOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleWarrantyChange(option)}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 text-left transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Clear warranty information helps build trust with customers and can reduce support inquiries.
        </p>
      </div>

      {/* Summary for Edit Mode */}
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Current Values</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Dimensions:</span>
              <div className="font-medium">
                {formData.dimensions.length} × {formData.dimensions.width} × {formData.dimensions.height} {formData.dimensions.unit}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Weight:</span>
              <div className="font-medium">
                {formData.weight.value} {formData.weight.unit}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Warranty:</span>
              <div className="font-medium">
                {formData.warranty || 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const calculateVolume = (dimensions: { length: number; width: number; height: number; unit: string }) => {
  return dimensions.length * dimensions.width * dimensions.height;
};

const convertWeight = (value: number, fromUnit: string, toUnit: string): number => {
  const conversions: { [key: string]: number } = {
    g: 1,
    kg: 1000,
    lb: 453.592,
    oz: 28.3495
  };

  const valueInGrams = value * conversions[fromUnit];
  return valueInGrams / conversions[toUnit];
};

const convertDimensions = (dimensions: { length: number; width: number; height: number; unit: string }, toUnit: string): number => {
  const conversionFactors: { [key: string]: number } = {
    cm: 1,
    in: 0.393701,
    m: 0.01
  };

  const factor = conversionFactors[toUnit] / conversionFactors[dimensions.unit];
  return dimensions.length * dimensions.width * dimensions.height * Math.pow(factor, 3);
};

export default DimensionsWeightSection;