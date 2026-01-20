import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YTVideoFormData } from '../typeS/ytVideo';
import { ytVideoService } from '../services/ytVideoService';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';
import { Play, Video } from 'lucide-react';

const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const YTVideoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<YTVideoFormData>({
    title: '',
    videoUrl: '',
    isActive: true,
    order: 0
  });

  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      fetchVideo();
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (formData.videoUrl) {
        const id = extractYoutubeId(formData.videoUrl);
        setPreviewId(id);
    } else {
        setPreviewId(null);
    }
  }, [formData.videoUrl]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await ytVideoService.getAdminVideos();
      const video = response.data.find((v: any) => v._id === id);
      
      if (video) {
        setFormData({
          title: video.title,
          videoUrl: video.videoUrl,
          isActive: video.isActive,
          order: video.order
        });
      }
    } catch (err) {
      toast.error('Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewId) {
        toast.error("Invalid YouTube URL. Please check the link.");
        return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await ytVideoService.updateVideo(id!, formData);
        toast.success('YouTube video updated successfully');
      } else {
        await ytVideoService.createVideo(formData);
        toast.success('YouTube video added successfully');
      }
      navigate('/admin/yt-videos');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit YouTube Review' : 'Add New YouTube Review'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">YouTube URL *</label>
                    <input
                        type="text"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                        required
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Paste full link or share link</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Video Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Order</label>
                        <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({...formData, order: Number(e.target.value)})}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</span>
                {previewId ? (
                    <div className="w-full">
                        <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                            <img 
                                src={`https://img.youtube.com/vi/${previewId}/maxresdefault.jpg`} 
                                alt="Video Thumbnail"
                                className="w-full h-full object-cover"
                            />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                    <Play className="w-4 h-4 text-white fill-current" />
                                </div>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 text-center font-medium line-clamp-2">
                            {formData.title || "Video Title Preview"}
                        </p>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Enter a valid YouTube URL to see preview</p>
                    </div>
                )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/yt-videos')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !previewId}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <Icons.Loader className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? 'Update Video' : 'Add Video'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default YTVideoForm;