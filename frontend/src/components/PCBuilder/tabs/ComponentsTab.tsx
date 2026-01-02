import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, CircuitBoard, LayoutGrid, Monitor, HardDrive, 
  Zap, Box, Fan, Mouse, Keyboard, Headphones, Speaker 
} from 'lucide-react';
import CategorySection from '../CategorySection';
import { SelectedComponents, Product, PCBuilderConfig, Category } from '../types/pcBuilder';

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
  // 1. State to track which category is currently visible
  const [activeSlug, setActiveSlug] = useState<string>('');

  // 2. Combine all categories for the sidebar list
  const allCategories = useMemo(() => 
    [...config.required, ...config.optional], 
  [config]);

  // 3. Set default active category on load
  useEffect(() => {
    if (allCategories.length > 0 && !activeSlug) {
      setActiveSlug(allCategories[0].slug);
    }
  }, [allCategories, activeSlug]);

  // Helper to find the active category object
  const activeCategory = allCategories.find(c => c.slug === activeSlug);

  // Helper to get icons based on slug
  const getIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('cpu')) return <Cpu size={24} />;
    if (s.includes('motherboard')) return <CircuitBoard size={24} />;
    if (s.includes('memory') || s.includes('ram')) return <LayoutGrid size={24} />;
    if (s.includes('gpu') || s.includes('card')) return <Monitor size={24} />;
    if (s.includes('storage') || s.includes('ssd') || s.includes('hdd')) return <HardDrive size={24} />;
    if (s.includes('power') || s.includes('psu')) return <Zap size={24} />;
    if (s.includes('case') || s.includes('chassis')) return <Box size={24} />;
    if (s.includes('cooler')) return <Fan size={24} />;
    if (s.includes('mouse')) return <Mouse size={24} />;
    if (s.includes('keyboard')) return <Keyboard size={24} />;
    return <Box size={24} />;
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-gray-50 border-t border-gray-200">
      
      {/* --- LEFT SIDEBAR (Category List) --- */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="py-2">
          {allCategories.map((category) => {
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
          })}
        </div>
      </aside>

      {/* --- RIGHT MAIN CONTENT (Product List) --- */}
      <main className="flex-1 overflow-hidden bg-gray-100 relative flex flex-col">
        {activeCategory ? (
          // We use key={activeSlug} to force React to reset the state 
          // (search filters, scroll position) when switching categories.
          <CategorySection 
            key={activeSlug}
            category={activeCategory}
            selectedComponents={selectedComponents}
            onComponentSelect={onComponentSelect}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a category to view products
          </div>
        )}
      </main>
    </div>
  );
};

export default ComponentsTab;