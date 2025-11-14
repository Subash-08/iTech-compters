// src/types/showcaseSection.ts
export interface TimerConfig {
  hasTimer: boolean;
  endDate?: string;
  timerText: string;
}

export interface StyleConfig {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  cardStyle: 'modern' | 'minimal' | 'elegant' | 'bold';
}

export interface VisibilityConfig {
  isPublic: boolean;
  startDate: string;
  endDate?: string;
  showOnHomepage: boolean;
  showInCategory: string[];
}

export interface ShowcaseSection {
  _id: string;
  title: string;
  subtitle?: string;
  type: 'grid' | 'carousel';
  products: Product[];
  displayOrder: number;
  isActive: boolean;
  showViewAll: boolean;
  viewAllLink?: string;
  timerConfig: TimerConfig;
  styleConfig: StyleConfig;
  visibility: VisibilityConfig;
  meta: {
    createdBy: string;
    updatedBy: string;
    clicks: number;
    impressions: number;
    createdAt: string;
    updatedAt: string;
  };
  timerStatus?: 'active' | 'expired' | 'no-timer';
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export interface ShowcaseSectionFormData {
  title: string;
  subtitle?: string;
  type: 'grid' | 'carousel';
  products: string[];
  displayOrder: number;
  isActive: boolean;
  showViewAll: boolean;
  viewAllLink?: string;
  timerConfig: TimerConfig;
  styleConfig: StyleConfig;
  visibility: VisibilityConfig;
}