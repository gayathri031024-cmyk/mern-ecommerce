import { useMemo } from 'react';

import { ProductCard } from '@/components/common/ProductCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProducts } from '@/hooks/useProducts';
import { useWishlistStore } from '@/store/wishlistStore';

export function WishlistPage() {
  const { productIds } = useWishlistStore();
  const { data, isLoading } = useProducts({ page: 1, limit: 100 });

  const wishlistedProducts = useMemo(
    () => data?.items.filter((product) => productIds.includes(product.id)) ?? [],
    [data, productIds],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (wishlistedProducts.length === 0) {
    return <EmptyState title="Your wishlist is empty" description="Tap the heart icon on any product to save it here." />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {wishlistedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
