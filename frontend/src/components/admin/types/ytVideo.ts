export interface YTVideoItem {
  _id: string;
  title: string;
  videoUrl: string;
  videoId: string;
  thumbnailUrl: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface YTVideoFormData {
  title: string;
  videoUrl: string;
  isActive: boolean;
  order: number;
}