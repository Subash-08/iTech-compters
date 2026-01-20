import api from '../../config/axiosConfig';
import { YTVideoItem, YTVideoFormData } from '../types/ytVideo';

export const ytVideoService = {
  // Public: Get active videos for user page
  async getVideos() {
    const response = await api.get('/yt-videos');
    return response.data;
  },

  // Admin: Get all videos
  async getAdminVideos() {
    const response = await api.get('/admin/yt-videos');
    return response.data;
  },

  // Admin: Create video
  async createVideo(data: YTVideoFormData) {
    const response = await api.post('/admin/yt-videos', data);
    return response.data;
  },

  // Admin: Update video
  async updateVideo(id: string, data: YTVideoFormData) {
    const response = await api.put(`/admin/yt-videos/${id}`, data);
    return response.data;
  },

  // Admin: Delete video
  async deleteVideo(id: string) {
    const response = await api.delete(`/admin/yt-videos/${id}`);
    return response.data;
  }
};