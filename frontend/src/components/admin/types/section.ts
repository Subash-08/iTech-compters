// src/types/section.ts
export interface VideoSettings {
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  playsInline: boolean;
}

export interface SectionVideo {
  _id: string;
  video: Video | string; // Can be populated or just ID
  title: string;
  description: string;
  order: number;
  settings: VideoSettings;
}

export interface GridConfig {
  columns: number;
  gap: number;
}

export interface SliderConfig {
  autoplay: boolean;
  delay: number;
  loop: boolean;
  showNavigation: boolean;
  showPagination: boolean;
}

export interface SectionPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type LayoutType = 'card' | 'full-video' | 'slider' | 'grid' | 'masonry' | 'reels';

export interface Section {
  _id: string;
  title: string;
  description: string;
  layoutType: LayoutType;
  gridConfig: GridConfig;
  sliderConfig: SliderConfig;
  videos: SectionVideo[];
  order: number;
  visible: boolean;
  backgroundColor: string;
  textColor: string;
  padding: SectionPadding;
  maxWidth: string;
  createdAt: string;
  updatedAt: string;
  videoCount?: number;
}

export interface SectionFormData {
  title: string;
  description: string;
  layoutType: LayoutType;
  visible: boolean;
  backgroundColor: string;
  textColor: string;
  maxWidth: string;
  padding: SectionPadding;
  gridConfig: GridConfig;
  sliderConfig: SliderConfig;
}

export interface VideoReorderData {
  videoId: string;
  order: number;
}

export interface SectionReorderData {
  id: string;
  order: number;
}