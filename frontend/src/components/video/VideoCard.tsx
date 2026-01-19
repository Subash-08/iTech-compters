// src/components/video/VideoCard.tsx
import React, { useState } from 'react';
import { Video } from '../admin/types/video';
import VideoPlayer from './VideoPlayer';
import { getImageUrl } from '../utils/imageUtils';

interface VideoCardProps {
  video: Video;
  layout?: 'card' | 'grid' | 'masonry' | 'reels';
  showActions?: boolean;
  compact?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  className?: string;
  onClick?: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  layout = 'card',
  showActions = false,
  compact = false,
  autoplay = false,
  muted = true,
  className = '',
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailUrl = getImageUrl(video.thumbnailUrl || video.thumbnail);

  const getCardClasses = () => {
    const baseClasses = 'bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group';
    
    switch (layout) {
      case 'card':
        return `${baseClasses} ${compact ? 'p-2' : 'p-4'}`;
      case 'grid':
        return `${baseClasses} ${compact ? 'p-2' : 'p-3'}`;
      case 'masonry':
        return `${baseClasses} ${compact ? 'p-1' : 'p-2'}`;
        case 'reels':
        return `${baseClasses} ${compact ? 'p-1' : 'p-2'} h-[500px]`;
      default:
        return `${baseClasses} ${compact ? 'p-2' : 'p-4'}`;
    }
  };

  const getVideoPlayerClasses = () => {
    switch (layout) {
      case 'card':
        return 'h-48 md:h-56';
      case 'grid':
        return 'h-40';
      case 'masonry':
        return 'h-64';
      default:
        return 'h-48';
    }
  };

  const handleClick = () => {
    onClick?.(video);
  };

  return (
    <div
      className={`${getCardClasses()} ${className} transform hover:-translate-y-1 cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Video Player */}
      <div className="relative overflow-hidden rounded-lg mb-3">
        <VideoPlayer
          src={video.url}
          poster={thumbnailUrl}
          autoplay={autoplay && isHovered}
          loop={true}
          muted={muted}
          controls={false}
          className={getVideoPlayerClasses()}
          lazyLoad={true}
          intersectionThreshold={0.3}
        />
        
        {/* Duration Badge */}
        {/* <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {video.durationFormatted}
        </div> */}
        
        {/* Play Button Overlay */}
        {!isHovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className={`${compact ? 'space-y-1' : 'space-y-2'}`}>
        <h3 className={`font-semibold text-gray-800 truncate ${
          compact ? 'text-sm' : 'text-base'
        }`}>
          {video.title || video.originalName}
        </h3>
        
        {/* {!compact && video.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {video.description}
          </p>
        )} */}
        
        {/* Metadata */}
        {/* <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {video.format?.toUpperCase()}
            </span>
            {video.isUsed && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                In Use
              </span>
            )}
          </div>
          <span>{video.sizeFormatted}</span>
        </div> */}
        
        {/* Tags */}
        {/* {video.tags && video.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 pt-2">
            {video.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
              >
                {tag}
              </span>
            ))}
            {video.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{video.tags.length - 2}</span>
            )}
          </div>
        )} */}
      </div>

    </div>
  );
};

export default VideoCard;