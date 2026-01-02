import React, { useMemo } from 'react';
import { 
  Plus, Edit2, AlertTriangle, CheckCircle, 
  ArrowRight, Cpu, Monitor, HardDrive, 
  LayoutGrid, CircuitBoard, Box, Fan, Mouse, Keyboard,
  Zap, Headphones, Speaker
} from 'lucide-react';
import { Category, SelectedComponents, PCBuilderConfig } from '../types/pcBuilder';
import { getImageUrl } from '../../utils/imageUtils';

interface OverviewTabProps {
  selectedComponents: SelectedComponents;
  config: PCBuilderConfig;
  onTabChange: (tab: string) => void;
  // Make sure to implement this navigate handler in your parent component
  onNavigateToCategory?: (categorySlug: string) => void; 
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  selectedComponents, 
  config,
  onTabChange,
  onNavigateToCategory
}) => {
  const allCategories: Category[] = useMemo(() => 
    [...config.required, ...config.optional], 
  [config]);

  // Calculate Progress (Count only)
  const totalRequired = config.required.length;
  const selectedRequiredCount = config.required.filter(cat => selectedComponents[cat.slug]).length;
  const progress = Math.round((selectedRequiredCount / totalRequired) * 100);
  const isBuildComplete = progress === 100;

  const handleEditClick = (categorySlug: string) => {
    onTabChange('components');
    if (onNavigateToCategory) {
        onNavigateToCategory(categorySlug);
    }
  };

  const getIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('cpu')) return <Cpu size={20} />;
    if (s.includes('motherboard')) return <CircuitBoard size={20} />;
    if (s.includes('ram') || s.includes('memory')) return <LayoutGrid size={20} />;
    if (s.includes('gpu') || s.includes('card')) return <Monitor size={20} />;
    if (s.includes('storage')) return <HardDrive size={20} />;
    if (s.includes('power') || s.includes('psu')) return <Zap size={20} />;
    if (s.includes('case') || s.includes('chassis')) return <Box size={20} />;
    if (s.includes('cooler')) return <Fan size={20} />;
    if (s.includes('mouse')) return <Mouse size={20} />;
    if (s.includes('keyboard')) return <Keyboard size={20} />;
    if (s.includes('headphone')) return <Headphones size={20} />;
    if (s.includes('speaker')) return <Speaker size={20} />;
    return <Box size={20} />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y- pb-10">

      {/* --- COMPONENT LIST --- */}
      <div className="space-y-3">
        {allCategories.map((category) => {
          const selectedProduct = selectedComponents[category.slug];
          const isRequired = config.required.some(cat => cat.slug === category.slug);
          const isMissing = isRequired && !selectedProduct;

          return (
            <div 
                key={category.slug}
                className={`group bg-white border rounded-lg p-4 transition-all hover:shadow-md
                    ${isMissing 
                        ? 'border-l-4 border-l-blue-500 border-y-red-100 border-r-red-100 bg-red-50/10' 
                        : 'border-gray-200 border-l-4 border-l-blue-500'}
                `}
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                
                {/* 1. Category Icon/Info */}
                <div className="flex items-center gap-4 w-full sm:w-64 flex-shrink-0">
                    <div className={`p-3 rounded-lg ${selectedProduct ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                        {getIcon(category.slug)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{category.name}</h3>
                        {isRequired ? (
                            <span className="text-[10px] uppercase font-bold text-blue-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Required</span>
                        ) : (
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Optional</span>
                        )}
                    </div>
                </div>

                {/* 2. Selected Product Info (NO PRICE) */}
                <div className="flex-1 w-full min-w-0 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 sm:border-l sm:pl-6">
                    {selectedProduct ? (
                        <div className="flex items-center gap-4">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 bg-white border border-gray-200 rounded p-1 flex-shrink-0 flex items-center justify-center">
                                <img 
                                    src={getImageUrl(selectedProduct.image)} 
                                    alt="" 
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => e.currentTarget.src = "https://placehold.co/100x100?text=..."} 
                                />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="font-semibold text-gray-900 truncate text-base" title={selectedProduct.name}>
                                    {selectedProduct.name}
                                </div>
                                <div className="flex gap-2 mt-1">
                                    {selectedProduct.brand && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 rounded">
                                            {selectedProduct.brand}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400 italic h-12">
                            {isMissing && <AlertTriangle size={16} className="text-red-400" />}
                            <span>{isMissing ? 'Please select a component' : 'No component selected'}</span>
                        </div>
                    )}
                </div>

                {/* 3. Action Button */}
                <div className="w-full sm:w-auto pt-3 sm:pt-0 flex justify-end">
                    <button
                        onClick={() => handleEditClick(category.slug)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors border
                            ${selectedProduct 
                                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400' 
                                : 'bg-blue-600 border-transparent text-white hover:bg-blue-700'
                            }`}
                    >
                        {selectedProduct ? (
                            <> <Edit2 size={14} /> Change </>
                        ) : (
                            <> <Plus size={14} /> Add </>
                        )}
                    </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewTab;