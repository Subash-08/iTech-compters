// utils/imageUtils.ts
export const getImageUrl = (image: any): string => {
  if (!image) return '/placeholder-image.jpg';

  // If it's already a full URL
  if (typeof image === 'string' && image.startsWith('http')) {
    return image;
  }

  // If it's an object with url property
  if (image.url && typeof image.url === 'string') {
    if (image.url.startsWith('http')) {
      return image.url;
    }
    // Handle relative URLs - adjust base URL as needed
    const baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : 'http://localhost:5000';
    return `${baseURL}${image.url.startsWith('/') ? image.url : '/' + image.url}`;
  }

  return '/placeholder-image.jpg';
};