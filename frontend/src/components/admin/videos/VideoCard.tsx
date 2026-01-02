// src/components/admin/VideoCard.tsx
import React, { useState } from 'react'; // Import useState
import { Link } from 'react-router-dom';
import { Video } from '../types/video';
import { getImageUrl } from '../../utils/imageUtils'; 

interface VideoCardProps {
  video: Video;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onDelete, 
  showActions = true,
  compact = false 
}) => {
  // 1. Initialize State for image errors
  const [imageError, setImageError] = useState(false);

  const getResolutionLabel = () => {
    // 2. Safety check: Ensure resolution exists before destructuring
    const { width, height } = video.resolution || { width: 0, height: 0 };
    
    if (width === 0 || height === 0) return 'Unknown';
    if (width >= 1920) return 'Full HD';
    if (width >= 1280) return 'HD';
    if (width >= 854) return 'SD';
    return 'Low';
  };

  const thumbnailUrl = getImageUrl(video.thumbnailUrl || video.thumbnail);

  const getVideoPlaceholder = (title: string) => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 p-4">
        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-gray-500 text-center truncate max-w-full">
          {title || 'Video'}
        </span>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
      compact ? 'p-3' : 'p-4'
    }`}>
      {/* Thumbnail */}
      <div className="relative mb-3">
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
          {/* 3. Logic Update: Check imageError here */}
          {thumbnailUrl && !thumbnailUrl.includes('placeholder') && !imageError ? (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              // 4. Fix: Use state instead of manual DOM manipulation
              onError={() => setImageError(true)}
            />
          ) : (
            getVideoPlaceholder(video.title)
          )}
        </div>
        
        {video.durationFormatted && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {video.durationFormatted}
          </div>
        )}
        
        {video.optimized && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Optimized
          </div>
        )}
        
        {video.isUsed && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            In Use
          </div>
        )}
        
        {video.hasCustomThumbnail && (
          <div className="absolute top-2 left-10 bg-purple-500 text-white text-xs px-2 py-1 rounded">
            Custom
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        <div className="flex items-start justify-between">
          <h3 className={`font-medium text-gray-800 truncate flex-1 ${
            compact ? 'text-sm' : 'text-base'
          }`}>
            {video.title || video.originalName}
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded ml-2">
            {video.format?.toUpperCase() || 'MP4'}
          </span>
        </div>
        
        {!compact && (
          <>
            {video.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {video.description}
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {/* 5. Safety Check: video.size might be undefined initially */}
                {video.sizeFormatted || formatFileSize(video.size || 0)}
              </div>
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3" />
                </svg>
                {getResolutionLabel()}
              </div>
            </div>
            
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
                {video.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{video.tags.length - 3}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className={`flex justify-between items-center ${
          compact ? 'mt-2' : 'mt-4'
        }`}>
          <span className="text-xs text-gray-500">
            {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'N/A'}
          </span>
          
          <div className="flex space-x-2">
            <Link
              to={`/admin/videos/${video._id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              {compact ? 'View' : 'Details'}
            </Link>
            
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(video._id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes'; // Handle undefined/null bytes
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default VideoCard;