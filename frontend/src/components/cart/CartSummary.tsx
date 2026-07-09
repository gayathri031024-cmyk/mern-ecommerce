import { Link } from 'react-router-dom';

import { Card, CardBody } from '@/components/ui/Card';
import { Cart } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/cn';

const SHIPPING_FLAT_RATE = 6.99;
const TAX_RATE = 0.08;

export function CartSummary({ cart }: { cart: Cart }) {
  const shipping = cart.itemCount > 0 ? SHIPPING_FLAT_RATE : 0;
  const tax = cart.subtotal * TAX_RATE;
  const total = cart.subtotal + shipping + tax;

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-ink/60">Subtotal ({cart.itemCount} items)</span>
          <span>{formatCurrency(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink/60">Shipping</span>
          <span>{formatCurrency(shipping)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink/60">Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <Link
          to={ROUTES.CHECKOUT}
          aria-disabled={cart.itemCount === 0}
          className={cn(
            'mt-2 flex h-10 w-full items-center justify-center rounded-xl bg-ink text-sm font-medium text-paper hover:bg-ink/90',
            cart.itemCount === 0 && 'pointer-events-none opacity-50',
          )}
        >
          Proceed to checkout
        </Link>
      </CardBody>
    </Card>
  );
}
