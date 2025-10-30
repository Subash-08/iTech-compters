// src/types/reviewTypes.ts
export interface ReviewUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  avatar?: string;
  socialLogins?: Array<{
    provider: string;
    photoURL?: string;
  }>;
}

export interface Review {
  _id: string;
  user: ReviewUser | string;
  product: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  rating: number;
  comment: string;
}

export interface UpdateReviewData extends CreateReviewData {}

export interface ReviewState {
  loading: boolean;
  error: string | null;
  success: boolean;
  productReviews: {
    [productId: string]: {
      reviews: Review[];
      averageRating: number;
      totalReviews: number;
    }
  };
}