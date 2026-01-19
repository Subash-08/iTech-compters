// src/pages/admin/sections/SectionList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Section } from '../types/section';
import { sectionService } from '../services/sectionService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { baseURL } from '../../config/config';

const SectionList: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await sectionService.getSections();
      
      if (response.success) {
        // Sort by order initially
        const sortedSections = response.data.sections.sort((a: Section, b: Section) => a.order - b.order);
        setSections(sortedSections);
      } else {
        toast.error(response.message || 'Failed to fetch sections');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a visual effect
    const target = e.currentTarget;
    target.classList.add('opacity-50', 'border-blue-500');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.classList.remove('opacity-50', 'border-blue-500');
    setDraggedItem(null);
  };
const getFullUrl = (url: string) => {
  if (!url) return '';
  
  // If it's already a full URL (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it starts with /, prepend backend URL
  if (url.startsWith('/')) {
    const backendUrl = process.env.REACT_APP_API_URL || baseURL;
    return `${backendUrl}${url}`;
  }
  
  // Return as is (could be a data URL or other format)
  return url;
};
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add hover effect
    const target = e.currentTarget;
    if (!target.classList.contains('drag-over')) {
      target.classList.add('drag-over', 'border-blue-300');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.classList.remove('drag-over', 'border-blue-300');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      e.currentTarget.classList.remove('drag-over', 'border-blue-300');
      return;
    }

    // Remove hover effect
    e.currentTarget.classList.remove('drag-over', 'border-blue-300');

    // Find indices
    const sourceIndex = sections.findIndex(s => s._id === sourceId);
    const targetIndex = sections.findIndex(s => s._id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;

    // Reorder locally
    const newSections = [...sections];
    const [removed] = newSections.splice(sourceIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    // Update order numbers
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));

    setSections(updatedSections);
    setReordering(true);

    try {
      const reorderData = updatedSections.map((section, index) => ({
        id: section._id,
        order: index
      }));

      const response = await sectionService.reorderSections({
  sections: reorderData
});
      
      if (!response.success) {
        toast.error(response.message || 'Failed to reorder sections');
        // Revert on error
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reorder sections');
      // Revert on error
      fetchSections();
    } finally {
      setReordering(false);
    }
  };

  // Manual Reorder Buttons
  const moveSectionUp = async (index: number) => {
    if (index === 0) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    
    // Update order numbers
    const updatedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx
    }));

    setSections(updatedSections);
    await saveReorder(updatedSections);
  };

  const moveSectionDown = async (index: number) => {
    if (index === sections.length - 1) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    
    // Update order numbers
    const updatedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx
    }));

    setSections(updatedSections);
    await saveReorder(updatedSections);
  };

  const saveReorder = async (sectionsToSave: Section[]) => {
    setReordering(true);
    try {
      const reorderData = sectionsToSave.map((section, index) => ({
        id: section._id,
        order: index
      }));

      const response = await sectionService.reorderSections({
  sections: reorderData
});
      
      if (!response.success) {
        toast.error(response.message || 'Failed to reorder sections');
        // Revert on error
        fetchSections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reorder sections');
      // Revert on error
      fetchSections();
    } finally {
      setReordering(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      const response = await sectionService.updateSection(id, {
        title: '', // Will be ignored by backend since we're only updating visible
        description: '',
        layoutType: 'card',
        visible: !currentVisible,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        maxWidth: '1200px',
        padding: { top: 40, bottom: 40, left: 0, right: 0 },
        gridConfig: { columns: 3, gap: 16 },
        sliderConfig: { autoplay: true, delay: 5000, loop: true, showNavigation: true, showPagination: true }
      });

      if (response.success) {
        toast.success(`Section ${!currentVisible ? 'shown' : 'hidden'} successfully`);
        fetchSections();
      } else {
        toast.error(response.message || 'Failed to update section');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update section');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section? This will remove all videos from it.')) {
      return;
    }

    try {
      const response = await sectionService.deleteSection(id);
      
      if (response.success) {
        toast.success('Section deleted successfully');
        fetchSections();
      } else {
        toast.error(response.message || 'Failed to delete section');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete section');
    }
  };

  const getLayoutIcon = (layoutType: string) => {
    switch (layoutType) {
      case 'full-video':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'slider':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        );
      case 'grid':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'masonry':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
        );
        case 'reels':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h11a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
          );
      default: // card
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
    }
  };

  const getLayoutLabel = (layoutType: string) => {
    switch (layoutType) {
      case 'full-video': return 'Full Video';
      case 'slider': return 'Slider';
      case 'grid': return 'Grid';
      case 'masonry': return 'Masonry';
      case 'reels': return 'Reels';
      default: return 'Card Layout';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Video Sections</h1>
          <p className="text-gray-600 mt-2">Manage homepage video sections and layouts</p>
        </div>
        <Link
          to="/admin/sections/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Create New Section
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Sections</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{sections.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Visible</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {sections.filter(s => s.visible).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Hidden</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {sections.filter(s => !s.visible).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Videos</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {sections.reduce((total, section) => total + (section.videoCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Sections List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No sections created yet</h3>
          <p className="text-gray-500 mb-6">Create your first video section to display on the homepage</p>
          <Link
            to="/admin/sections/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Section
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section._id}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, section._id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, section._id)}
              className={`bg-white rounded-lg shadow border border-gray-200 cursor-move transition-all duration-200 ${
                !section.visible ? 'opacity-75' : ''
              } ${
                draggedItem === section._id ? 'border-blue-500 opacity-50' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    {/* Drag Handle and Reorder Buttons */}
                    <div className="flex flex-col items-center space-y-1 pt-1">
                      <div className="text-gray-400 hover:text-gray-600 cursor-move">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      
                      {/* Manual reorder buttons */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveSectionUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded ${
                            index === 0 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSectionDown(index)}
                          disabled={index === sections.length - 1}
                          className={`p-1 rounded ${
                            index === sections.length - 1
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Section Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          section.visible 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {section.visible ? 'Visible' : 'Hidden'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getLayoutLabel(section.layoutType)}
                        </span>
                      </div>
                      
                      {section.description && (
                        <p className="text-gray-600 mb-3">{section.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          {getLayoutIcon(section.layoutType)}
                          <span className="ml-1">{getLayoutLabel(section.layoutType)}</span>
                        </span>
                        <span>•</span>
                        <span>{section.videoCount || 0} videos</span>
                        <span>•</span>
                        <span>Order: {section.order + 1}</span>
                        <span>•</span>
                        <span>Created: {new Date(section.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleVisibility(section._id, section.visible)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        section.visible
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {section.visible ? 'Hide' : 'Show'}
                    </button>
                    
                    <Link
                      to={`/admin/sections/${section._id}`}
                      className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-sm font-medium"
                    >
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteSection(section._id)}
                      className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Preview of Videos */}
                {section.videos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Videos in this section:</h4>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {section.videos.sort((a, b) => a.order - b.order).map((videoItem) => (
                        <div
                          key={videoItem._id}
                          className="flex-shrink-0 w-32 bg-gray-50 rounded-lg p-2"
                        >
                          <div className="aspect-video bg-gray-200 rounded mb-2 overflow-hidden">
                          {/* Check if video exists AND is an object (not null) */}
{videoItem.video && typeof videoItem.video === 'object' && videoItem.video.thumbnailUrl ? (
<img
  src={getFullUrl(videoItem.video.thumbnailUrl)}
  alt={videoItem.title}
  className="w-full h-full object-cover"
/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {videoItem.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">How to reorder sections:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Drag and drop sections using the handle icon (≡)</li>
              <li>• Or use the up/down arrows next to each section</li>
              <li>• Changes are saved automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reordering Indicator */}
      {reordering && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reordering sections...
        </div>
      )}
    </div>
  );
};

export default SectionList;