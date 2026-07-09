import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/admin/DataTable';
import { useOrders } from '@/hooks/useOrders';
import { orderService } from '@/services/orderService';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ORDER_STATUS_LABELS } from '@/utils/constants';
import { Order } from '@/types';

const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const { data } = useOrders({ page, limit: 20 });
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <DataTable<Order>
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        columns={[
          { header: 'Order', cell: (row) => `#${row.orderNumber}` },
          { header: 'Date', cell: (row) => formatDate(row.createdAt) },
          { header: 'Total', cell: (row) => formatCurrency(row.total) },
          {
            header: 'Status',
            cell: (row) => (
              <Select
                options={statusOptions}
                value={row.status}
                onChange={(event) => updateStatus.mutate({ id: row.id, status: event.target.value })}
                className="h-8 text-xs"
              />
            ),
          },
          {
            header: 'Payment',
            cell: (row) => <Badge tone="neutral">{row.paymentMethod.toUpperCase()}</Badge>,
          },
        ]}
      />
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
            Previous
          </button>
          <span>Page {page} of {data.meta.totalPages}</span>
          <button
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
