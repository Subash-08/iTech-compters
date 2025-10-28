// src/components/product/ProductDimensions.tsx
import React from 'react';
import { Dimensions, Weight } from './productTypes';

interface ProductDimensionsProps {
  dimensions?: Dimensions;
  weight?: Weight;
}

const ProductDimensions: React.FC<ProductDimensionsProps> = ({ dimensions, weight }) => {
  if (!dimensions && !weight) return null;

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Specifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {dimensions && (
          <div>
            <span className="text-gray-600">Dimensions: </span>
            <span className="font-medium">
              {dimensions.length} × {dimensions.width} × {dimensions.height} {dimensions.unit}
            </span>
          </div>
        )}
        {weight && (
          <div>
            <span className="text-gray-600">Weight: </span>
            <span className="font-medium">
              {weight.value} {weight.unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDimensions;