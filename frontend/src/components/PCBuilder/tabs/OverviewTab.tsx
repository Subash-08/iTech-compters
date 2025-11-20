import React from 'react';
import { Plus } from 'lucide-react';
import { Category, SelectedComponents, Product, PCBuilderConfig } from '../types/pcBuilder';

interface OverviewTabProps {
  selectedComponents: SelectedComponents;
  onComponentSelect: (categorySlug: string, product: Product | null) => void;
  config: PCBuilderConfig;
  onTabChange: (tab: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  selectedComponents, 
  onComponentSelect,
  config,
  onTabChange
}) => {
  const allCategories: Category[] = [...config.required, ...config.optional];

  const handleAddClick = (category: Category): void => {
    // Switch to components tab and scroll to the specific category
    onTabChange('components');
    // Small delay to ensure tab switch happens before scrolling
    setTimeout(() => {
      const element = document.getElementById(`category-${category.slug}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Component Selection List - Exactly like the screenshot */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {allCategories.map((category: Category) => {
          const selectedProduct = selectedComponents[category.slug];
          const isRequired = config.required.some(cat => cat.slug === category.slug);
          
          return (
            <div
              key={category.slug}
              className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                  {isRequired && (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                      Required
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedProduct ? (
                    <div>
                      <div className="font-medium">{selectedProduct.name}</div>
                      <div className="text-green-600 font-semibold">
                        ₹{selectedProduct.price?.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">No selection</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleAddClick(category)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                {selectedProduct ? 'Change' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Progress Summary - Keep but make it more compact */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Build Progress</h3>
            <p className="text-gray-600 text-sm">
              {Object.values(selectedComponents).filter(Boolean).length} of {allCategories.length} components selected
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {Math.round((Object.values(selectedComponents).filter(Boolean).length / allCategories.length) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;