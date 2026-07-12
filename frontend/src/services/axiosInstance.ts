import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/store/authStore';
import { STORAGE_KEYS } from '@/utils/constants';
import { storage } from '@/utils/storage';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true,
  timeout: 15000,
});

/** Reads a cookie value by name (used for the double-submit CSRF token). */
function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // The backend double-submit-checks this header against the non-httpOnly
  // XSRF-TOKEN cookie on /auth/refresh and /auth/logout. Harmless to send
  // on every request; only those two routes actually verify it.
  const csrfToken = readCookie('XSRF-TOKEN');
  if (csrfToken && config.headers) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

/** Requests hitting these paths must never trigger the refresh-and-retry flow below,
 * otherwise a failed refresh attempt recurses into itself. */
const AUTH_ENDPOINTS_WITHOUT_RETRY = ['/auth/refresh', '/auth/login', '/auth/register'];

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean };
}> = [];

function settleQueue(error: unknown | null) {
  pendingQueue.forEach(({ resolve, reject, originalRequest }) => {
    if (error) {
      reject(error);
    } else {
      resolve(axiosInstance(originalRequest));
    }
  });
  pendingQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthEndpoint = AUTH_ENDPOINTS_WITHOUT_RETRY.some((path) =>
      originalRequest?.url?.includes(path),
    );

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'X-CSRF-Token': readCookie('XSRF-TOKEN') ?? '' } },
        );
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
        settleQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        settleQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

