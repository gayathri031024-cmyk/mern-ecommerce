import { axiosInstance } from './axiosInstance';
import {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ApiSuccess,
  AuthUser,
} from '@/types';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
    return data.data;
  },

  async logout(): Promise<void> {
    await axiosInstance.post('/auth/logout');
  },

  async me(): Promise<AuthUser> {
    const { data } = await axiosInstance.get<ApiSuccess<AuthUser>>('/auth/me');
    return data.data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await axiosInstance.post('/auth/forgot-password', payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await axiosInstance.post('/auth/reset-password', payload);
  },
};