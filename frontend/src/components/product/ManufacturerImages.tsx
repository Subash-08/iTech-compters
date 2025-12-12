import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Info } from 'lucide-react';
import { ProductData } from './productTypes';
import { baseURL } from '../config/config';

interface ManufacturerImagesProps {
  productData: ProductData;
}

const ManufacturerImages: React.FC<ManufacturerImagesProps> = ({ productData }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // 🛠 HELPER: Robust URL Resolver
  const getImageUrl = (url: string | undefined): string => {
    if (!url || url.startsWith('blob:')) return ''; // Return empty to trigger error handler naturally
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) return url;

    // Construct backend URL
    const baseUrl = process.env.REACT_APP_API_URL || baseURL;
    const filename = url.includes('/') ? url.split('/').pop() || url : url;
    return `${baseUrl}/uploads/products/${filename}`;
  };

  // 🧠 MEMOIZED DATA PROCESSING
  const { groupedImages, sections, hasImages } = useMemo(() => {
    if (!productData.manufacturerImages || productData.manufacturerImages.length === 0) {
      return { groupedImages: {}, sections: [], hasImages: false };
    }

    // Filter valid images
    const validImages = productData.manufacturerImages
      .filter(img => img.url && !img.url.startsWith('blob:'))
      .map(img => ({
        ...img,
        resolvedUrl: getImageUrl(img.url)
      }));

    if (validImages.length === 0) {
      return { groupedImages: {}, sections: [], hasImages: false };
    }

    // Group by section
    const grouped = validImages.reduce((acc, image) => {
      const section = image.sectionTitle?.trim() || 'Product Overview';
      if (!acc[section]) acc[section] = [];
      acc[section].push(image);
      return acc;
    }, {} as Record<string, typeof validImages>);

    return { 
      groupedImages: grouped, 
      sections: Object.keys(grouped), 
      hasImages: true 
    };
  }, [productData.manufacturerImages]);

  // Set default section on load
  React.useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

  if (!hasImages) return null;

  const currentImages = selectedSection ? groupedImages[selectedSection] : [];

  return (
    <div className="w-full mt-12 overflow-hidden">
      
      {/* 1️⃣ Header Block */}
      <div className="p-8 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
          <ImageIcon className="w-6 h-6 mr-3 text-blue-600" />
          From the Manufacturer
        </h2>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Visual details and specifications provided directly by the brand.
        </p>

        {/* 2️⃣ Premium Tab Navigation */}
        {sections.length > 1 && (
          <div className="flex space-x-8 mt-8 border-b border-gray-100 overflow-x-auto no-scrollbar">
            {sections.map((section) => {
              const isActive = selectedSection === section;
              return (
                <button
                  key={section}
                  onClick={() => setSelectedSection(section)}
                  className={`
                    relative pb-4 text-sm font-semibold transition-colors whitespace-nowrap
                    ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}
                  `}
                >
                  {section}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3️⃣ Content Area - Full Width */}
      <div className="bg-gray-50/50 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSection || 'default'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {currentImages?.map((image, index) => (
              <div 
                key={index} 
                className="group w-full transition-shadow duration-300 mb-2 last:mb-0"
              >
                {/* Full Width Image Container */}
                <div className="relative w-full bg-white flex items-center justify-center overflow-hidden">
                  {/* Full Width Image */}
                  <img
                    src={image.resolvedUrl}
                    alt={image.altText || 'Manufacturer Image'}
                    className="w-full h-auto max-h-[500px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => {
                      // Fallback Placeholder
                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
                          <rect width="1200" height="500" fill="#f9fafb"/>
                          <rect x="400" y="150" width="400" height="200" fill="#e5e7eb" rx="8"/>
                          <text x="600" y="300" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#9ca3af">Manufacturer Image</text>
                        </svg>
                      `)}`;
                    }}
                  />
                </div>
                

              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ManufacturerImages;