import { DollarSign, Package, ShoppingBag, Users } from 'lucide-react';

import { StatCard } from '@/components/admin/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { useOrders } from '@/hooks/useOrders';
import { formatCurrency } from '@/utils/formatCurrency';
import { ORDER_STATUS_LABELS } from '@/utils/constants';

export function AdminDashboardPage() {
  const { data } = useOrders({ page: 1, limit: 5 });
  const recentOrders = data?.items ?? [];
  const revenue = recentOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Revenue (recent)" value={formatCurrency(revenue)} icon={DollarSign} />
        <StatCard label="Orders" value={String(data?.meta.totalItems ?? 0)} icon={ShoppingBag} />
        <StatCard label="Products" value="—" icon={Package} />
        <StatCard label="Customers" value="—" icon={Users} />
      </div>

      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold">Recent orders</h2>
          <div className="flex flex-col divide-y divide-border">
            {recentOrders.length === 0 && <p className="py-4 text-sm text-ink/50">No orders yet.</p>}
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <span className="font-medium">#{order.orderNumber}</span>
                <span className="text-sm text-ink/50">{ORDER_STATUS_LABELS[order.status]}</span>
                <span className="font-semibold">{formatCurrency(order.total)}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}