// src/components/admin/VideoSelectionModal.tsx
import React, { useState, useEffect } from 'react';
import { Video } from '../types/video';
import { videoService } from '../services/videoService';
import VideoCard from './VideoCard';
import LoadingSpinner from '../common/LoadingSpinner';

interface VideoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (videoId: string) => void;
  selectedVideos?: string[]; // Already selected video IDs
  multiple?: boolean;
}

const VideoSelectionModal: React.FC<VideoSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedVideos = [],
  multiple = false
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>(selectedVideos);
  const [filterUsed, setFilterUsed] = useState<'all' | 'used' | 'unused'>('unused');

  useEffect(() => {
    if (isOpen) {
      fetchVideos();
    }
  }, [isOpen]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm,
        isUsed: filterUsed === 'all' ? '' : filterUsed === 'used' ? 'true' : 'false',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 50
      };
      
      const response = await videoService.getVideos(filters);
      
      if (response.success) {
        setVideos(response.data.videos);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Debounce search
    const timer = setTimeout(() => {
      fetchVideos();
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleVideoSelect = (videoId: string) => {
    if (multiple) {
      setSelectedVideoIds(prev => 
        prev.includes(videoId)
          ? prev.filter(id => id !== videoId)
          : [...prev, videoId]
      );
    } else {
      setSelectedVideoIds([videoId]);
    }
  };

  const handleConfirmSelection = () => {
    if (multiple) {
      selectedVideoIds.forEach(videoId => onSelect(videoId));
    } else if (selectedVideoIds.length > 0) {
      onSelect(selectedVideoIds[0]);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Select Video{multiple ? 's' : ''}
                </h2>
                <p className="text-gray-600 mt-1">
                  Choose video{multiple ? 's' : ''} to add to section
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterUsed('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterUsed === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Videos
                </button>
                <button
                  onClick={() => setFilterUsed('unused')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterUsed === 'unused'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => setFilterUsed('used')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterUsed === 'used'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  In Use
                </button>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No videos found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try a different search term' : 'No videos available for selection'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <div
                    key={video._id}
                    onClick={() => handleVideoSelect(video._id)}
                    className={`cursor-pointer transition-all ${
                      selectedVideoIds.includes(video._id)
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                  >
                    <VideoCard
                      video={video}
                      showActions={false}
                      compact={true}
                    />
                    <div className="mt-2 text-center">
                      <div className="inline-flex items-center">
                        <input
                          type={multiple ? 'checkbox' : 'radio'}
                          checked={selectedVideoIds.includes(video._id)}
                          onChange={() => handleVideoSelect(video._id)}
                          className={multiple ? 'h-4 w-4 text-blue-600 rounded' : 'h-4 w-4 text-blue-600'}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {multiple ? 'Select' : 'Select Video'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                {multiple ? (
                  <p className="text-gray-600">
                    {selectedVideoIds.length} video{selectedVideoIds.length !== 1 ? 's' : ''} selected
                  </p>
                ) : (
                  <p className="text-gray-600">
                    {selectedVideoIds.length > 0 ? '1 video selected' : 'No video selected'}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedVideoIds.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {multiple ? `Add ${selectedVideoIds.length} Video${selectedVideoIds.length !== 1 ? 's' : ''}` : 'Add Video'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSelectionModal;