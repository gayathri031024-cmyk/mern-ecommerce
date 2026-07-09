
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOrders } from '@/hooks/useOrders';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ORDER_STATUS_LABELS, ROUTES } from '@/utils/constants';

const statusTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'neutral',
};

export function OrdersPage() {
  const { data, isLoading } = useOrders({ page: 1, limit: 20 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <EmptyState title="No orders yet" description="Your past orders will show up here." />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Order history</h1>
      <div className="flex flex-col gap-4">
        {data.items.map((order) => (
          <Link key={order.id} to={ROUTES.ORDER_DETAIL(order.id)}>
            <Card className="transition-shadow hover:shadow-md">
              <CardBody className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-sm text-ink/50">{formatDate(order.createdAt)}</p>
                </div>
                <Badge tone={statusTone[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                <p className="font-semibold">{formatCurrency(order.total)}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
