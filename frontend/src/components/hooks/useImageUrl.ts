// utils/urlUtils.ts

// 👇 Change this one URL for both development and production
import baseURL from '../config/config' // Replace with your actual domain

export const getImageUrl = (url?: string | null, placeholder: string = 'https://placehold.co/300x300?text=No+Image'): string => {
  if (!url) return placeholder;
  if (url.startsWith('http')) return url;
  return `${baseURL}${url.startsWith('/') ? url : '/' + url}`;
};

export const getAvatarUrl = (avatarPath?: string): string | null => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${baseURL}${avatarPath}`;
};

export const testImageLoad = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};