import React, { useMemo } from 'react';
import { 
  Plus, Edit2, 
  Cpu, Monitor, HardDrive, 
  LayoutGrid, CircuitBoard, Box, Fan, Mouse, Keyboard,
  Zap, Headphones, Speaker,
  Video,
  Printer
} from 'lucide-react';
import { SelectedComponents, PCBuilderConfig } from '../types/pcBuilder';
import { getImageUrl } from '../../utils/imageUtils';

interface OverviewTabProps {
  selectedComponents: SelectedComponents;
  config: PCBuilderConfig;
  onTabChange: (tab: string) => void;
  onNavigateToCategory?: (categorySlug: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  selectedComponents, 
  config,
  onTabChange,
  onNavigateToCategory
}) => {
  const coreComponentSlugs = useMemo(() => 
    config.required.map(cat => cat.slug), 
  [config.required]);

  const coreCategories = useMemo(() => config.required, [config.required]);

  const selectedExtraCategories = useMemo(() => {
    const allCategories = [...config.required, ...config.optional];
    return allCategories.filter(cat => 
      !coreComponentSlugs.includes(cat.slug) && selectedComponents[cat.slug]
    );
  }, [config, selectedComponents, coreComponentSlugs]);

  const categoriesToDisplay = [...coreCategories, ...selectedExtraCategories];

  const handleEditClick = (categorySlug: string) => {
    const category = [...config.required, ...config.optional].find(cat => cat.slug === categorySlug);
    if (!category) return;
    
    if (config.required.some(cat => cat.slug === categorySlug)) {
      onTabChange('components');
    } else if (category.isPeripheral === true) {
      onTabChange('peripherals');
    } else {
      onTabChange('extras');
    }
    
    if (onNavigateToCategory) onNavigateToCategory(categorySlug);
  };

  const getIcon = (slug: string) => {
    const s = slug.toLowerCase();
    const props = { size: 20, strokeWidth: 1.5 };
    if (s.includes('cpu') || s === 'processor') return <Cpu {...props} />;
    if (s.includes('motherboard')) return <CircuitBoard {...props} />;
    if (s.includes('memory') || s === 'ram') return <LayoutGrid {...props} />;
    if (s.includes('graphic') || s.includes('gpu')) return <Monitor {...props} />;
    if (s.includes('ssd') || s.includes('storage')) return <HardDrive {...props} />;
    if (s.includes('psu') || s.includes('power')) return <Zap {...props} />;
    if (s.includes('cabinet') || s.includes('case')) return <Box {...props} />;
    if (s.includes('cooler')) return <Fan {...props} />;
    if (s.includes('mouse')) return <Mouse {...props} />;
    if (s.includes('keyboard')) return <Keyboard {...props} />;
    if (s.includes('headphone')) return <Headphones {...props} />;
    if (s.includes('speaker')) return <Speaker {...props} />;
    if (s.includes('monitor')) return <Monitor {...props} />;
    if (s.includes('webcam')) return <Video {...props} />;
    if (s.includes('printer')) return <Printer {...props} />;
    return <Box {...props} />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-3 pb-12 px-4">
      {categoriesToDisplay.map((category) => {
        const selectedProduct = selectedComponents[category.slug];

        return (
          <div 
            key={category.slug}
            className="group relative bg-white rounded-lg border border-slate-300 transition-all duration-300 hover:shadow-sm hover:border-slate-400"
          >
            <div className="flex flex-col md:flex-row md:items-center p-4 md:p-5 gap-6">
              
              {/* 1. Category Label */}
              <div className="flex items-center gap-4 w-full md:w-48 shrink-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors
                  ${selectedProduct ? 'bg-slate-50 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                  {getIcon(category.slug)}
                </div>
                <h3 className="font-medium text-slate-800 text-sm tracking-tight">{category.name}</h3>
              </div>

              {/* 2. Product Information */}
              <div className="flex-1 flex items-center min-w-0">
                {selectedProduct ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 border border-slate-50 flex items-center justify-center">
                      <img 
                        src={getImageUrl(selectedProduct.image)} 
                        alt="" 
                        className="max-w-full max-h-full object-contain grayscale-[0.2] group-hover:grayscale-0 transition-all"
                        onError={(e) => e.currentTarget.src = "https://placehold.co/100x100?text=..."} 
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {selectedProduct.name}
                      </p>
                      {selectedProduct.brand && (
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-wide uppercase">
                          {selectedProduct.brand}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg border border-dashed border-slate-200 flex items-center justify-center bg-slate-50/30">
                      <Plus size={16} className="text-slate-300" />
                    </div>
                    <span className="text-sm text-slate-400 font-light italic">
                      No selection made
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Action */}
              <div className="shrink-0">
                <button
                  onClick={() => handleEditClick(category.slug)}
                  className={`w-full md:w-auto px-5 py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-2
                    ${selectedProduct 
                      ? 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300' 
                      : 'bg-slate-900 text-white hover:bg-black'
                    }`}
                >
                  {selectedProduct ? (
                    <> <Edit2 size={12} /> <span>Change</span> </>
                  ) : (
                    <> <Plus size={12} /> <span>Configure</span> </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {selectedExtraCategories.length === 0 && (
        <div className="mt-6 p-8 rounded-2xl border border-dashed border-slate-200 text-center">
          <p className="text-slate-400 text-sm font-light italic">
            Ready to expand? Browse through{' '}
            <button onClick={() => onTabChange('extras')} className="text-slate-600 font-medium hover:text-slate-900 mx-1">Extras</button>
            or
            <button onClick={() => onTabChange('peripherals')} className="text-slate-600 font-medium hover:text-slate-900 mx-1">Peripherals</button>
          </p>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;