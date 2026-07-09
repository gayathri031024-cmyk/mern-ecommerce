import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/constants';

export function OrderSuccessPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <CheckCircle2 className="h-16 w-16 text-mint" />
      <h1 className="text-2xl font-semibold">Order placed!</h1>
      <p className="max-w-md text-ink/60">
        Thanks for shopping with us. You'll receive a confirmation email shortly, and you can
        track progress from your order history.
      </p>
      <div className="mt-2 flex gap-3">
        <Link to={ROUTES.ORDERS}>
          <Button variant="outline">View orders</Button>
        </Link>
        <Link to={ROUTES.PRODUCTS}>
          <Button>Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}
