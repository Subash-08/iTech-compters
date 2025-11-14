// src/components/showcase/ProductShowcaseContainer.tsx
import React, { useState, useEffect } from 'react';
import { ShowcaseSection } from './showcaseSection';
import ProductShowcaseSection from './ProductShowcaseSection';
import { showcaseSectionService } from './showcaseSectionService';
import { RefreshCw, AlertCircle, Package } from 'lucide-react';

interface ProductShowcaseContainerProps {
  sections?: ShowcaseSection[];
  maxSections?: number;
  className?: string;
  autoRefresh?: boolean;
}

const ProductShowcaseContainer: React.FC<ProductShowcaseContainerProps> = ({
  sections: propSections,
  maxSections = 3, // Reduced default
  className = '',
  autoRefresh = false
}) => {
  const [sections, setSections] = useState<ShowcaseSection[]>(propSections || []);
  const [loading, setLoading] = useState(!propSections);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSections = async () => {
    try {
      setError(null);
      if (!propSections) {
        setLoading(true);
      }
      
      const response = await showcaseSectionService.getActiveShowcaseSections({
        limit: maxSections,
        showOnHomepage: true
      });
      
      // Handle different response structures
      const sectionsData = response.sections || response.data || [];
      setSections(sectionsData);
    } catch (err: any) {
      console.error('Error fetching showcase sections:', err);
      setError(err.response?.data?.message || 'Failed to load showcase sections');
      setSections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (propSections) {
      setSections(propSections);
      return;
    }
    fetchSections();
  }, [propSections, maxSections]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || propSections) return;

    const interval = setInterval(fetchSections, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, propSections]);

  const handleRetry = () => {
    setRefreshing(true);
    fetchSections();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSections();
  };

  // Loading State - More compact
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(maxSections)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white rounded-xl p-4 border border-gray-200 h-64 flex flex-col">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-300 rounded w-40"></div>
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="h-7 bg-gray-300 rounded w-20"></div>
              </div>
              
              {/* Products Grid Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                {[...Array(4)].map((_, productIndex) => (
                  <div key={productIndex} className="bg-gray-100 rounded-lg p-2 space-y-1.5">
                    <div className="aspect-square bg-gray-300 rounded-md"></div>
                    <div className="h-2.5 bg-gray-300 rounded"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State - More compact
  if (error && sections.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <div className="text-center max-w-sm">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Unable to Load</h3>
          <p className="text-gray-600 text-xs mb-3">{error}</p>
          <button
            onClick={handleRetry}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 mx-auto text-sm"
          >
            {refreshing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Empty State - More compact
  if (!loading && sections.length === 0 && !error) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <div className="text-center max-w-sm">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No Sections</h3>
          <p className="text-gray-600 text-xs mb-3">
            No showcase sections available.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 mx-auto text-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Refresh Button - More compact */}
      {!propSections && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}

      {/* Error Banner - More compact */}
      {error && sections.length > 0 && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-1.5 text-xs">
          <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-800">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={refreshing}
            className="text-yellow-800 hover:text-yellow-900 text-xs font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {refreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Showcase Sections - Reduced spacing */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <ProductShowcaseSection
            key={section._id}
            section={section}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>

      {/* Loading Overlay for Refresh - More compact */}
      {refreshing && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded shadow text-xs">
            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
            <span className="text-gray-700 font-medium">Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductShowcaseContainer;