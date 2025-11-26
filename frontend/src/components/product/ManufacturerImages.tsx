// src/components/product/ManufacturerImages.tsx
import React, { useState } from 'react';
import { ProductData } from './productTypes';

interface ManufacturerImagesProps {
  productData: ProductData;
}

const ManufacturerImages: React.FC<ManufacturerImagesProps> = ({ productData }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  if (!productData.manufacturerImages || productData.manufacturerImages.length === 0) {
    return null;
  }

  // Group manufacturer images by sectionTitle
  const groupedImages = productData.manufacturerImages.reduce((acc, image) => {
    const section = image.sectionTitle || 'Product Features';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(image);
    return acc;
  }, {} as Record<string, typeof productData.manufacturerImages>);

  const sections = Object.keys(groupedImages);
  const displaySection = selectedSection || sections[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details & Features</h2>
      <p className="text-gray-600 mb-6">
        High-quality images and information provided by the manufacturer
      </p>

      {/* Section Navigation */}
      {sections.length > 1 && (
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                displaySection === section
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groupedImages[displaySection]?.map((image, index) => (
          <div key={index} className="space-y-3">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-center h-64">
              <img
                src={image.url}
                alt={image.altText}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.jpg';
                }}
              />
            </div>
            {image.altText && (
              <p className="text-sm text-gray-600 text-center">{image.altText}</p>
            )}
          </div>
        ))}
      </div>

      {/* Section Indicator */}
      {sections.length > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {sections.map((section, index) => (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  displaySection === section ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to ${section} section`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerImages;