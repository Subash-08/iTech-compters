import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import { baseURL } from '../config/config';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  objectFit?: 'contain' | 'cover';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onClick?: () => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  src,
  poster,
  className = '',
  loop = true,
  muted = true,
  controls = false,
  objectFit = 'cover',
  onPlay,
  onPause,
  onEnded,
  onClick
}, ref) => {
  const internalRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [error, setError] = useState<boolean>(false);

  useImperativeHandle(ref, () => internalRef.current as HTMLVideoElement);

  const getFullUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${baseURL}${url}`;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && internalRef.current && !internalRef.current.paused) {
          internalRef.current.pause();
        }
      },
      { threshold: 0.1 }
    );

    if (internalRef.current) observer.observe(internalRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className={`relative overflow-hidden bg-black w-full h-full ${className}`}
      style={{ 
        width: '100%',
        height: '100%',
        minHeight: '100%'
      }}
      onClick={onClick}
    >
      <video
        ref={internalRef}
        src={getFullUrl(src)}
        poster={getFullUrl(poster || '')}
        style={{ 
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: objectFit,
          objectPosition: 'center center',
          display: 'block'
        }}
        loop={loop}
        muted={isMuted}
        playsInline
        controls={controls}
        onPlay={() => {
          setIsPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setIsPlaying(false);
          onPause?.();
        }}
        onEnded={onEnded}
        onLoadedData={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <span className="text-white/50 text-xs">Video Unavailable</span>
        </div>
      )}

      {!controls && !isLoading && !error && (
        <>
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>

          {isPlaying && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full z-10">
              <div className="flex gap-0.5 items-end h-3">
                <span className="w-0.5 h-full bg-green-400 animate-[bounce_1s_infinite]" />
                <span className="w-0.5 h-2/3 bg-green-400 animate-[bounce_1s_infinite_0.2s]" />
                <span className="w-0.5 h-3/4 bg-green-400 animate-[bounce_1s_infinite_0.4s]" />
              </div>
              <span className="text-[10px] font-medium text-white tracking-wide uppercase">Now Playing</span>
            </div>
          )}

          <button 
            onClick={(e) => {
              e.stopPropagation();
              if(internalRef.current) {
                internalRef.current.muted = !internalRef.current.muted;
                setIsMuted(!isMuted);
              }
            }}
            className="absolute bottom-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-20"
          >
            {isMuted ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
          </button>
        </>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;