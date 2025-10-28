// utils/urlUtils.ts

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getImageUrl = (url?: string | null, placeholder: string = 'https://placehold.co/300x300?text=No+Image'): string => {
  if (!url) return placeholder;
  if (url.startsWith('http')) return url;
  return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
};

export const getAvatarUrl = (avatarPath?: string): string | null => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${baseUrl}${avatarPath}`;
};

export const testImageLoad = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};