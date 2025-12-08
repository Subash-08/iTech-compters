// src/pages/admin/videos/VideoList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, VideoFilters } from '../types/video';
import { videoService } from '../services/videoService';
import { toast } from 'react-toastify';
import VideoCard from './VideoCard';
import SearchBar from '../common/SearchBar';
import FilterDropdown from '../common/FilterDropdown';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';

const VideoList: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VideoFilters>({
    search: '',
    isUsed: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await videoService.getVideos(filters);
      
      if (response.success) {
        setVideos(response.data.videos);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || 'Failed to fetch videos');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [filters.page, filters.search, filters.isUsed, filters.startDate, filters.endDate]);

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof VideoFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await videoService.deleteVideo(id);
      
      if (response.success) {
        toast.success('Video deleted successfully');
        fetchVideos(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to delete video');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete video');
    }
  };

  const getUsedFilterOptions = [
    { value: '', label: 'All Videos' },
    { value: 'true', label: 'Used in Sections' },
    { value: 'false', label: 'Not Used' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Video Library</h1>
          <p className="text-gray-600 mt-2">Manage all uploaded videos</p>
        </div>
        <Link
          to="/admin/videos/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Upload New Video
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <SearchBar
              placeholder="Search videos..."
              onSearch={handleSearch}
              delay={300}
            />
          </div>
          <div>
            <FilterDropdown
              label="Usage Status"
              options={getUsedFilterOptions}
              value={filters.isUsed}
              onChange={(value) => handleFilterChange('isUsed', value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Videos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Used Videos</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {videos.filter(v => v.isUsed).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Available</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {videos.filter(v => !v.isUsed).length}
          </p>
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No videos found</h3>
          <p className="text-gray-500 mb-6">
            {filters.search || filters.isUsed || filters.startDate || filters.endDate
              ? 'Try changing your filters'
              : 'Upload your first video to get started'}
          </p>
          <Link
            to="/admin/videos/upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Video
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onDelete={handleDeleteVideo}
                showActions={true}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoList;