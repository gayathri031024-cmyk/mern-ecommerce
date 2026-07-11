import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: (failureCount, error) => {
        // Don't retry 4xx client errors (bad request, not found, etc.) -
        // retrying won't help and just delays the error surfacing to the UI.
        if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
export const queryKeys = {
    products: {
      all: ['products'] as const,
      list: (params: unknown) => ['products', 'list', params] as const,
      detail: (slug: string) => ['products', 'detail', slug] as const,
    },
    categories: {
      all: ['categories'] as const,
    },
    cart: {
      all: ['cart'] as const,
    },
    orders: {
      all: ['orders'] as const,
      list: (params: unknown) => ['orders', 'list', params] as const,
      detail: (id: string) => ['orders', 'detail', id] as const,
    },
    reviews: {
      forProduct: (productId: string) => ['reviews', productId] as const,
    },
    profile: {
      me: ['profile', 'me'] as const,
    },
  };