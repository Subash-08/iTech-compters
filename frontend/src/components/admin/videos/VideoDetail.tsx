// src/pages/admin/videos/VideoDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoService } from '../services/videoService';
import { Video } from '../types/video';
import { toast } from 'react-toastify';
import VideoPlayer from './VideoPlayer';
import LoadingSpinner from '../common/LoadingSpinner';

const VideoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await videoService.getVideo(id!);
      
      if (response.success) {
        const videoData = response.data.video;
        setVideo(videoData);
        setFormData({
          title: videoData.title,
          description: videoData.description,
          tags: videoData.tags.join(', ')
        });
      } else {
        toast.error(response.message || 'Failed to fetch video');
        navigate('/admin/videos');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch video');
      navigate('/admin/videos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!video) return;

    try {
      setSaving(true);
      const response = await videoService.updateVideo(video._id, {
        ...formData,
        video: null,
        removeVideo: false
      });

      if (response.success) {
        toast.success('Video updated successfully');
        setVideo(response.data.video);
        setEditing(false);
      } else {
        toast.error(response.message || 'Failed to update video');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;

    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await videoService.deleteVideo(video._id);
      
      if (response.success) {
        toast.success('Video deleted successfully');
        navigate('/admin/videos');
      } else {
        toast.error(response.message || 'Failed to delete video');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete video');
    }
  };

  const getResolutionLabel = () => {
    if (!video) return '';
    const { width, height } = video.resolution;
    if (width === 0 || height === 0) return 'Unknown';
    return `${width} × ${height}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Video not found</h3>
          <button
            onClick={() => navigate('/admin/videos')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <button
            onClick={() => navigate('/admin/videos')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Videos
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Video Details</h1>
          <p className="text-gray-600 mt-2">Manage video information and settings</p>
        </div>
        <div className="flex space-x-3">
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Edit Video
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete Video
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Video Player & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Video Preview</h2>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                src={video.optimizedUrl || video.url}
                thumbnail={video.thumbnailUrl}
                autoplay={false}
                controls={true}
                muted={false}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Video Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Video Information</h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter video title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter video description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., product, showcase, tutorial"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p className="mt-1 text-gray-900">{video.title}</p>
                </div>
                {video.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">{video.description}</p>
                  </div>
                )}
                {video.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {video.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">File Size</span>
                  <span className="font-medium text-gray-900">{video.sizeFormatted}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Duration</span>
                  <span className="font-medium text-gray-900">{video.durationFormatted}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Resolution</span>
                  <span className="font-medium text-gray-900">{getResolutionLabel()}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Format</span>
                  <span className="font-medium text-gray-900 uppercase">{video.format}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Bitrate</span>
                  <span className="font-medium text-gray-900">
                    {video.bitrate ? `${Math.round(video.bitrate / 1000)} kbps` : 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Optimized</span>
                  <span className={`font-medium ${video.optimized ? 'text-green-600' : 'text-yellow-600'}`}>
                    {video.optimized ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`font-medium ${video.isUsed ? 'text-blue-600' : 'text-gray-600'}`}>
                    {video.isUsed ? 'In Use' : 'Available'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Uploaded</span>
                  <span className="font-medium text-gray-900">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <span className="font-medium text-gray-900">
                    {new Date(video.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">URLs</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Video URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={video.url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${video.url}`);
                      toast.success('URL copied to clipboard');
                    }}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200"
                  >
                    Copy
                  </button>
                </div>
              </div>
              {video.optimizedUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Optimized Video URL
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={video.optimizedUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${video.optimizedUrl}`);
                        toast.success('URL copied to clipboard');
                      }}
                      className="px-3 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              {video.thumbnailUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={video.thumbnailUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${video.thumbnailUrl}`);
                        toast.success('URL copied to clipboard');
                      }}
                      className="px-3 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {editing && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      title: video.title,
                      description: video.description,
                      tags: video.tags.join(', ')
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;