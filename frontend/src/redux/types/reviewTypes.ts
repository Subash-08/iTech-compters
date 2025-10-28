// src/types/reviewTypes.ts
export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

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

export interface CreateReviewData {
  rating: number;
  comment: string;
}

export interface UpdateReviewData extends CreateReviewData {}