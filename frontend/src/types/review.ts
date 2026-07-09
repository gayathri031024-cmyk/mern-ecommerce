export interface Review {
    id: string;
    productId: string;
    userName: string;
    userAvatarUrl?: string;
    rating: number;
    comment: string;
    createdAt: string;
  }
  
  export interface CreateReviewPayload {
    productId: string;
    rating: number;
    comment: string;
  }
  