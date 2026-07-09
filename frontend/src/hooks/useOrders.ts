import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { orderService } from '@/services/orderService';
import { queryKeys } from '@/lib/queryClient';
import { CreateOrderPayload, QueryParams } from '@/types';

export function useOrders(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => orderService.list(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}
