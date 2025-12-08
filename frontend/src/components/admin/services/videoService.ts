// src/services/videoService.ts
import api from '../../config/axiosConfig';
import { Video, UploadProgress, VideoFilters, VideoFormData } from '../types/video';
import { Section } from '../types/section';

// Corrected: Type alias instead of interface
export type UploadProgressCallback = (progress: UploadProgress) => void;

export interface UploadResponse {
  success: boolean;
  message: string;
  data: any;
}

export const videoService = {
  // Get all videos with filters (alias for getAllVideos)
  async getVideos(filters: VideoFilters = {
    search: '',
    isUsed: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  }) {
    const params: any = {};
    if (filters.search) params.search = filters.search;
    if (filters.isUsed !== undefined && filters.isUsed !== '') {
      params.isUsed = filters.isUsed === 'true';
    }
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    params.page = filters.page || 1;
    params.limit = filters.limit || 20;

    const response = await api.get('/videos', { params });
    return response.data;
  },

  // Get all videos with filters (alias for getVideos)
  getAllVideos: async function(filters: VideoFilters = {
    search: '',
    isUsed: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  }) {
    return this.getVideos(filters);
  },

  // Get single video (alias for getVideoById)
  async getVideo(id: string) {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  // Get single video by ID
  async getVideoById(id: string) {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  // Get unused videos (if endpoint exists)
  async getUnusedVideos() {
    const response = await api.get('/videos/unused');
    return response.data;
  },

  // Get visible sections for homepage
  async getVisibleSections() {
    const response = await api.get('/sections/visible');
    return response.data;
  },

  // Get all sections (admin)
  async getAllSections() {
    const response = await api.get('/sections');
    return response.data;
  },

  // Get section by ID
  async getSectionById(id: string) {
    const response = await api.get(`/sections/${id}`);
    return response.data;
  },

  // Upload video with thumbnail
  async uploadVideo(formData: FormData, onProgress?: UploadProgressCallback) {
    const response = await api.post('/videos/upload-with-thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            percent,
            loaded: progressEvent.loaded,
            total: progressEvent.total,
          });
        }
      },
    });
    return response.data;
  },

  // Upload multiple videos with thumbnails
  async uploadMultipleVideos(formData: FormData, onProgress?: UploadProgressCallback) {
    const response = await api.post('/videos/upload-multiple-with-thumbnails', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            percent,
            loaded: progressEvent.loaded,
            total: progressEvent.total,
          });
        }
      },
    });
    return response.data;
  },

  // Update thumbnail for existing video
  async updateThumbnail(videoId: string, thumbnailFile: File) {
    const formData = new FormData();
    formData.append('thumbnail', thumbnailFile);

    const response = await api.post(`/videos/${videoId}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Regenerate thumbnail
  async regenerateThumbnail(videoId: string) {
    const response = await api.post(`/videos/${videoId}/regenerate-thumbnail`);
    return response.data;
  },

  // Update video
  async updateVideo(id: string, formData: VideoFormData) {
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    
    // Convert tags string to array
    const tagsArray = formData.tags 
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];
    data.append('tags', JSON.stringify(tagsArray));
    
    if (formData.video) {
      data.append('video', formData.video);
    }
    if (formData.removeVideo) {
      data.append('removeVideo', 'true');
    }

    const response = await api.put(`/videos/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Delete video
  async deleteVideo(id: string) {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  },

  // Section operations
  async createSection(data: any) {
    const response = await api.post('/sections', data);
    return response.data;
  },

  async updateSection(id: string, data: any) {
    const response = await api.put(`/sections/${id}`, data);
    return response.data;
  },

  async deleteSection(id: string) {
    const response = await api.delete(`/sections/${id}`);
    return response.data;
  },

  // Add video to section
  async addVideoToSection(sectionId: string, videoId: string, data: {
    title?: string;
    description?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    playsInline?: boolean;
  }) {
    const response = await api.put(`/sections/${sectionId}/videos`, {
      videoId,
      ...data
    });
    return response.data;
  },

  // Remove video from section
  async removeVideoFromSection(sectionId: string, videoId: string) {
    const response = await api.delete(`/sections/${sectionId}/videos/${videoId}`);
    return response.data;
  },

  // Update video in section
  async updateVideoInSection(sectionId: string, videoId: string, data: {
    title?: string;
    description?: string;
    order?: number;
    settings?: {
      autoplay?: boolean;
      loop?: boolean;
      muted?: boolean;
      controls?: boolean;
      playsInline?: boolean;
    };
  }) {
    const response = await api.put(`/sections/${sectionId}/videos/${videoId}`, data);
    return response.data;
  },

  // Reorder videos in section
  async reorderVideosInSection(sectionId: string, videos: Array<{ videoId: string; order: number }>) {
    const response = await api.put(`/sections/${sectionId}/reorder-videos`, { videos });
    return response.data;
  },

  // Reorder sections
  async reorderSections(sections: Array<{ sectionId: string; order: number }>) {
    const response = await api.put('/sections/reorder-sections', { sections });
    return response.data;
  }
};