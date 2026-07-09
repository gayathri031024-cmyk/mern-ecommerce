import { useSearchParams } from 'react-router-dom';

import { CategoryFilter } from '@/components/common/CategoryFilter';
import { PriceRangeFilter } from '@/components/common/PriceRangeFilter';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductCard } from '@/components/common/ProductCard';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProducts } from '@/hooks/useProducts';
import { usePagination } from '@/hooks/usePagination';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, limit, setPage } = usePagination(DEFAULT_PAGE_SIZE);

  const category = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  const { data, isLoading } = useProducts({ page, limit, category, search, minPrice, maxPrice });

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-8">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Category</h3>
          <CategoryFilter selectedSlug={category} onSelect={(slug) => updateParam('category', slug)} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Price</h3>
          <PriceRangeFilter
            minPrice={minPrice}
            maxPrice={maxPrice}
            onApply={(min, max) => {
              const next = new URLSearchParams(searchParams);
              if (min) next.set('minPrice', String(min)); else next.delete('minPrice');
              if (max) next.set('maxPrice', String(max)); else next.delete('maxPrice');
              next.set('page', '1');
              setSearchParams(next);
            }}
          />
        </div>
      </aside>

      <div>
        <h1 className="mb-6 text-2xl font-semibold">
          {search ? `Results for "${search}"` : 'All products'}
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No products found" description="Try adjusting your filters or search term." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination meta={data.meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
