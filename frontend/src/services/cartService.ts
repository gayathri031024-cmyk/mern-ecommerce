import { axiosInstance } from './axiosInstance';
import { ApiSuccess, Cart } from '@/types';

export const cartService = {
  async get(): Promise<Cart> {
    const { data } = await axiosInstance.get<ApiSuccess<Cart>>('/cart');
    return data.data;
  },

  async addItem(productId: string, quantity = 1): Promise<Cart> {
    const { data } = await axiosInstance.post<ApiSuccess<Cart>>('/cart/items', {
      productId,
      quantity,
    });
    return data.data;
  },

  async updateItem(productId: string, quantity: number): Promise<Cart> {
    const { data } = await axiosInstance.patch<ApiSuccess<Cart>>(`/cart/items/${productId}`, {
      quantity,
    });
    return data.data;
  },

  async removeItem(productId: string): Promise<Cart> {
    const { data } = await axiosInstance.delete<ApiSuccess<Cart>>(`/cart/items/${productId}`);
    return data.data;
  },

  async clear(): Promise<void> {
    await axiosInstance.delete('/cart');
  },
};