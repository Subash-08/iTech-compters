// src/components/showcase/ProductShowcaseContainer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ShowcaseSection } from './showcaseSection'; // Ensure path is correct
import ProductShowcaseSection from './ProductShowcaseSection';
import { showcaseSectionService } from './showcaseSectionService';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ProductShowcaseContainerProps {
  sections?: ShowcaseSection[];
  maxSections?: number;
  className?: string;
  autoRefresh?: boolean;
}

const ProductShowcaseContainer: React.FC<ProductShowcaseContainerProps> = ({
  sections: propSections,
  maxSections = 3,
  className = '',
  autoRefresh = false
}) => {
  const [sections, setSections] = useState<ShowcaseSection[]>(propSections || []);
  const [loading, setLoading] = useState(!propSections);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Optimization: Memoize fetch function
  const fetchSections = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh && !propSections) setLoading(true);
      setError(null);

      const response = await showcaseSectionService.getActiveShowcaseSections({
        limit: maxSections,
        showOnHomepage: true
      });

      // Handle different API response structures
      const sectionsData = Array.isArray(response) ? response : (response.sections || response.data || []);
      setSections(sectionsData);
    } catch (err: any) {
      console.error('Error fetching showcase sections:', err);
      // Only set error if we don't have existing sections to show (better UX)
      if (sections.length === 0) {
        setError(err.response?.data?.message || 'Failed to load sections');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [maxSections, propSections, sections.length]);

  // Initial Fetch
  useEffect(() => {
    if (propSections && propSections.length > 0) {
      setSections(propSections);
      setLoading(false);
      return;
    }
    fetchSections();
  }, [propSections, fetchSections]);

  // Auto Refresh Interval
  useEffect(() => {
    if (!autoRefresh || propSections) return;
    const interval = setInterval(() => fetchSections(true), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, propSections, fetchSections]);

  const handleRetry = () => {
    setRefreshing(true);
    fetchSections(true);
  };

  // --- Render Helpers ---
  
  if (loading) {
    return (
      <div className={`space-y-8 ${className}`}>
        {[...Array(maxSections)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-3">
                  <div className="aspect-square bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!loading && sections.length === 0) return null;

  return (
    <div className={`relative space-y-8 ${className}`}>
      {sections.map((section, index) => (
        <ProductShowcaseSection
          key={section._id || index}
          section={section}
          // Optimization: Add staggered animation
          className="animate-fade-in"
        />
      ))}
      
      {/* Background Refetching Indicator (Subtle) */}
      {refreshing && (
        <div className="absolute top-0 right-0 m-4">
           <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default React.memo(ProductShowcaseContainer);