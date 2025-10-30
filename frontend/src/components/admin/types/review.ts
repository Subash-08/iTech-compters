// types/review.ts
export interface Review {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  product: {
    _id: string;
    name: string;
    slug: string;
    images?: {
      thumbnail?: { url: string };
      gallery?: Array<{ url: string }>;
    };
  };
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFilters {
  search?: string;
  rating?: string;
  page?: number;
  limit?: number;
}

// For the admin reviews list
export interface AdminReviewsResponse {
  success: boolean;
  reviews: Review[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}