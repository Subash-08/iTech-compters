import React, { useState } from 'react';
import { Dimensions, Weight } from './productTypes';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ProductDimensionsProps {
  dimensions?: Dimensions;
  weight?: Weight;
}

const ProductDimensions: React.FC<ProductDimensionsProps> = ({ dimensions, weight }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!dimensions && !weight) return null;

  // Check if we have valid dimensions
  const hasValidDimensions = dimensions && 
    (dimensions.length > 0 || dimensions.width > 0 || dimensions.height > 0);

  // Check if we have valid weight
  const hasValidWeight = weight && weight.value > 0;

  // Calculate package dimensions for shipping
  const calculatePackageDimensions = () => {
    if (!hasValidDimensions) return null;
    
    const buffer = 2; // 2cm buffer for packaging
    return {
      length: (dimensions?.length || 0) + buffer,
      width: (dimensions?.width || 0) + buffer,
      height: (dimensions?.height || 0) + buffer,
      unit: dimensions?.unit || 'cm'
    };
  };

  const packageDimensions = calculatePackageDimensions();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-8 bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Package Dimensions & Weight</h3>
            <p className="text-sm text-gray-600 mt-1">Product physical specifications for shipping</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6">
          {/* Dimensions Visualization */}
          {(hasValidDimensions || hasValidWeight) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Dimensions Card */}
              {hasValidDimensions && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Product Dimensions</h4>
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Length</span>
                      <span className="font-medium text-gray-900">
                        {dimensions?.length} {dimensions?.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Width</span>
                      <span className="font-medium text-gray-900">
                        {dimensions?.width} {dimensions?.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Height</span>
                      <span className="font-medium text-gray-900">
                        {dimensions?.height} {dimensions?.unit}
                      </span>
                    </div>
                    {packageDimensions && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">Including packaging:</div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Package Size</span>
                          <span className="font-medium text-gray-900">
                            {packageDimensions.length} × {packageDimensions.width} × {packageDimensions.height} {packageDimensions.unit}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weight Card */}
              {hasValidWeight && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Product Weight</h4>
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Net Weight</span>
                      <span className="font-medium text-gray-900">
                        {weight?.value} {weight?.unit}
                      </span>
                    </div>
                    {/* Estimated Shipping Weight */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Shipping Weight</span>
                      <span className="font-medium text-gray-900">
                        {(weight?.value || 0) * 1.1} {weight?.unit} <span className="text-xs text-gray-500">(estimated)</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Volume Calculation */}
          {hasValidDimensions && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Volume Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Product Volume</div>
                  <div className="font-medium text-gray-900">
                    {(dimensions?.length || 0) * (dimensions?.width || 0) * (dimensions?.height || 0)} cm³
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Shipping Volume</div>
                  <div className="font-medium text-gray-900">
                    {packageDimensions ? (packageDimensions.length * packageDimensions.width * packageDimensions.height) : 0} cm³
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Weight-to-Volume Ratio</div>
                  <div className="font-medium text-gray-900">
                    {hasValidWeight ? (
                      <>{(weight.value / ((dimensions?.length || 1) * (dimensions?.width || 1) * (dimensions?.height || 1))).toFixed(2)} {weight.unit}/cm³</>
                    ) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Information */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Shipping Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ships in original manufacturer packaging</li>
                  <li>• Package includes product, accessories, and manuals</li>
                  <li>• Additional protective packaging added for safe transit</li>
                  <li>• Shipping cost calculated based on package weight and dimensions</li>
                </ul>
       <Link 
  to="/shipping-policy"
  className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 inline-flex items-center"
>
  View shipping details
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
</Link>

              </div>
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default ProductDimensions;