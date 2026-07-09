import { axiosInstance } from './axiosInstance';
import { ApiSuccess, CreateOrderPayload, Order, PaginatedResponse, QueryParams } from '@/types';

export const orderService = {
  async list(params?: QueryParams): Promise<PaginatedResponse<Order>> {
    const { data } = await axiosInstance.get<ApiSuccess<PaginatedResponse<Order>>>('/orders', {
      params,
    });
    return data.data;
  },

  async getById(id: string): Promise<Order> {
    const { data } = await axiosInstance.get<ApiSuccess<Order>>(`/orders/${id}`);
    return data.data;
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await axiosInstance.post<ApiSuccess<Order>>('/orders', payload);
    return data.data;
  },

  async cancel(id: string): Promise<Order> {
    const { data } = await axiosInstance.post<ApiSuccess<Order>>(`/orders/${id}/cancel`);
    return data.data;
  },

  async updateStatus(id: string, status: string): Promise<Order> {
    const { data } = await axiosInstance.patch<ApiSuccess<Order>>(`/orders/${id}/status`, {
      status,
    });
    return data.data;
  },
};
