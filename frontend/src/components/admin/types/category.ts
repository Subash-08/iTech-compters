export interface CategoryImage {
  url: string | null;
  altText: string | null;
  publicId: string | null;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: Category | string | null;
  image?: CategoryImage; // Add image field
  status: 'active' | 'inactive';
  deactivationReason?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  subcategories?: Category[];
  createdBy?: string;
  updatedBy?: string;
  order?: number;
  isFeatured?: boolean;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentCategory: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  status: 'active' | 'inactive';
  image?: File | null; // Add image file for upload
  imageAltText?: string; // Add alt text for image
  removeImage?: boolean; // Flag to remove existing image
}

export interface CategoryFilters {
  status?: string;
  keyword?: string;
  parentCategory?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
  count: number;
  totalCount: number;
  resPerPage: number;
  currentPage: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryResponse {
  success: boolean;
  category: Category;
}