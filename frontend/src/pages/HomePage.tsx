import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/common/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProducts } from '@/hooks/useProducts';
import { ROUTES } from '@/utils/constants';

export function HomePage() {
  const { data, isLoading } = useProducts({ limit: 8, sort: 'featured' });
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-start gap-6 rounded-xl bg-surface p-10 text-paper md:p-16">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">
          New arrivals weekly
        </span>
        <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight md:text-5xl">
          Everyday goods, chosen with intent.
        </h1>
        <p className="max-w-lg text-paper/70">
          Shopfront curates quality essentials from independent makers — no clutter, just things
          worth keeping.
        </p>
        <Link
          to={ROUTES.PRODUCTS}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white hover:bg-accent/90"
        >
          Shop the collection
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured products</h2>
          <Link to={ROUTES.PRODUCTS} className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="aspect-square" />)
            : data?.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </div>
  );
}