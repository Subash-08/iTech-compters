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
  Video: ({ className }: { className?: string }) => (
    <div className={className}>🎬</div>
  ),
  ArrowUp: ({ className }: { className?: string }) => (
    <div className={className}>↑</div>
  ),
  ArrowDown: ({ className }: { className?: string }) => (
    <div className={className}>↓</div>
  ),
  GripVertical: ({ className }: { className?: string }) => (
    <div className={className}>⋮</div>
  ),
};

const HeroSectionList: React.FC = () => {
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [reorderLoading, setReorderLoading] = useState(false);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedSection || !heroSections.length || draggedSection === targetSectionId) return;

    const sections = [...heroSections];
    const draggedIndex = sections.findIndex(section => section._id === draggedSection);
    const targetIndex = sections.findIndex(section => section._id === targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder sections
    const [movedSection] = sections.splice(draggedIndex, 1);
    sections.splice(targetIndex, 0, movedSection);

    // Update local state immediately for better UX
    setHeroSections(sections);

    // Send reorder request to backend
    try {
      setReorderLoading(true);
      const sectionsOrder = sections.map(section => section._id!);
      await heroSectionService.reorderHeroSections(sectionsOrder);
    } catch (err: any) {
      setError(err.message || 'Failed to reorder sections');
      // Reload original order on error
      loadHeroSections();
    } finally {
      setReorderLoading(false);
      setDraggedSection(null);
    }
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const sections = [...heroSections];
    const currentIndex = sections.findIndex(s => s._id === sectionId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    // Swap sections
    [sections[currentIndex], sections[newIndex]] = [sections[newIndex], sections[currentIndex]];
    
    // Update local state
    setHeroSections(sections);
    
    // Send reorder request
    try {
      setReorderLoading(true);
      const sectionsOrder = sections.map(section => section._id!);
      await heroSectionService.reorderHeroSections(sectionsOrder);
    } catch (err: any) {
      setError(err.message || 'Failed to reorder sections');
      loadHeroSections();
    } finally {
      setReorderLoading(false);
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

      {/* Reorder Loading */}
      {reorderLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <SafeIcons.Loader className="w-4 h-4 animate-spin" />
          <span>Updating order...</span>
        </div>
      )}

      {/* Hero Sections List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {heroSections.map((section, index) => (
            <div
              key={section._id}
              draggable
              onDragStart={(e) => handleDragStart(e, section._id!)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section._id!)}
              className={`
                p-6 transition-all duration-200
                ${draggedSection === section._id ? 'bg-blue-50 shadow-lg opacity-50' : 'bg-white'}
                hover:bg-gray-50
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Drag Handle and Order Controls */}
                <div className="flex-shrink-0">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg">
                      <SafeIcons.GripVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleMoveSection(section._id!, 'up')}
                        disabled={index === 0}
                        className="p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                      >
                        <SafeIcons.ArrowUp className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(section._id!, 'down')}
                        disabled={index === heroSections.length - 1}
                        className="p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                      >
                        <SafeIcons.ArrowDown className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                        <span className="text-sm font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
                          Order: {section.order}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {section.slides?.length || 0} slide{section.slides?.length !== 1 ? 's' : ''}
                      </p>
                      
                      {/* Slides Preview */}
                      {section.slides && section.slides.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {section.slides.slice(0, 3).map((slide) => (
                            <div key={slide._id} className="flex items-center space-x-2 text-sm">
                              <div className="w-6 h-6 rounded flex items-center justify-center text-xs bg-gray-100">
                                {slide.mediaType === 'image' ? (
                                  <SafeIcons.Image className="w-3 h-3" />
                                ) : (
                                  <SafeIcons.Video className="w-3 h-3" />
                                )}
                              </div>
                              <span className="text-gray-700 truncate">{slide.title}</span>
                              <span className={`text-xs px-1 rounded ${
                                slide.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {slide.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          ))}
                          {section.slides.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{section.slides.length - 3} more slides
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section Actions */}
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      {/* Active Toggle */}
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
                        <span className={`text-sm font-medium ${
                          section.isActive ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {section.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/hero-sections/${section._id}/slides`}
                          className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                        >
                          Manage Slides
                        </Link>
                        <Link
                          to={`/admin/hero-sections/edit/${section._id}`}
                          className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
                        >
                          Settings
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Section Settings Summary */}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                    <span>Auto-play: {section.autoPlay ? 'On' : 'Off'}</span>
                    <span>Speed: {section.autoPlaySpeed}ms</span>
                    <span>Transition: {section.transitionEffect}</span>
                    <span>Navigation: {section.showNavigation ? 'On' : 'Off'}</span>
                    <span>Pagination: {section.showPagination ? 'On' : 'Off'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {heroSections.length === 0 && !loading && (
          <div className="text-center py-12">
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