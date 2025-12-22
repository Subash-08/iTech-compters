import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async'; // ✅ SEO: Head management
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

  // --- SEO Configuration ---
  const companyName = "iTech Computers";
  const city = "Salem";
  const pageTitle = `Custom PC Builder ${city} | Build Your Dream Gaming PC | ${companyName}`;
  const pageDescription = "Design your custom gaming PC or workstation with our online PC Builder. Choose expert assembly in Salem or pick parts manually. Best prices, warranty & support.";
  const canonicalUrl = "https://itechcomputers.shop/custom-pcs"; // Adjust domain as needed

  // --- Structured Data (JSON-LD) ---
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Custom PC Building Service",
      "provider": {
        "@type": "ComputerStore",
        "name": companyName,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "RBT Mall, Meyyanur Bypass Rd",
          "addressLocality": city,
          "addressRegion": "Tamil Nadu",
          "postalCode": "636004",
          "addressCountry": "IN"
        },
        "telephone": "+91 63829 28973",
        "priceRange": "₹₹"
      },
      "areaServed": {
        "@type": "City",
        "name": city
      },
      "description": "Professional custom PC assembly, testing, and component selection service in Salem.",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "PC Building Options",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Expert PC Assembly"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Custom Workstation Configuration"
            }
          }
        ]
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://itechcomputers.shop/" },
        { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://itechcomputers.shop/services" },
        { "@type": "ListItem", "position": 3, "name": "PC Builder", "item": canonicalUrl }
      ]
    }
  ];

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
      <div className="min-h-screen bg-white flex items-center justify-center" aria-live="polite">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" role="status" />
          <h2 className="text-lg font-bold text-gray-900">Loading PC Builder...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ SEO: Metadata Injection */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={companyName} />
        
        {/* Local Business Tags */}
        <meta property="business:contact_data:locality" content={city} />
        <meta property="business:contact_data:region" content="Tamil Nadu" />
        <meta property="business:contact_data:country_name" content="India" />
        
        {/* Structured Data */}
        {structuredData.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      {/* ✅ SEO: Semantic Main Wrapper */}
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-6">
          
          {/* ✅ SEO: Semantic Header with H1 */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Custom PC Builder <span className="sr-only">in Salem</span> {/* Screen reader only text for location context */}
            </h1>
            <p className="text-gray-600">
              Configure your dream computer with compatible parts. We assemble and test in Salem.
            </p>
          </header>

          {/* --- Two Options Section --- */}
          <section className="grid md:grid-cols-2 gap-6 mb-10" aria-label="PC Building Options">
            
            {/* Option 1 */}
            <article className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg" aria-hidden="true">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Option 1: Let Experts Build It</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Not sure what parts to pick? Fill out our requirements form and our <strong>Salem-based experts</strong> will design the perfect configuration for you.
                  </p>
                  <button
                    onClick={() => setShowRequirementsForm(true)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    aria-label="Open PC Requirements Form"
                  >
                    Fill Requirements Form
                  </button>
                </div>
              </div>
            </article>

            {/* Option 2 */}
            <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
                Active Mode
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 text-gray-600 rounded-lg" aria-hidden="true">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Option 2: Build Manually</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Know exactly what you want? Select your components (CPU, GPU, RAM) from the tabs below and get a custom quote.
                  </p>
                  <div className="text-sm font-medium text-blue-600 flex items-center">
                    Start selecting below <span className="ml-2" aria-hidden="true">↓</span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          {error && (
            <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <nav className="border-b border-gray-200 mb-6" aria-label="PC Builder Steps">
            <div className="flex space-x-8 overflow-x-auto" role="tablist">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'components', label: 'Components' },
                { id: 'extras', label: 'Extras' },
                { id: 'peripherals', label: 'Peripherals' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <section id={`panel-${activeTab}`} role="tabpanel" className="flex-1">
              {tabs[activeTab as keyof typeof tabs]}
            </section>

            {/* Summary Sidebar */}
            <aside className="lg:w-72">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 sticky top-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Build Summary
                </h3>
                
                <div className="mb-4 max-h-80 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {Object.entries(selectedComponents)
                    .filter(([_, product]) => product)
                    .map(([categorySlug, product]) => (
                      <div key={categorySlug} className="text-sm bg-white p-3 rounded-lg border border-gray-100">
                        <div className="font-medium text-gray-900">
                          {product?.name}
                        </div>
                        <div className="flex justify-between text-gray-500 mt-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            {categorySlug.replace(/-/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  
                  {getSelectedCount() === 0 && (
                    <p className="text-sm text-gray-500 italic text-center py-4">No components selected yet.</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>Selected Components:</span>
                    <span className="font-semibold text-gray-900">{getSelectedCount()}</span>
                  </div>

                  <button
                    onClick={() => setQuoteModalOpen(true)}
                    disabled={getSelectedCount() === 0}
                    className={`w-full py-3 px-4 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                      getSelectedCount() === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow'
                    }`}
                    aria-label="Get Quote for selected PC parts"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Get Quote
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <QuoteModal
            open={quoteModalOpen}
            onClose={() => setQuoteModalOpen(false)}
            selectedComponents={selectedComponents}
            totalPrice={getTotalPrice()}
          />
        </div>

        {showRequirementsForm && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
              <button
                onClick={() => setShowRequirementsForm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10"
                aria-label="Close Requirements Form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <PCRequirementsForm onClose={() => setShowRequirementsForm(false)} />
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default PCBuilder;