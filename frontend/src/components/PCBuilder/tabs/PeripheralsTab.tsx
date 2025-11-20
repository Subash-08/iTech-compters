import React from 'react';
import { Monitor, Mouse, Keyboard, Headphones, Mic, Volume2, Video } from 'lucide-react';
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
  const peripheralsCategories = config.optional.filter(cat => 
    [
      'monitors', 'mouse', 'keyboard', 'mouse-pad', 'controller',
      'headset', 'microphone', 'speakers', 'webcam'
    ].includes(cat.slug)
  );

  const getCategoryIcon = (slug: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'monitors': <Monitor className="w-5 h-5" />,
      'mouse': <Mouse className="w-5 h-5" />,
      'keyboard': <Keyboard className="w-5 h-5" />,
      'headset': <Headphones className="w-5 h-5" />,
      'microphone': <Mic className="w-5 h-5" />,
      'speakers': <Volume2 className="w-5 h-5" />,
      'webcam': <Video className="w-5 h-5" />,
    };
    return icons[slug] || <Monitor className="w-5 h-5" />;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Monitor className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Peripherals & Accessories</h1>
          <p className="text-gray-600 text-sm">
            Complete your setup with monitors, input devices, and audio equipment
          </p>
        </div>
      </div>

      {peripheralsCategories.length > 0 ? (
        <div className="space-y-4">
          {peripheralsCategories.map((category) => (
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
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No Peripherals Available
          </h3>
          <p className="text-gray-600 text-sm">
            Check back soon for new peripheral products
          </p>
        </div>
      )}
    </div>
  );
};

export default PeripheralsTab;