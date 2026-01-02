import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, CircuitBoard, LayoutGrid, Monitor, HardDrive, 
  Zap, Box, Fan
} from 'lucide-react';
import CategorySection from '../CategorySection';
import { SelectedComponents, Product, PCBuilderConfig } from '../types/pcBuilder';

interface ComponentsTabProps {
  selectedComponents: SelectedComponents;
  onComponentSelect: (categorySlug: string, product: Product | null) => void;
  config: PCBuilderConfig;
}

const ComponentsTab: React.FC<ComponentsTabProps> = ({ 
  selectedComponents, 
  onComponentSelect,
  config
}) => {
  const [activeSlug, setActiveSlug] = useState<string>('');

  // Only show REQUIRED categories in Components tab
  const requiredCategories = useMemo(() => 
    config.required, 
  [config]);

  // Set default active category on load
  useEffect(() => {
    if (requiredCategories.length > 0 && !activeSlug) {
      setActiveSlug(requiredCategories[0].slug);
    }
  }, [requiredCategories, activeSlug]);

  const activeCategory = requiredCategories.find(c => c.slug === activeSlug);

  const getIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('cpu') || s.includes('processor')) return <Cpu size={24} />;
    if (s.includes('motherboard')) return <CircuitBoard size={24} />;
    if (s.includes('memory') || s.includes('ram')) return <LayoutGrid size={24} />;
    if (s.includes('graphics') || s.includes('gpu') || s.includes('card')) return <Monitor size={24} />;
    if (s.includes('ssd') || s.includes('hard-drive') || s.includes('storage')) return <HardDrive size={24} />;
    if (s.includes('psu') || s.includes('power')) return <Zap size={24} />;
    if (s.includes('cabinet') || s.includes('chassis') || s.includes('case')) return <Box size={24} />;
    if (s.includes('cooler')) return <Fan size={24} />;
    return <Box size={24} />;
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-gray-50 border-t border-gray-200">
      
      {/* --- LEFT SIDEBAR (Category List) --- */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Cpu className="text-orange-500" size={20} />
            <span>Core Components</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Select required components for your PC build.
          </p>
        </div>
        
        <div className="py-2">
          {requiredCategories.length > 0 ? (
            requiredCategories.map((category) => {
              const isSelected = activeSlug === category.slug;
              const hasSelection = !!selectedComponents[category.slug];
              const selectedItemName = selectedComponents[category.slug]?.name;

              return (
                <button
                  key={category.slug}
                  onClick={() => setActiveSlug(category.slug)}
                  className={`w-full text-left p-4 flex items-start gap-4 transition-all border-l-4 hover:bg-gray-50
                    ${isSelected 
                      ? 'border-l-orange-500 bg-orange-50/20' 
                      : 'border-l-transparent text-gray-600'
                    }`}
                >
                  {/* Icon */}
                  <div className={`mt-1 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`}>
                    {getIcon(category.slug)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-base ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {category.name}
                    </div>
                    
                    {/* Selection Status */}
                    <div className="mt-1 text-xs font-medium uppercase truncate">
                      {hasSelection ? (
                        <span className="text-green-600 flex items-center gap-1">
                          ✓ {selectedItemName}
                        </span>
                      ) : (
                        <span className="text-gray-400">Please Select</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No required components found.</p>
              <p className="text-xs mt-1">Check backend configuration.</p>
            </div>
          )}
        </div>
      </aside>

      {/* --- RIGHT MAIN CONTENT (Product List) --- */}
      <main className="flex-1 overflow-hidden bg-gray-100 relative flex flex-col">
        {activeCategory ? (
          <CategorySection 
            key={activeSlug}
            category={activeCategory}
            selectedComponents={selectedComponents}
            onComponentSelect={onComponentSelect}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {requiredCategories.length > 0 
              ? 'Select a category to view products' 
              : 'No components categories available'}
          </div>
        )}
      </main>
    </div>
  );
};

export default ComponentsTab;