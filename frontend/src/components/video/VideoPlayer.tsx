// src/components/video/VideoPlayer.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { baseURL } from '../config/config';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  playsInline?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  volume?: number;
  lazyLoad?: boolean;
  intersectionThreshold?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  className = '',
  playsInline = true,
  preload = 'auto',
  onPlay,
  onPause,
  onEnded,
  onError,
  volume = 1,
  lazyLoad = true,
  intersectionThreshold = 0.5
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInView, setIsInView] = useState(!lazyLoad);
  const [hasLoaded, setHasLoaded] = useState(false);

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

  // Get full URLs for src and poster
  const fullVideoSrc = getFullUrl(src);
  const fullPosterSrc = poster ? getFullUrl(poster) : undefined;
  useEffect(() => {
    if (!lazyLoad || !autoplay || !videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          
          if (entry.isIntersecting && autoplay && videoRef.current) {
            videoRef.current.play().catch(e => {
              console.warn('Autoplay failed:', e);
            });
          } else if (!entry.isIntersecting && videoRef.current && !loop) {
            videoRef.current.pause();
          }
        });
      },
      {
        threshold: intersectionThreshold,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [autoplay, lazyLoad, loop, intersectionThreshold]);

  // Load video source when in view
  useEffect(() => {
    if (isInView && videoRef.current && !hasLoaded) {
      videoRef.current.load();
      setHasLoaded(true);
    }
  }, [isInView, hasLoaded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = (e: Event) => {
      console.error('Video error:', {
        videoError: video.error,
        src: fullVideoSrc,
        networkState: video.networkState,
        readyState: video.readyState
      });
      setError(`Failed to load video: ${video.error?.message || 'Unknown error'}`);
      onError?.(video.error);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    // Set volume
    video.volume = volume;

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [volume, onPlay, onPause, onEnded, onError, fullVideoSrc]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(e => {
        console.warn('Play failed:', e);
      });
    }
  }, [isPlaying]);

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleOpenInNewTab = () => {
    window.open(fullVideoSrc, '_blank');
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden  ${className}`}>
      {/* Video element with lazy loading */}
      <video
        ref={videoRef}
        src={isInView ? fullVideoSrc : undefined}
        poster={isInView ? fullPosterSrc : undefined}
        autoPlay={autoplay && isInView}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline={playsInline}
        preload={isInView ? preload : 'none'}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: isLoading ? 0 : 1 }}
        crossOrigin="anonymous"
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center">
          <div className="text-center p-4 max-w-md">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-2">Failed to load video</p>
            <p className="text-gray-300 text-sm mb-4 break-all">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Open in new tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Controls (optional) */}
      {!controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 transition-opacity duration-300 hover:opacity-100 opacity-0 group-hover:opacity-100">
          <div className="flex items-center space-x-4">
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors transform hover:scale-110"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <div className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Progress bar */}
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
              />
            </div>

            {/* Volume control (optional) */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !videoRef.current.muted;
                }
              }}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;