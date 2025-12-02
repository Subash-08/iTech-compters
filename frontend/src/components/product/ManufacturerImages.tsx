import React, { useState } from 'react';
import { ProductData } from './productTypes';

interface ManufacturerImagesProps {
  productData: ProductData;
}

const ManufacturerImages: React.FC<ManufacturerImagesProps> = ({ productData }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // 🎯 FIXED: Clean URL transformation
  const getImageUrl = (url: string | undefined): string => {
    if (!url || url.startsWith('blob:')) {
      // Return placeholder SVG
      return `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
          <rect width="400" height="300" fill="#f3f4f6"/>
          <rect x="100" y="75" width="200" height="150" fill="#e5e7eb"/>
          <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">Manufacturer Image</text>
          <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">Not Available</text>
        </svg>
      `)}`;
    }

    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        let filename = '';
    
    if (url.includes('/')) {
      filename = url.split('/').pop() || url;
    } else {
      filename = url;
    }
    const correctUrl = `${baseUrl}/uploads/products/${filename}`;
    return correctUrl;
  };

  // Test URL on component mount
  React.useEffect(() => {
    if (productData.manufacturerImages) {
      productData.manufacturerImages.forEach((img, index) => {
        if (img.url && !img.url.startsWith('blob:')) {
          const testUrl = getImageUrl(img.url);
        }
      });
    }
  }, [productData.manufacturerImages]);

  if (!productData.manufacturerImages || productData.manufacturerImages.length === 0) {
    return null;
  }

  // Create enhanced images with correct URLs
  const enhancedManufacturerImages = productData.manufacturerImages
    .filter(img => img.url && !img.url.startsWith('blob:'))
    .map(img => {
      const resolvedUrl = getImageUrl(img.url);
      return {
        ...img,
        resolvedUrl: resolvedUrl,
        // Extract just filename for debugging
        filename: img.url ? img.url.split('/').pop() : ''
      };
    });

  if (enhancedManufacturerImages.length === 0) {
    return null;
  }

  // Group manufacturer images by sectionTitle
  const groupedImages = enhancedManufacturerImages.reduce((acc, image) => {
    const section = image.sectionTitle || 'Product Features';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(image);
    return acc;
  }, {} as Record<string, typeof enhancedManufacturerImages>);

  const sections = Object.keys(groupedImages);
  const displaySection = selectedSection || sections[0];

  // Simple error handler - just use placeholder on error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, originalUrl: string) => {
    const target = e.currentTarget as HTMLImageElement;
    console.error('❌ Manufacturer image failed to load:', target.src);
    
    // Use placeholder
    target.src = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <rect x="100" y="75" width="200" height="150" fill="#e5e7eb"/>
        <text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">Failed to load</text>
        <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">URL: ${target.src.substring(0, 50)}...</text>
      </svg>
    `)}`;
  };

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
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-center h-64 min-h-[16rem] relative">
              <img
                src={image.resolvedUrl}
                alt={image.altText}
                className="max-h-full max-w-full object-contain"
                onError={(e) => handleImageError(e, image.url || '')}
                onLoad={() => {
                }}
              />
            </div>
            {image.altText && (
              <p className="text-sm text-gray-600 text-center">{image.altText}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManufacturerImages;