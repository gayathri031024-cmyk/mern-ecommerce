import { axiosInstance } from './axiosInstance';
import { ApiSuccess, CreateReviewPayload, Review } from '@/types';

export const reviewService = {
  async listForProduct(productId: string): Promise<Review[]> {
    const { data } = await axiosInstance.get<ApiSuccess<Review[]>>(`/products/${productId}/reviews`);
    return data.data;
  },

  async create(payload: CreateReviewPayload): Promise<Review> {
    const { data } = await axiosInstance.post<ApiSuccess<Review>>(
      `/products/${payload.productId}/reviews`,
      payload,
    );
    return data.data;
  },
};