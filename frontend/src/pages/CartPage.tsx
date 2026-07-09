import { Link } from 'react-router-dom';

import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCart } from '@/hooks/useCart';
import { ROUTES } from '@/utils/constants';

export function CartPage() {
  const { cart, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the collection and add something you'll love."
        action={
          <Link to={ROUTES.PRODUCTS} className="text-sm font-medium text-accent hover:underline">
            Start shopping
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Your cart</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-white p-4">
          {cart.items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>
        <CartSummary cart={cart} />
      </div>
    </div>
  );
}
