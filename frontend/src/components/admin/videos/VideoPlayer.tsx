// src/components/admin/VideoPlayer.tsx
import React, { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  thumbnail,
  autoplay = false,
  muted = true,
  controls = true,
  loop = false,
  playsInline = true,
  className = '',
  onPlay,
  onPause,
  onEnd
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [showCustomControls, setShowCustomControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const handleEnd = () => {
      setIsPlaying(false);
      onEnd?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnd);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnd);
    };
  }, [onPlay, onPause, onEnd]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(e => {
        console.error('Play failed:', e);
        // If autoplay is blocked, try playing with user interaction
        if (e.name === 'NotAllowedError') {
          video.muted = true;
          video.play().then(() => {
            setIsMuted(true);
            setVolume(0);
          });
        }
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = 0.5;
      setVolume(0.5);
    } else {
      video.muted = true;
      video.volume = 0;
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const video = videoRef.current;
    
    if (video) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={() => setShowCustomControls(true)}
      onMouseLeave={() => setShowCustomControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        autoPlay={autoplay}
        muted={muted}
        controls={false} // We'll use custom controls
        loop={loop}
        playsInline={playsInline}
        preload="metadata"
        className="w-full h-full object-contain"
      />

      {/* Custom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showCustomControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M5.25 9a.75.75 0 01.75-.75H15a3 3 0 013 3v1.5a3 3 0 01-3 3H6a.75.75 0 01-.75-.75V9zm1.5 1.5v3H15a1.5 1.5 0 001.5-1.5V12a1.5 1.5 0 00-1.5-1.5H6.75z" clipRule="evenodd" />
                    <path d="M19.28 8.22a.75.75 0 10-1.06 1.06L20.44 12l-2.22 2.22a.75.75 0 101.06 1.06l2.22-2.22 2.22 2.22a.75.75 0 101.06-1.06L22.56 12l2.22-2.22a.75.75 0 00-1.06-1.06l-2.22 2.22-2.22-2.22z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M11.26 3.691A1.2 1.2 0 0112 4.8v14.4a1.2 1.2 0 01-2.048.848L5.503 15.6H2.4a1.2 1.2 0 01-1.2-1.2V9.6a1.2 1.2 0 011.2-1.2h3.103l4.449-4.448a1.2 1.2 0 011.308-.26z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M11.26 3.691A1.2 1.2 0 0112 4.8v14.4a1.2 1.2 0 01-2.048.848L5.503 15.6H2.4a1.2 1.2 0 01-1.2-1.2V9.6a1.2 1.2 0 011.2-1.2h3.103l4.449-4.448a1.2 1.2 0 011.308-.26zM18 9a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0118 9zm-3 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Fullscreen"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M3.22 3.22a.75.75 0 011.06 0l3.97 3.97V4.5a.75.75 0 011.5 0V9A.75.75 0 019 9.75H4.5a.75.75 0 010-1.5h2.69L3.22 4.28a.75.75 0 010-1.06zm17.56 0a.75.75 0 010 1.06l-3.97 3.97h2.69a.75.75 0 010 1.5H15A.75.75 0 0115 9V4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0zM3.75 15a.75.75 0 01.75-.75H9A.75.75 0 019 15v4.5a.75.75 0 01-1.5 0v-2.69l-3.97 3.97a.75.75 0 01-1.06-1.06l3.97-3.97H4.5a.75.75 0 01-.75-.75zm16.5 0a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75V20a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm1.5.75v3h3v-3h-3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Play Button Overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group"
          aria-label="Play video"
        >
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-black/70 transition-colors">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;