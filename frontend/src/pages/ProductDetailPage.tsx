import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useProduct } from '@/hooks/useProduct';
import { useCart } from '@/hooks/useCart';
import { useWishlistStore } from '@/store/wishlistStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlistStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return <EmptyState title="Product not found" description="This item may have been removed." />;
  }

  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="aspect-square overflow-hidden rounded-xl bg-ink/5">
          <img
            src={product.images[activeImage]?.url ?? '/placeholder-product.svg'}
            alt={product.images[activeImage]?.alt ?? product.title}
            className="h-full w-full object-cover"
          />
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2">
            {product.images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  'h-16 w-16 overflow-hidden rounded-lg border-2',
                  index === activeImage ? 'border-accent' : 'border-transparent',
                )}
              >
                <img src={image.url} alt={image.alt ?? ''} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {onSale && <Badge tone="danger" className="w-fit">Sale</Badge>}
        <h1 className="text-3xl font-semibold">{product.title}</h1>
        <Rating value={product.rating} count={product.reviewCount} />

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold">{formatCurrency(product.price, product.currency)}</span>
          {onSale && (
            <span className="text-ink/40 line-through">
              {formatCurrency(product.compareAtPrice as number, product.currency)}
            </span>
          )}
        </div>

        <p className="text-ink/70">{product.description}</p>

        <div className="text-sm text-ink/50">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'} · SKU {product.sku}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-border">
            <button
              type="button"
              className="p-2"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center">{quantity}</span>
            <button
              type="button"
              className="p-2"
              onClick={() => setQuantity((current) => current + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <Button
            onClick={() => addItem({ productId: product.id, quantity })}
            disabled={product.stock === 0}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </Button>

          <Button
            variant="outline"
            onClick={() => toggle(product.id)}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-4 w-4', wishlisted && 'fill-accent text-accent')} />
          </Button>
        </div>
      </div>
    </div>
  );
}
