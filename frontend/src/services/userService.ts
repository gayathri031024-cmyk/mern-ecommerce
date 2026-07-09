import { axiosInstance } from './axiosInstance';
import { Address, ApiSuccess, UpdateProfilePayload, UserProfile } from '@/types';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await axiosInstance.get<ApiSuccess<UserProfile>>('/users/me');
    return data.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await axiosInstance.patch<ApiSuccess<UserProfile>>('/users/me', payload);
    return data.data;
  },

  async addAddress(payload: Omit<Address, 'id'>): Promise<UserProfile> {
    const { data } = await axiosInstance.post<ApiSuccess<UserProfile>>('/users/me/addresses', payload);
    return data.data;
  },

  async removeAddress(addressId: string): Promise<UserProfile> {
    const { data } = await axiosInstance.delete<ApiSuccess<UserProfile>>(
      `/users/me/addresses/${addressId}`,
    );
    return data.data;
  },

  async listAll(params?: { page?: number; limit?: number }) {
    const { data } = await axiosInstance.get<ApiSuccess<UserProfile[]>>('/users', { params });
    return data.data;
  },
};
