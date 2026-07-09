import { useQuery } from '@tanstack/react-query';

import { categoryService } from '@/services/categoryService';
import { queryKeys } from '@/lib/queryClient';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.list(),
    staleTime: 5 * 60 * 1000,
  });
}
