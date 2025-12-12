// src/components/product/ProductSpecifications.tsx
import React from 'react';
import { ShieldCheck, ClipboardList } from 'lucide-react';
import { SpecificationSection } from './productTypes';

interface ProductSpecificationsProps {
  specifications?: SpecificationSection[];
  warranty?: string;
}

const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ 
  specifications, 
  warranty 
}) => {
  // ✅ Validation logic maintained
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
    <div className="w-full font-sans">
      {/* Container */}
      <div className="flex flex-col space-y-10">
        
        {validSpecifications.map((section, sectionIndex) => (
          <div key={sectionIndex} className="break-inside-avoid">
            {/* Section Header */}
            <h3 className="flex items-center text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 tracking-tight">
              {section.sectionTitle || 'General Specifications'}
            </h3>

            {/* Specs Grid */}
            <dl className="space-y-0">
              {section.specs.map((spec, specIndex) => (
                <div 
                  key={specIndex} 
                  className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-150 px-2 rounded-lg"
                >
                  {/* Key (Label) */}
                  <dt className="text-sm font-medium text-gray-500 capitalize sm:col-span-1">
                    {spec.key?.replace(/_/g, ' ') || 'Feature'}
                  </dt>
                  
                  {/* Value */}
                  <dd className="text-sm font-semibold text-gray-900 sm:col-span-2">
                    {spec.value || 'N/A'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Premium Warranty Block */}
      {warranty && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-5 flex items-start space-x-4 shadow-sm">
          <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">
              Warranty Information
            </h4>
            <p className="text-gray-700 font-medium leading-relaxed">
              {warranty}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              For detailed warranty information, please visit the brand's support page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;