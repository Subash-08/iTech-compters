import React, { useEffect, useRef } from 'react';
import { Cpu, AlertTriangle } from 'lucide-react';
import CategorySection from '../CategorySection';
import { SelectedComponents, Product, PCBuilderConfig } from '../types/pcBuilder';

interface ComponentsTabProps {
  selectedComponents: SelectedComponents;
  onComponentSelect: (categorySlug: string, product: Product | null) => void;
  config: PCBuilderConfig;
  visibleCategories: Set<string>;
  onCategoryVisibilityChange: (categorySlug: string, isVisible: boolean) => void;
}

const ComponentsTab: React.FC<ComponentsTabProps> = ({ 
  selectedComponents, 
  onComponentSelect,
  config,
  visibleCategories,
  onCategoryVisibilityChange
}) => {
  const requiredSelected = config.required.filter(cat => selectedComponents[cat.slug]);
  const allRequiredSelected = requiredSelected.length === config.required.length;
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const categorySlug = entry.target.id.replace('category-', '');
          onCategoryVisibilityChange(categorySlug, entry.isIntersecting);
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const categoryElements = document.querySelectorAll('[id^="category-"]');
    categoryElements.forEach(el => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [config, onCategoryVisibilityChange]);

  return (
    <div>
      {!allRequiredSelected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <strong className="text-yellow-800 text-sm">Required components missing:</strong>
              <p className="text-yellow-700 text-sm mt-1">
                Please select all required components to complete your build.
                ({requiredSelected.length} of {config.required.length} selected)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {config.required.map((category) => (
          <div key={category.slug} id={`category-${category.slug}`}>
            <CategorySection
              category={category}
              selectedComponents={selectedComponents}
              onComponentSelect={onComponentSelect}
              isRequired={true}
              isVisible={visibleCategories.has(category.slug)}
            />
          </div>
        ))}

        {config.optional.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Cpu className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Optional Components</h2>
            </div>
            <div className="space-y-4">
              {config.optional.map((category) => (
                <div key={category.slug} id={`category-${category.slug}`}>
                  <CategorySection
                    category={category}
                    selectedComponents={selectedComponents}
                    onComponentSelect={onComponentSelect}
                    isRequired={false}
                    isVisible={visibleCategories.has(category.slug)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentsTab;