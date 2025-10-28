// src/components/product/ProductFeatures.tsx
import React from 'react';
import { Feature } from './productTypes';

interface ProductFeaturesProps {
  features?: Feature[];
}

const ProductFeatures: React.FC<ProductFeaturesProps> = ({ features }) => {
  if (!features || features.length === 0) return null;

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Key Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
              {feature.description && (
                <p className="text-gray-600 text-sm mt-1">{feature.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductFeatures;