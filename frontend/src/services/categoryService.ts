import { axiosInstance } from './axiosInstance';
import { ApiSuccess, Category } from '@/types';

export const categoryService = {
  async list(): Promise<Category[]> {
    const { data } = await axiosInstance.get<ApiSuccess<Category[]>>('/categories');
    return data.data;
  },

  async getBySlug(slug: string): Promise<Category> {
    const { data } = await axiosInstance.get<ApiSuccess<Category>>(`/categories/${slug}`);
    return data.data;
  },
};