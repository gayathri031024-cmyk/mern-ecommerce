import axios, { AxiosError, AxiosInstance } from 'axios';
import { env } from '@config/env';
import { ApiErrorResponse } from '@/types/api';

/**
 * Shared axios instance for all API calls.
 * - withCredentials: true so the httpOnly auth cookie (set in later phases)
 *   is sent automatically once auth exists.
 * - baseURL comes from VITE_API_BASE_URL so dev/staging/prod just swap .env.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

/**
 * Normalized error shape thrown by the response interceptor below, so
 * calling code can rely on a consistent `.message` / `.statusCode`
 * regardless of whether the failure was a network error, a timeout,
 * or a structured API error response.
 */
export class ApiRequestError extends Error {
  public readonly statusCode?: number;
  public readonly errors?: unknown;

  constructor(message: string, statusCode?: number, errors?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject(
        new ApiRequestError(data?.message ?? 'Request failed', status, data?.errors),
      );
    }

    if (error.request) {
      return Promise.reject(new ApiRequestError('No response from server. Check your connection.'));
    }

    return Promise.reject(new ApiRequestError(error.message));
  },
);
