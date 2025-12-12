import React, { useState } from 'react';
import { Feature } from './productTypes';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductFeaturesProps {
  features?: Feature[];
}

const ProductFeatures: React.FC<ProductFeaturesProps> = ({ features }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!features || features.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-12 bg-white rounded-xl shadow-soft border border-gray-100 p-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">About this item</h2>
          <p className="text-sm text-gray-600 mt-1">Key features and specifications</p>
        </div>
        <div className="text-sm text-gray-500">
          {features.length} features
        </div>
      </div>

      {/* Features Grid - Amazon Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-4 rounded-lg border transition-all duration-200 ${
              expandedIndex === index 
                ? 'border-blue-200 bg-blue-50 shadow-sm' 
                : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            {/* Feature Header */}
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex items-start justify-between w-full text-left focus:outline-none group"
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  expandedIndex === index 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-500'
                }`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* Feature Title */}
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  {feature.description && (
                    <AnimatePresence>
                      {expandedIndex === index && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-600 text-sm mt-2 leading-relaxed"
                        >
                          {feature.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Expand/Collapse Icon */}
              {feature.description && (
                <motion.div
                  animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-gray-400 group-hover:text-blue-500 ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              )}
            </button>

            {/* Compact Description (visible when not expanded) */}
            {feature.description && expandedIndex !== index && (
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {feature.description}
              </p>
            )}

            {/* Hover Effect Border */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-lg transition-colors pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* View All Features Button */}
      {features.length > 4 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 mx-auto">
            View all {features.length} features
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Highlights Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Product Highlights
        </h4>
        <div className="flex flex-wrap gap-2">
          {features.slice(0, 3).map((feature, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:border-gray-300 transition-colors"
            >
              <svg className="w-3 h-3 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature.title}
            </span>
          ))}
          {features.length > 3 && (
            <span className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-500 text-sm font-medium rounded-full">
              +{features.length - 3} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductFeatures;