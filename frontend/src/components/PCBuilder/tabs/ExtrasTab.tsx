import React from 'react';
import { Settings, Wifi, Wind, Wrench } from 'lucide-react';
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
  const extrasCategories = config.optional.filter(cat => 
    ['assembly', 'case-fans', 'wifi-adapters', 'accessories'].includes(cat.slug)
  );

  const getCategoryIcon = (slug: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'assembly': <Wrench className="w-5 h-5" />,
      'case-fans': <Wind className="w-5 h-5" />,
      'wifi-adapters': <Wifi className="w-5 h-5" />,
      'accessories': <Settings className="w-5 h-5" />,
    };
    return icons[slug] || <Settings className="w-5 h-5" />;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Settings className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">PC Extras & Accessories</h1>
          <p className="text-gray-600 text-sm">
            Enhance your build with these optional extras and accessories
          </p>
        </div>
      </div>

      {extrasCategories.length > 0 ? (
        <div className="space-y-4">
          {extrasCategories.map((category) => (
            <div key={category.slug} id={`category-${category.slug}`}>
              <div className="flex items-center gap-3 mb-3">
                {getCategoryIcon(category.slug)}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </div>
              </div>
              <CategorySection
                category={category}
                selectedComponents={selectedComponents}
                onComponentSelect={onComponentSelect}
                isRequired={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No Extra Components Available
          </h3>
          <p className="text-gray-600 text-sm">
            Check back soon for new accessory products
          </p>
        </div>
      )}
    </div>
  );
};

export default ExtrasTab;