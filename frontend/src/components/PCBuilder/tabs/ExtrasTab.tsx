import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Wifi, Wind, Wrench, Check, Circle, AlertCircle, Package } from 'lucide-react';
import CategorySection from '../CategorySection';
import { SelectedComponents, Product, PCBuilderConfig } from '../types/pcBuilder';

interface ExtrasTabProps {
  selectedComponents: SelectedComponents;
  onComponentSelect: (categorySlug: string, product: Product | null) => void;
  config: PCBuilderConfig;
}

const ExtrasTab: React.FC<ExtrasTabProps> = ({ 
  selectedComponents, 
  onComponentSelect,
  config 
}) => {
  const [activeSlug, setActiveSlug] = useState<string>('');

  // Filter categories that are NOT peripherals
  const extrasCategories = useMemo(() => 
    config.optional.filter(cat => cat.isPeripheral === false), 
  [config]);

  // Set the first category as active on load
  useEffect(() => {
    if (extrasCategories.length > 0 && !activeSlug) {
      setActiveSlug(extrasCategories[0].slug);
    }
  }, [extrasCategories, activeSlug]);

  const activeCategory = extrasCategories.find(c => c.slug === activeSlug);

  const getCategoryIcon = (slug: string) => {
    switch(slug) {
      case 'assembly': return <Wrench size={24} />;
      case 'case-fans': return <Wind size={24} />;
      case 'wifi-adapters': return <Wifi size={24} />;
      case 'cables': return <Package size={24} />;
      case 'adapter': return <Package size={24} />;
      default: return <Settings size={24} />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-100 border-t border-gray-200">
      
      {/* --- MAIN SPLIT CONTENT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR (Extras List) */}
        <aside className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          
          {/* Header for Sidebar */}
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
               <Settings className="text-orange-500" size={20} />
               <span>Optional Extras</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
               Enhance your build with cooling, wifi, cables, and professional assembly.
            </p>
          </div>

          <div className="flex flex-col py-2">
            {extrasCategories.length > 0 ? (
              extrasCategories.map((category) => {
                const isSelected = activeSlug === category.slug;
                const selectedItem = selectedComponents[category.slug];

                return (
                  <button
                    key={category.slug}
                    onClick={() => setActiveSlug(category.slug)}
                    className={`relative w-full text-left p-4 flex items-start gap-4 transition-all border-l-4 hover:bg-gray-50
                      ${isSelected 
                        ? 'border-l-orange-500 bg-orange-50/20' 
                        : 'border-l-transparent text-gray-600'
                      }`}
                  >
                    {/* Icon */}
                    <div className={`mt-1 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`}>
                      {getCategoryIcon(category.slug)}
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-base ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {category.name}
                      </div>
                      
                      {/* Selection Status */}
                      <div className="mt-1 text-xs font-medium uppercase truncate">
                        {selectedItem ? (
                          <span className="text-green-600 flex items-center gap-1">
                             <Check size={12} /> {selectedItem.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1">
                             <Circle size={10} /> Not Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
                <div className="p-8 text-center text-gray-400">
                    <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">No extra categories found.</p>
                </div>
            )}
          </div>
        </aside>

        {/* RIGHT CONTENT AREA (Product List) */}
        <main className="flex-1 overflow-y-auto bg-gray-100 relative">
          {activeCategory ? (
            <div className="p-4 max-w-5xl mx-auto h-full">
               <CategorySection
                  key={activeSlug}
                  category={activeCategory}
                  selectedComponents={selectedComponents}
                  onComponentSelect={onComponentSelect}
                />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
               <Settings className="w-16 h-16 text-gray-200 mb-4" />
               <h3 className="text-lg font-medium text-gray-500">Select an extra category</h3>
               <p className="text-sm text-gray-400">Choose from the list on the left to add extras.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ExtrasTab;