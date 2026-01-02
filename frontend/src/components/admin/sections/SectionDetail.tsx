// src/pages/admin/sections/SectionDetail.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Section, SectionVideo, Video } from '../types/section';
import { sectionService } from '../services/sectionService';
import { videoService } from '../services/videoService';
import { toast } from 'react-toastify';
import VideoPlayer from '../videos/VideoPlayer';
import VideoSelectionModal from '../videos/VideoSelectionModal';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationModal from '../common/ConfirmationModal';
import { baseURL } from '../../config/config';

const SectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSection();
    }
  }, [id]);

  const fetchSection = async () => {
    try {
      setLoading(true);
      const response = await sectionService.getSection(id!);
      
      if (response.success) {
        setSection(response.data.section);
      } else {
        toast.error(response.message || 'Failed to fetch section');
        navigate('/admin/sections');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch section');
      navigate('/admin/sections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideos = async (videoIds: string[]) => {
    if (!section) return;

    try {
      const addPromises = videoIds.map(videoId =>
        videoService.addVideoToSection(section._id, videoId, {
          autoplay: false,
          loop: false,
          muted: true,
          controls: true,
          playsInline: true
        })
      );

      await Promise.all(addPromises);
      toast.success(`${videoIds.length} video(s) added to section`);
      fetchSection();
      setShowVideoModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add videos');
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!section) return;

    try {
      const response = await videoService.removeVideoFromSection(section._id, videoId);
      
      if (response.success) {
        toast.success('Video removed from section');
        fetchSection();
        setShowDeleteModal(false);
        setVideoToDelete(null);
      } else {
        toast.error(response.message || 'Failed to remove video');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove video');
    }
  };

  // Drag and Drop Handlers for videos
  const handleVideoDragStart = (e: React.DragEvent<HTMLDivElement>, videoId: string) => {
    setDraggedItem(videoId);
    e.dataTransfer.setData('text/plain', videoId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual effect
    const target = e.currentTarget;
    target.classList.add('opacity-50', 'border-blue-500');
  };

  const handleVideoDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.classList.remove('opacity-50', 'border-blue-500');
    setDraggedItem(null);
  };

  const handleVideoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add hover effect
    const target = e.currentTarget;
    if (!target.classList.contains('drag-over')) {
      target.classList.add('drag-over', 'border-blue-300');
    }
  };

  const handleVideoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.classList.remove('drag-over', 'border-blue-300');
  };

  const handleVideoDrop = async (e: React.DragEvent<HTMLDivElement>, targetVideoId: string) => {
    e.preventDefault();
    
    const sourceVideoId = e.dataTransfer.getData('text/plain');
    if (!sourceVideoId || sourceVideoId === targetVideoId || !section) {
      e.currentTarget.classList.remove('drag-over', 'border-blue-300');
      return;
    }

    // Remove hover effect
    e.currentTarget.classList.remove('drag-over', 'border-blue-300');

    // Find indices
    const sortedVideos = [...section.videos].sort((a, b) => a.order - b.order);
    const sourceIndex = sortedVideos.findIndex(v => v._id === sourceVideoId);
    const targetIndex = sortedVideos.findIndex(v => v._id === targetVideoId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;

    // Reorder locally
    const newVideos = [...sortedVideos];
    const [removed] = newVideos.splice(sourceIndex, 1);
    newVideos.splice(targetIndex, 0, removed);

    // Update order numbers
    const updatedVideos = newVideos.map((video, index) => ({
      ...video,
      order: index
    }));

    setSection(prev => prev ? { ...prev, videos: updatedVideos } : null);
    setReordering(true);

    try {
      const reorderData = updatedVideos.map((video, index) => ({
        videoId: video._id,
        order: index
      }));

      const response = await videoService.reorderVideosInSection(section._id, reorderData);
      
      if (!response.success) {
        toast.error(response.message || 'Failed to reorder videos');
        // Revert on error
        fetchSection();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reorder videos');
      // Revert on error
      fetchSection();
    } finally {
      setReordering(false);
    }
  };

  // Manual reorder functions
  const moveVideoUp = async (videoId: string) => {
    if (!section) return;

    const sortedVideos = [...section.videos].sort((a, b) => a.order - b.order);
    const index = sortedVideos.findIndex(v => v._id === videoId);
    
    if (index === 0) return;

    const newVideos = [...sortedVideos];
    [newVideos[index], newVideos[index - 1]] = [newVideos[index - 1], newVideos[index]];
    
    // Update order numbers
    const updatedVideos = newVideos.map((video, idx) => ({
      ...video,
      order: idx
    }));

    setSection(prev => prev ? { ...prev, videos: updatedVideos } : null);
    await saveVideoReorder(updatedVideos);
  };

  const moveVideoDown = async (videoId: string) => {
    if (!section) return;

    const sortedVideos = [...section.videos].sort((a, b) => a.order - b.order);
    const index = sortedVideos.findIndex(v => v._id === videoId);
    
    if (index === sortedVideos.length - 1) return;

    const newVideos = [...sortedVideos];
    [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
    
    // Update order numbers
    const updatedVideos = newVideos.map((video, idx) => ({
      ...video,
      order: idx
    }));

    setSection(prev => prev ? { ...prev, videos: updatedVideos } : null);
    await saveVideoReorder(updatedVideos);
  };

  const saveVideoReorder = async (videosToSave: SectionVideo[]) => {
    if (!section) return;

    setReordering(true);
    try {
      const reorderData = videosToSave.map((video, index) => ({
        videoId: video._id,
        order: index
      }));

      const response = await videoService.reorderVideosInSection(section._id, reorderData);
      
      if (!response.success) {
        toast.error(response.message || 'Failed to reorder videos');
        // Revert on error
        fetchSection();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reorder videos');
      // Revert on error
      fetchSection();
    } finally {
      setReordering(false);
    }
  };

  const handleUpdateVideoSettings = async (videoId: string, settings: any) => {
    if (!section) return;

    try {
      const response = await videoService.updateVideoInSection(section._id, videoId, settings);
      
      if (response.success) {
        toast.success('Video settings updated');
        setEditingVideo(null);
        fetchSection();
      } else {
        toast.error(response.message || 'Failed to update video');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update video');
    }
  };
  // Helper function to get full URL
  const getFullUrl = (url: string): string => {
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
const getVideoUrl = (video: Video | null) => {
    if (!video) return ''; // Add this safety check
    
    // Check for full URLs vs relative paths
    const url = video.optimizedUrl || video.url;
    if (!url) return '';
    
    if (url.startsWith('http')) return url;
    const backendUrl = process.env.REACT_APP_API_URL || baseURL;
    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

  const getVideoThumbnail = (videoItem: SectionVideo) => {
    if (typeof videoItem.video === 'object') {
      const thumbnailUrl = (videoItem.video as Video).thumbnailUrl;
      return getFullUrl(thumbnailUrl);
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Section not found</h3>
          <button
            onClick={() => navigate('/admin/sections')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Back to Sections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <button
            onClick={() => navigate('/admin/sections')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sections
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{section.title}</h1>
          <p className="text-gray-600 mt-2">Manage videos in this section</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/admin/sections/${section._id}/edit`)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Edit Section
          </button>
          <button
            onClick={() => setShowVideoModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Videos
          </button>
        </div>
      </div>

      {/* Section Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Layout Type</h3>
            <p className="mt-1 font-medium text-gray-900 capitalize">{section.layoutType}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Visibility</h3>
            <p className="mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                section.visible 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {section.visible ? 'Visible' : 'Hidden'}
              </span>
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Videos Count</h3>
            <p className="mt-1 font-medium text-gray-900">{section.videos.length}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Order</h3>
            <p className="mt-1 font-medium text-gray-900">{section.order + 1}</p>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Videos in Section</h2>
              <p className="text-gray-600 mt-1">Drag to reorder videos within this section</p>
            </div>
            <div className="text-sm text-gray-500">
              {section.videos.length} video{section.videos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Videos */}
        {section.videos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No videos in this section</h3>
            <p className="text-gray-500 mb-6">Add videos to display in this section</p>
            <button
              onClick={() => setShowVideoModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Videos
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {section.videos.sort((a, b) => a.order - b.order).map((videoItem) => (
              <div
                key={videoItem._id}
                draggable="true"
                onDragStart={(e) => handleVideoDragStart(e, videoItem._id)}
                onDragEnd={handleVideoDragEnd}
                onDragOver={handleVideoDragOver}
                onDragLeave={handleVideoDragLeave}
                onDrop={(e) => handleVideoDrop(e, videoItem._id)}
                className={`p-6 hover:bg-gray-50 transition-all duration-200 cursor-move ${
                  draggedItem === videoItem._id ? 'opacity-50 border-blue-500' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Drag Handle and Reorder Buttons */}
                  <div className="lg:w-20 flex-shrink-0 flex flex-col items-center space-y-4">
                    <div className="text-gray-400 hover:text-gray-600 cursor-move">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    
                    {/* Manual reorder buttons */}
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => moveVideoUp(videoItem._id)}
                        className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        title="Move up"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveVideoDown(videoItem._id)}
                        className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        title="Move down"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 pt-2">
                      Order: {videoItem.order + 1}
                    </div>
                  </div>

                  {/* Video Preview */}
                  <div className="flex-1">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                      src={getVideoUrl(videoItem)}
                      thumbnail={getVideoThumbnail(videoItem)}
                      autoplay={false}
                      muted={true}
                      controls={true}
                      className="w-full h-full"
                      showCustomControls={true}
                    />
                    </div>
                  </div>

                  {/* Video Details */}
                  <div className="flex-1 lg:max-w-md">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {videoItem.title || (typeof videoItem.video === 'object' ? (videoItem.video as Video).title : 'Untitled')}
                      </h3>
                      {videoItem.description && (
                        <p className="text-gray-600 mb-3">{videoItem.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        {typeof videoItem.video === 'object' && (
                          <>
                            <span>{(videoItem.video as Video).durationFormatted}</span>
                            <span>•</span>
                            <span>{(videoItem.video as Video).sizeFormatted}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Video Settings */}
                    {editingVideo === videoItem._id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            defaultValue={videoItem.title}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            id={`title-${videoItem._id}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            defaultValue={videoItem.description}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            id={`description-${videoItem._id}`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              defaultChecked={videoItem.settings.autoplay}
                              className="h-4 w-4 text-blue-600 rounded"
                              id={`autoplay-${videoItem._id}`}
                            />
                            <label className="ml-2 text-sm text-gray-700">Autoplay</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              defaultChecked={videoItem.settings.loop}
                              className="h-4 w-4 text-blue-600 rounded"
                              id={`loop-${videoItem._id}`}
                            />
                            <label className="ml-2 text-sm text-gray-700">Loop</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              defaultChecked={videoItem.settings.muted}
                              className="h-4 w-4 text-blue-600 rounded"
                              id={`muted-${videoItem._id}`}
                            />
                            <label className="ml-2 text-sm text-gray-700">Muted</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              defaultChecked={videoItem.settings.controls}
                              className="h-4 w-4 text-blue-600 rounded"
                              id={`controls-${videoItem._id}`}
                            />
                            <label className="ml-2 text-sm text-gray-700">Controls</label>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              handleUpdateVideoSettings(videoItem._id, {
                                title: (document.getElementById(`title-${videoItem._id}`) as HTMLInputElement)?.value,
                                description: (document.getElementById(`description-${videoItem._id}`) as HTMLTextAreaElement)?.value,
                                settings: {
                                  autoplay: (document.getElementById(`autoplay-${videoItem._id}`) as HTMLInputElement)?.checked,
                                  loop: (document.getElementById(`loop-${videoItem._id}`) as HTMLInputElement)?.checked,
                                  muted: (document.getElementById(`muted-${videoItem._id}`) as HTMLInputElement)?.checked,
                                  controls: (document.getElementById(`controls-${videoItem._id}`) as HTMLInputElement)?.checked,
                                  playsInline: videoItem.settings.playsInline
                                }
                              });
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingVideo(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Settings</h4>
                        <div className="flex flex-wrap gap-2">
                          {videoItem.settings.autoplay && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Autoplay
                            </span>
                          )}
                          {videoItem.settings.loop && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Loop
                            </span>
                          )}
                          {videoItem.settings.muted && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Muted
                            </span>
                          )}
                          {videoItem.settings.controls && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              Controls
                            </span>
                          )}
                          {videoItem.settings.playsInline && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              Plays Inline
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:w-32 flex-shrink-0 flex flex-col space-y-2">
                    <button
                      onClick={() => setEditingVideo(editingVideo === videoItem._id ? null : videoItem._id)}
                      className="w-full px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium"
                    >
                      {editingVideo === videoItem._id ? 'Cancel Edit' : 'Edit Settings'}
                    </button>
                    <button
                      onClick={() => {
                        setVideoToDelete(videoItem._id);
                        setShowDeleteModal(true);
                      }}
                      className="w-full px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {section.videos.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  Drag and drop videos or use the arrows to reorder them in the section
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Order determines the display sequence in the section
                </p>
              </div>
              <button
                onClick={() => setShowVideoModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Add More Videos
              </button>
            </div>
          </div>
        )}
      </div>
<VideoSelectionModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onSelect={(videoId) => handleAddVideos([videoId])}
        // FIX: Filter out null videos first
        selectedVideos={section.videos
          .filter(v => v.video !== null && v.video !== undefined)
          .map(v => typeof v.video === 'string' ? v.video : v.video._id)
        }
        multiple={true}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Remove Video from Section"
        message="Are you sure you want to remove this video from the section? The video will remain in your library."
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
        onConfirm={() => videoToDelete && handleRemoveVideo(videoToDelete)}
        onCancel={() => {
          setShowDeleteModal(false);
          setVideoToDelete(null);
        }}
      />

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">How to manage videos:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Drag and drop videos using the handle icon (≡) to reorder</li>
              <li>• Use the up/down arrows for precise control</li>
              <li>• Click "Edit Settings" to modify individual video settings</li>
              <li>• Click "Remove" to take a video out of this section</li>
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
          Saving order changes...
        </div>
      )}
    </div>
  );
};

export default SectionDetail;