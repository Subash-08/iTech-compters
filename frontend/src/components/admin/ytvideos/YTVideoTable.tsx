import React from 'react';
import { YTVideoItem } from '../types/ytVideo';
import { Icons } from '../Icon';
import { Play } from 'lucide-react';

interface Props {
  videos: YTVideoItem[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const YTVideoTable: React.FC<Props> = ({ videos, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <Icons.Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-gray-600">Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return <div className="p-8 text-center text-gray-600">No YouTube videos found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thumbnail</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {videos.map((video) => (
            <tr key={video._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="relative w-24 h-14 group">
                    <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover rounded-md border border-gray-200"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                        <Play className="w-6 h-6 text-white" />
                    </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</div>
                <a href={video.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View on YouTube</a>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {video.videoId}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {video.order}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  video.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {video.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button onClick={() => onEdit(video._id)} className="text-blue-600 hover:text-blue-900 p-1">
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(video._id)} className="text-red-600 hover:text-red-900 p-1">
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default YTVideoTable;