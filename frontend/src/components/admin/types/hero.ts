export interface HeroSlide {
  _id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroSection {
  _id?: string;
  name: string;
  slides: HeroSlide[];
  isActive: boolean;
  autoPlay: boolean;
  autoPlaySpeed: number;
  transitionEffect: 'slide' | 'fade' | 'cube' | 'coverflow';
  showNavigation: boolean;
  showPagination: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroSectionFormData {
  name: string;
  autoPlay: boolean;
  autoPlaySpeed: number;
  transitionEffect: 'slide' | 'fade' | 'cube' | 'coverflow';
  showNavigation: boolean;
  showPagination: boolean;
}

export interface HeroSlideFormData {
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  image?: File;
}