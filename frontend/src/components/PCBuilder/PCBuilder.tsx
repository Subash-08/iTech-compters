import React, { useState, useEffect, useCallback } from 'react';
import { pcBuilderService } from './services/pcBuilderService';
import { PCBuilderConfig, SelectedComponents, Product } from './types/pcBuilder';
import OverviewTab from './tabs/OverviewTab';
import ComponentsTab from './tabs/ComponentsTab';
import ExtrasTab from './tabs/ExtrasTab';
import PeripheralsTab from './tabs/PeripheralsTab';
import QuoteModal from './QuoteModal';
import PCRequirementsForm from './PCRequirementsForm';

const PCBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState<PCBuilderConfig>({ required: [], optional: [] });
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponents>({});
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());
  
const [showRequirementsForm, setShowRequirementsForm] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await pcBuilderService.getPCBuilderConfig();
      setConfig(response.config);
      
      const initialSelected: SelectedComponents = {};
      [...response.config.required, ...response.config.optional].forEach(cat => {
        initialSelected[cat.slug] = null;
      });
      setSelectedComponents(initialSelected);
    } catch (err) {
      setError('Failed to load PC builder configuration');
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComponentSelect = useCallback((categorySlug: string, product: Product | null): void => {
    setSelectedComponents(prev => ({
      ...prev,
      [categorySlug]: product
    }));
  }, []);

  const getSelectedCount = useCallback((): number => {
    return Object.values(selectedComponents).filter(Boolean).length;
  }, [selectedComponents]);

  const getTotalPrice = useCallback((): number => {
    return Object.values(selectedComponents)
      .filter(Boolean)
      .reduce((total: number, product: Product | null) => total + (product?.price || 0), 0);
  }, [selectedComponents]);

  const handleCategoryVisibility = useCallback((categorySlug: string, isVisible: boolean) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (isVisible) {
        newSet.add(categorySlug);
      } else {
        newSet.delete(categorySlug);
      }
      return newSet;
    });
  }, []);

  const tabs = {
    overview: (
      <OverviewTab 
        selectedComponents={selectedComponents} 
        onComponentSelect={handleComponentSelect}
        config={config}
        onTabChange={setActiveTab}
      />
    ),
    components: (
      <ComponentsTab 
        selectedComponents={selectedComponents}
        onComponentSelect={handleComponentSelect}
        config={config}
        visibleCategories={visibleCategories}
        onCategoryVisibilityChange={handleCategoryVisibility}
      />
    ),
    extras: (
      <ExtrasTab 
        selectedComponents={selectedComponents}
        onComponentSelect={handleComponentSelect}
        config={config}
        visibleCategories={visibleCategories}
        onCategoryVisibilityChange={handleCategoryVisibility}
      />
    ),
    peripherals: (
      <PeripheralsTab 
        selectedComponents={selectedComponents}
        onComponentSelect={handleComponentSelect}
        config={config}
        visibleCategories={visibleCategories}
        onCategoryVisibilityChange={handleCategoryVisibility}
      />
    )
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900">Loading PC Builder...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Custom PC Builder</h1>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Build your dream computer piece by piece</p>
            <div className="text-right">
              <div className="text-xl font-bold">₹{getTotalPrice().toLocaleString()}</div>
              <div className="text-sm text-gray-500">{getSelectedCount()} components selected</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <div className="mb-4 md:mb-0">
        <h3 className="font-semibold text-blue-900 mb-1">Not sure which components to choose?</h3>
        <p className="text-blue-700 text-sm">Let our experts build the perfect PC for your needs</p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => setShowRequirementsForm(true)}
          className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Fill Requirements Form
        </button>
        <button
          onClick={() => {}}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Build Manually
        </button>
      </div>
    </div>
  </div>
</div>


        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'components', label: 'Components' },
              { id: 'extras', label: 'Extras' },
              { id: 'peripherals', label: 'Peripherals' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {tabs[activeTab as keyof typeof tabs]}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:w-64">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sticky top-6">
              <h3 className="text-lg font-semibold mb-3">Build Summary</h3>
              
              <div className="mb-4 max-h-64 overflow-y-auto space-y-2">
                {Object.entries(selectedComponents)
                  .filter(([_, product]) => product)
                  .map(([categorySlug, product]) => (
                    <div key={categorySlug} className="text-sm">
                      <div className="font-medium text-gray-900 truncate">
                        {product?.name}
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span className="text-xs capitalize">
                          {categorySlug.replace(/-/g, ' ')}
                        </span>
                        <span className="font-semibold">
                          ₹{product?.price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold mb-1">
                  <span>Total:</span>
                  <span>₹{getTotalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Components:</span>
                  <span>{getSelectedCount()}</span>
                </div>
              </div>

              <button
                onClick={() => setQuoteModalOpen(true)}
                disabled={getSelectedCount() === 0}
                className={`w-full mt-4 py-2 px-4 rounded font-medium transition-colors text-sm ${
                  getSelectedCount() === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Get Quote
              </button>
            </div>
          </div>
        </div>

        <QuoteModal
          open={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          selectedComponents={selectedComponents}
          totalPrice={getTotalPrice()}
        />
      </div>
      {showRequirementsForm && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <button
        onClick={() => setShowRequirementsForm(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <PCRequirementsForm onClose={() => setShowRequirementsForm(false)} />
    </div>
  </div>
)}
    </div>
  );
};

export default PCBuilder;