// types/featuredBrand.ts
export interface FeaturedBrand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo: {
    url: string;
    altText?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    size?: number;
    format?: string;
  };
  websiteUrl?: string;
  displayOrder: number;
  isActive: boolean;
  status: 'active' | 'inactive';
  views: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedBrandFormData {
  name: string;
  description?: string;
  websiteUrl?: string;
  displayOrder: number;
  isActive: boolean;
  logo?: File | null;
  logoAltText?: string;
  removeLogo?: boolean;
}

export interface FeaturedBrandFilters {
  search?: string;
  status?: 'active' | 'inactive';
  hasLogo?: boolean;
  page?: number;
  limit?: number;
}

export interface FeaturedBrandsResponse {
  success: boolean;
  data: FeaturedBrand[];
  count: number;
}

export interface FeaturedBrandResponse {
  success: boolean;
  data: FeaturedBrand;
}

export interface FeaturedBrandCountResponse {
  success: boolean;
  count: number;
  hasBrands: boolean;
}