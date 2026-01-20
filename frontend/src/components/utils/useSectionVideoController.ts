import { useRef, useCallback } from 'react';

export function useSectionVideoController() {
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const activeIndex = useRef<number | null>(null);

  const register = useCallback((index: number, element: HTMLVideoElement | null) => {
    if (element) {
      videoRefs.current[index] = element;
    } else {
      delete videoRefs.current[index];
    }
  }, []);

  const play = useCallback((index: number) => {
    // 1. Pause everyone else
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      const i = parseInt(key);
      if (i !== index && video && !video.paused) {
        video.pause();
      }
    });

    // 2. Play the target
    const target = videoRefs.current[index];
    if (target) {
      target.muted = true; // Always mute for autoplay compliance
      target.play().catch((e) => console.warn('Playback failed:', e));
      activeIndex.current = index;
    }
  }, []);

  const pauseAll = useCallback(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video && !video.paused) video.pause();
    });
    activeIndex.current = null;
  }, []);

  const toggle = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      play(index);
    } else {
      video.pause();
    }
  }, [play]);

  return { register, play, pauseAll, toggle, activeIndex };
}