import React, { useState, useEffect, useMemo } from 'react';
import { 
  Monitor, Mouse, Keyboard, Headphones, Mic, 
  Volume2, Video, Gamepad2, Check, Circle, AlertCircle, 
  Fan
} from 'lucide-react';
import CategorySection from '../CategorySection';
import { SelectedComponents, Product, PCBuilderConfig } from '../types/pcBuilder';

interface PeripheralsTabProps {
  selectedComponents: SelectedComponents;
  onComponentSelect: (categorySlug: string, product: Product | null) => void;
  config: PCBuilderConfig;
}

const PeripheralsTab: React.FC<PeripheralsTabProps> = ({ 
  selectedComponents, 
  onComponentSelect,
  config 
}) => {
  const [activeSlug, setActiveSlug] = useState<string>('');

  // Filter categories with isPeripheral flag (from backend)
  const peripheralsCategories = useMemo(() => 
    config.optional.filter(cat => cat.isPeripheral === true), 
  [config]);

  // Set initial active category
  useEffect(() => {
    if (peripheralsCategories.length > 0 && !activeSlug) {
      setActiveSlug(peripheralsCategories[0].slug);
    }
  }, [peripheralsCategories, activeSlug]);

  const activeCategory = peripheralsCategories.find(c => c.slug === activeSlug);

  const getCategoryIcon = (slug: string) => {
    switch(slug) {
      case 'monitors': return <Monitor size={24} />;
      case 'mouse': return <Mouse size={24} />;
      case 'keyboard': return <Keyboard size={24} />;
      case 'headset': return <Headphones size={24} />;
      case 'microphone': return <Mic size={24} />;
      case 'speakers': return <Volume2 size={24} />;
      case 'webcam': return <Video size={24} />;
      case 'controller': return <Gamepad2 size={24} />;
      case 'cooler': return <Fan size={24} />;
      case 'cables': return <Video size={24} />; // Note: cables might be in extras or peripherals
      default: return <Monitor size={24} />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-100 border-t border-gray-200">
      
      {/* --- MAIN SPLIT CONTENT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR (Category List) */}
        <aside className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
               <Monitor className="text-orange-500" size={20} />
               <span>Peripherals</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
               Complete your setup with monitors, input devices, and audio.
            </p>
          </div>

          <div className="flex flex-col py-2">
            {peripheralsCategories.length > 0 ? (
              peripheralsCategories.map((category) => {
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
                    <p className="text-sm">No peripheral categories found.</p>
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
               <Monitor className="w-16 h-16 text-gray-200 mb-4" />
               <h3 className="text-lg font-medium text-gray-500">Select a category</h3>
               <p className="text-sm text-gray-400">Choose from the list on the left to add peripherals.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PeripheralsTab;