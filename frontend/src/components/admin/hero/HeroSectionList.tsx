// src/components/admin/hero/HeroSectionList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { heroSectionService, HeroSection } from '../services/heroSectionService';

// Safe icon fallbacks
const SafeIcons = {
  Loader: ({ className }: { className?: string }) => (
    <div className={className}>⏳</div>
  ),
  Plus: ({ className }: { className?: string }) => (
    <div className={className}>+</div>
  ),
  Image: ({ className }: { className?: string }) => (
    <div className={className}>🖼️</div>
  ),
};

const HeroSectionList: React.FC = () => {
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadHeroSections();
  }, []);

  const loadHeroSections = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await heroSectionService.getAllHeroSections();
      if (response.success) {
        setHeroSections(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hero sections');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await heroSectionService.updateHeroSection(id, { isActive: !currentStatus });
      loadHeroSections(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update hero section');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <SafeIcons.Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading hero sections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Sections</h1>
          <p className="text-gray-600">Manage your website's hero banners and sliders</p>
        </div>
        <Link
          to="/admin/hero-sections/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <SafeIcons.Plus className="w-5 h-5" />
          <span>Create Hero Section</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={loadHeroSections}
            className="ml-4 text-sm underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Hero Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {heroSections.map((section) => (
          <div
            key={section._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {section.slides.length} slide{section.slides.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(section._id!, section.isActive)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      section.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                        section.isActive ? 'transform translate-x-7' : 'transform translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium ${
                    section.isActive ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {section.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Slides Preview */}
            <div className="p-4 bg-gray-50">
              <div className="space-y-2">
                {section.slides.slice(0, 2).map((slide, index) => (
                  <div key={slide._id} className="flex items-center space-x-2 text-sm">
                    <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 truncate">{slide.title}</span>
                    <span className={`text-xs px-1 rounded ${
                      slide.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                {section.slides.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{section.slides.length - 2} more slides
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Auto-play: {section.autoPlay ? 'On' : 'Off'}
                </span>
                <div className="flex space-x-3">
                  <Link
                    to={`/admin/hero-sections/${section._id}/slides`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage Slides
                  </Link>
                  <Link
                    to={`/admin/hero-sections/edit/${section._id}`}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {heroSections.length === 0 && !loading && (
          <div className="col-span-full text-center py-12">
            <SafeIcons.Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hero sections</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first hero section</p>
            <Link
              to="/admin/hero-sections/new"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <SafeIcons.Plus className="w-5 h-5" />
              <span>Create Hero Section</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSectionList;