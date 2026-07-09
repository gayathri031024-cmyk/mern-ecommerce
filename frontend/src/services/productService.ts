import { axiosInstance } from './axiosInstance';
import {
  ApiSuccess,
  PaginatedResponse,
  Product,
  ProductFilters,
  ProductFormValues,
  QueryParams,
} from '@/types';

export const productService = {
  async list(params: QueryParams & ProductFilters): Promise<PaginatedResponse<Product>> {
    const { data } = await axiosInstance.get<ApiSuccess<PaginatedResponse<Product>>>('/products', {
      params,
    });
    return data.data;
  },

  async getBySlug(slug: string): Promise<Product> {
    const { data } = await axiosInstance.get<ApiSuccess<Product>>(`/products/${slug}`);
    return data.data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await axiosInstance.get<ApiSuccess<Product>>(`/products/id/${id}`);
    return data.data;
  },

  async create(payload: ProductFormValues): Promise<Product> {
    const { data } = await axiosInstance.post<ApiSuccess<Product>>('/products', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<ProductFormValues>): Promise<Product> {
    const { data } = await axiosInstance.patch<ApiSuccess<Product>>(`/products/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/products/${id}`);
  },
};
