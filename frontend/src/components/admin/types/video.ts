// src/types/video.ts
export interface VideoResolution {
  width: number;
  height: number;
}
// src/types/video.ts
export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

export interface Video {
  _id: string;
  filename: string;
  originalName: string;
  title: string;
  description: string;
  path: string;
  url: string;
  thumbnail: string; // Path to thumbnail file
  thumbnailUrl: string; // URL for thumbnail
  hasCustomThumbnail: boolean; // New field
  optimizedUrl: string;
  duration: number;
  size: number;
  sizeFormatted: string;
  format: string;
  resolution: {
    width: number;
    height: number;
  };
  bitrate: number;
  optimized: boolean;
  tags: string[];
  isUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VideoResponse {
  success: boolean;
  message: string;
  data: {
    video?: Video;
    videos?: Video[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    video?: Video;
    videos?: Video[];
    thumbnailUrl?: string;
  };
}

// Add this for thumbnail update response
export interface ThumbnailUpdateResponse {
  success: boolean;
  message: string;
  data: {
    thumbnailUrl: string;
  };
}

export interface VideoFormData {
  title: string;
  description: string;
  tags: string;
  video?: File | null;
  removeVideo?: boolean;
}

export interface VideoFilters {
  search: string;
  isUsed: string; // 'true', 'false', or ''
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}