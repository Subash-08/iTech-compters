// src/components/admin/hero/SlideManagement.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { heroSectionService, HeroSection } from '../services/heroSectionService';
import { getImageUrl } from '../../utils/imageUtils';

// Safe icon fallbacks
const SafeIcons = {
  Loader: ({ className }: { className?: string }) => (
    <div className={className}>⏳</div>
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div className={className}>⚠️</div>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <div className={className}>›</div>
  ),
  Plus: ({ className }: { className?: string }) => (
    <div className={className}>+</div>
  ),
  GripVertical: ({ className }: { className?: string }) => (
    <div className={className}>⋮</div>
  ),
  Edit: ({ className }: { className?: string }) => (
    <div className={className}>✏️</div>
  ),
  Trash: ({ className }: { className?: string }) => (
    <div className={className}>🗑️</div>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <div className={className}>←</div>
  ),
  Image: ({ className }: { className?: string }) => (
    <div className={className}>🖼️</div>
  ),
  Video: ({ className }: { className?: string }) => (
    <div className={className}>🎬</div>
  ),
  Play: ({ className }: { className?: string }) => (
    <div className={className}>▶️</div>
  ),
};

const SlideManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [reorderLoading, setReorderLoading] = useState(false);
  const [draggedSlide, setDraggedSlide] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadHeroSection();
    }
  }, [id]);

  const loadHeroSection = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await heroSectionService.getHeroSectionById(id!);
      if (response.success) {
        setHeroSection(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hero section');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, slideId: string) => {
    setDraggedSlide(slideId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetSlideId: string) => {
    e.preventDefault();
    if (!draggedSlide || !heroSection || draggedSlide === targetSlideId) return;

    const slides = [...heroSection.slides];
    const draggedIndex = slides.findIndex(slide => slide._id === draggedSlide);
    const targetIndex = slides.findIndex(slide => slide._id === targetSlideId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder slides
    const [movedSlide] = slides.splice(draggedIndex, 1);
    slides.splice(targetIndex, 0, movedSlide);

    // Update local state immediately for better UX
    setHeroSection(prev => prev ? { ...prev, slides } : null);

    // Send reorder request to backend
    try {
      setReorderLoading(true);
      const slidesOrder = slides.map(slide => slide._id!);
      await heroSectionService.reorderSlides(heroSection._id!, slidesOrder);
    } catch (err: any) {
      setError(err.message || 'Failed to reorder slides');
      // Reload original order on error
      loadHeroSection();
    } finally {
      setReorderLoading(false);
      setDraggedSlide(null);
    }
  };

  const handleToggleActive = async (slideId: string, currentStatus: boolean) => {
    try {
      await heroSectionService.toggleSlideActive(heroSection!._id!, slideId);
      loadHeroSection();
    } catch (err: any) {
      setError(err.message || 'Failed to update slide');
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;

    try {
      await heroSectionService.deleteSlide(heroSection!._id!, slideId);
      loadHeroSection();
    } catch (err: any) {
      setError(err.message || 'Failed to delete slide');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <SafeIcons.Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading slides...</span>
      </div>
    );
  }

  if (!heroSection) {
    return (
      <div className="text-center py-12">
        <SafeIcons.AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hero section not found</h3>
        <Link
          to="/admin/hero-sections"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Hero Sections
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <Link
              to="/admin/hero-sections"
              className="hover:text-blue-600"
            >
              Hero Sections
            </Link>
            <SafeIcons.ChevronRight className="w-4 h-4" />
            <span>{heroSection.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Slides</h1>
          <p className="text-gray-600">Drag and drop to reorder slides</p>
        </div>
        <Link
          to={`/admin/hero-sections/${heroSection._id}/slides/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <SafeIcons.Plus className="w-5 h-5" />
          <span>Add Slide</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={loadHeroSection}
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
          <span>Updating slide order...</span>
        </div>
      )}

      {/* Slides List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {heroSection.slides.map((slide, index) => (
            <div
              key={slide._id}
              draggable
              onDragStart={(e) => handleDragStart(e, slide._id!)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, slide._id!)}
              className={`
                p-6 transition-all duration-200 cursor-move
                ${draggedSlide === slide._id ? 'bg-blue-50 shadow-lg opacity-50' : 'bg-white'}
                ${!slide.isActive ? 'opacity-60' : ''}
                hover:bg-gray-50
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Drag Handle */}
                <div className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg">
                  <SafeIcons.GripVertical className="w-5 h-5 text-gray-400" />
                </div>

{/* Media Preview */}
<div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden relative">
  {slide.mediaType === 'video' ? (
    <>
      {/* FIX: Use getImageUrl() for video thumbnails */}
      {slide.thumbnailUrl || slide.videoDetails?.thumbnailUrl ? (
        <img
          src={getImageUrl(slide.thumbnailUrl || slide.videoDetails?.thumbnailUrl)}
          alt={slide.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <SafeIcons.Video className="w-8 h-8" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <SafeIcons.Play className="w-6 h-6 text-white" />
      </div>
    </>
  ) : (
    slide.image ? (
      <img
        src={getImageUrl(slide.image)}
        alt={slide.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
        }}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <SafeIcons.Image className="w-8 h-8" />
      </div>
    )
  )}
  <div className="absolute top-2 left-2">
    <span className={`text-xs px-2 py-1 rounded-full ${
      slide.mediaType === 'video' 
        ? 'bg-purple-100 text-purple-800' 
        : 'bg-blue-100 text-blue-800'
    }`}>
      {slide.mediaType === 'video' ? 'Video' : 'Image'}
    </span>
  </div>
</div>

                {/* Slide Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {slide.title}
                        </h3>
                        {slide.mediaType === 'video' && slide.videoDetails && (
                          <span className="text-xs text-gray-500">
                            ({slide.videoDetails.durationFormatted})
                          </span>
                        )}
                      </div>
                      
                      {slide.subtitle && (
                        <p className="text-gray-600 mt-1">{slide.subtitle}</p>
                      )}
                      
                      {slide.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {slide.description}
                        </p>
                      )}

                      {/* Video Source Info */}
                      {slide.mediaType === 'video' && slide.videoDetails && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-500">Source:</span>
                          <span className="text-xs text-blue-600 truncate max-w-xs">
                            {slide.videoDetails.title}
                          </span>
                        </div>
                      )}

                      {/* Button Info */}
                      {slide.buttonText && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm text-gray-500">Button:</span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {slide.buttonText}
                          </span>
                          {slide.buttonLink && (
                            <span className="text-xs text-blue-600 truncate max-w-xs">
                              → {slide.buttonLink}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Video Settings */}
                      {slide.mediaType === 'video' && slide.videoSettings && (
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-xs text-gray-500">Settings:</span>
                          {slide.videoSettings.autoplay && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                              Autoplay
                            </span>
                          )}
                          {slide.videoSettings.loop && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              Loop
                            </span>
                          )}
                          {slide.videoSettings.controls && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                              Controls
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Slide Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(slide._id!, slide.isActive)}
                        className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                          slide.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                            slide.isActive ? 'transform translate-x-5' : 'transform translate-x-1'
                          }`}
                        />
                      </button>

                      {/* Edit Button */}
                      <Link
                        to={`/admin/hero-sections/${heroSection._id}/slides/edit/${slide._id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <SafeIcons.Edit className="w-4 h-4" />
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteSlide(slide._id!)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <SafeIcons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Slide Metadata */}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                    <span>Order: {index + 1}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                      slide.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {slide.startDate && slide.endDate && (
                      <span>
                        {new Date(slide.startDate).toLocaleDateString()} - {new Date(slide.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {heroSection.slides.length === 0 && (
          <div className="text-center py-12">
            <SafeIcons.Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No slides yet</h3>
            <p className="text-gray-600 mb-4">Add your first slide to get started</p>
            <Link
              to={`/admin/hero-sections/${heroSection._id}/slides/new`}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <SafeIcons.Plus className="w-5 h-5" />
              <span>Add First Slide</span>
            </Link>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate('/admin/hero-sections')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <SafeIcons.ArrowLeft className="w-4 h-4" />
          <span>Back to Hero Sections</span>
        </button>
      </div>
    </div>
  );
};

export default SlideManagement;