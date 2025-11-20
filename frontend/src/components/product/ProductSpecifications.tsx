// src/components/product/ProductSpecifications.tsx
import React from 'react';
import { SpecificationSection } from './productTypes';

interface ProductSpecificationsProps {
  specifications?: SpecificationSection[];
  warranty?: string;
}

const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ 
  specifications, 
  warranty 
}) => {
  // 🆕 Better validation for specifications
  const validSpecifications = specifications?.filter(section => 
    section && 
    section.specs && 
    Array.isArray(section.specs) && 
    section.specs.length > 0
  ) || [];

  if (validSpecifications.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Specifications</h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {validSpecifications.map((section, index) => (
          <div
            key={index}
            className={`grid grid-cols-1 md:grid-cols-4 ${
              index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <div className="md:col-span-1 px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
              {section.sectionTitle || 'General'}
            </div>
            <div className="md:col-span-3 px-6 py-4">
              <div className="space-y-2">
                {section.specs.map((spec, specIndex) => (
                  <div key={specIndex} className="flex justify-between">
                    <span className="text-gray-600 capitalize">
                      {spec.key?.replace(/_/g, ' ') || 'Unknown'}:
                    </span>
                    <span className="text-gray-900 font-medium">{spec.value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {warranty && (
        <div className="mt-4 text-sm text-gray-600">
          <strong>Warranty:</strong> {warranty}
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;