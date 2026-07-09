import { useQuery } from '@tanstack/react-query';

import { productService } from '@/services/productService';
import { queryKeys } from '@/lib/queryClient';
import { ProductFilters, QueryParams } from '@/types';

export function useProducts(params: QueryParams & ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productService.list(params),
    placeholderData: (previous) => previous,
  });
}
