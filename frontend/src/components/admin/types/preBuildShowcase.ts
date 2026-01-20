export interface PreBuildShowcaseItem {
  _id: string;
  category: string;
  title: string;
  price: string;
  image: {
    url: string;
    altText?: string;
  };
  buttonLink: string;
  isWide: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PreBuildShowcaseFormData {
  category: string;
  title: string;
  price: string;
  buttonLink: string;
  isWide: boolean;
  isActive: boolean;
  order: number;
  image: File | null;
  imageAltText: string;
}