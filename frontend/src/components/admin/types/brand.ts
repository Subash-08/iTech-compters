export interface BrandLogo {
  url: string | null;
  altText: string | null;
  publicId: string | null;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo: BrandLogo;
  status: 'active' | 'inactive';
  deactivationReason?: 'discontinued' | 'seasonal' | 'restructuring' | 'low-performance' | 'other' | null;
  deactivatedAt?: string | null;
  deactivatedBy?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  order?: number;
  isFeatured?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
  deactivationReason?: 'discontinued' | 'seasonal' | 'restructuring' | 'low-performance' | 'other' | null;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  logo?: File | null;
  logoAltText: string;
  removeLogo?: boolean;
}

export interface BrandFilters {
  search: string;
  status: string;
  page: number;
  limit: number;
}