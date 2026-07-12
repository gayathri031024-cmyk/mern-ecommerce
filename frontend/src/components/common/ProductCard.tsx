import { memo } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlistStore } from '@/store/wishlistStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';

function ProductCardComponent({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toggle = useWishlistStore((state) => state.toggle);
  const wishlisted = useWishlistStore((state) => state.productIds.includes(product.id));
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white">
      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm"
      >
        <Heart className={cn('h-4 w-4', wishlisted ? 'fill-accent text-accent' : 'text-ink/60')} />
      </button>

      <Link to={`/products/${product.slug}`} className="block aspect-square overflow-hidden bg-ink/5">
        <img
          src={product.images[0]?.url ?? '/placeholder-product.svg'}
          alt={product.images[0]?.alt ?? product.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {onSale && (
          <Badge tone="danger" className="w-fit">
            Sale
          </Badge>
        )}
        <Link to={`/products/${product.slug}`} className="line-clamp-2 font-medium hover:text-accent">
          {product.title}
        </Link>
        <Rating value={product.rating} count={product.reviewCount} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{formatCurrency(product.price, product.currency)}</span>
            {onSale && (
              <span className="text-xs text-ink/40 line-through">
                {formatCurrency(product.compareAtPrice as number, product.currency)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => addItem({ productId: product.id })}
            aria-label={`Add ${product.title} to cart`}
            className="rounded-xl bg-ink p-2 text-paper transition-colors hover:bg-accent"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);