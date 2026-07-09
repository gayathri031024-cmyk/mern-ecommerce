import { useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ORDER_STATUS_LABELS } from '@/utils/constants';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!order) return <EmptyState title="Order not found" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-ink/50">Placed {formatDate(order.createdAt)}</p>
        </div>
        <Badge tone="info">{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>

      <Card>
        <CardBody className="flex flex-col divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <img
                src={item.product.images[0]?.url ?? '/placeholder-product.svg'}
                alt={item.product.title}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{item.product.title}</p>
                <p className="text-sm text-ink/50">Qty {item.quantity}</p>
              </div>
              <p className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-2 font-semibold">Shipping address</h2>
            <p className="text-sm text-ink/70">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-2">
            <h2 className="mb-1 font-semibold">Payment summary</h2>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span>{formatCurrency(order.shippingFee)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
