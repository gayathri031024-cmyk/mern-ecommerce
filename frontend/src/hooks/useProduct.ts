import { useQuery } from '@tanstack/react-query';

import { productService } from '@/services/productService';
import { queryKeys } from '@/lib/queryClient';

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => productService.getBySlug(slug),
    enabled: Boolean(slug),
  });
}
