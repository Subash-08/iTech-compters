import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { YTVideoItem } from '../types/ytVideo';
import { ytVideoService } from '../services/ytvideoService';
import YTVideoTable from './YTVideoTable';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';

const YTVideoList: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<YTVideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await ytVideoService.getAdminVideos();
      setVideos(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await ytVideoService.deleteVideo(id);
      toast.success('Video deleted successfully');
      fetchVideos();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete video');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tech Reviews (YouTube)</h1>
          <p className="text-gray-600">Manage YouTube video showcase</p>
        </div>
        <button
          onClick={() => navigate('/admin/yt-videos/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>Add YouTube Video</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <YTVideoTable
          videos={videos}
          loading={loading}
          onDelete={handleDelete}
          onEdit={(id) => navigate(`/admin/yt-videos/edit/${id}`)}
        />
      </div>
    </div>
  );
};

export default YTVideoList;