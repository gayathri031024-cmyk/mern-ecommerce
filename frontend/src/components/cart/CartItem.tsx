import { memo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CartItem as CartItemType } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCart } from '@/hooks/useCart';

function CartItemComponent({ item }: { item: CartItemType }) {
  const { updateItem, removeItem } = useCart();

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-b-0">
      <Link to={`/products/${item.product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink/5">
        <img
          src={item.product.images[0]?.url ?? '/placeholder-product.svg'}
          alt={item.product.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link to={`/products/${item.product.slug}`} className="font-medium hover:text-accent">
          {item.product.title}
        </Link>
        <span className="text-sm text-ink/50">{formatCurrency(item.priceAtAdd)} each</span>

        <div className="mt-auto flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => updateItem({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) })}
              className="p-2 hover:bg-ink/5"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => updateItem({ productId: item.productId, quantity: item.quantity + 1 })}
              className="p-2 hover:bg-ink/5"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label="Remove item"
            className="text-ink/40 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="font-semibold">{formatCurrency(item.priceAtAdd * item.quantity)}</div>
    </div>
  );
}

export const CartItem = memo(CartItemComponent);