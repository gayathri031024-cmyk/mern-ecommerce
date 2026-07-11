import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/admin/DataTable';
import { useProducts } from '@/hooks/useProducts';
import { productService } from '@/services/productService';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { ROUTES } from '@/utils/constants';
import { Product } from '@/types';

export function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const { data } = useProducts({ page, limit: 20 });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const removeMutation = useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      showToast({ title: 'Product deleted', variant: 'success' });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link to={ROUTES.ADMIN_PRODUCT_NEW}>
          <Button>
            <Plus className="h-4 w-4" />
            New product
          </Button>
        </Link>
      </div>

      <DataTable<Product>
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        columns={[
          {
            header: 'Product',
            cell: (row) => (
              <div className="flex items-center gap-3">
                <img src={row.images[0]?.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <span className="font-medium">{row.title}</span>
              </div>
            ),
          },
          { header: 'SKU', cell: (row) => row.sku },
          { header: 'Price', cell: (row) => formatCurrency(row.price, row.currency) },
          {
            header: 'Stock',
            cell: (row) => (
              <Badge tone={row.stock > 0 ? 'success' : 'danger'}>
                {row.stock > 0 ? `${row.stock} in stock` : 'Out of stock'}
              </Badge>
            ),
          },
          {
            header: 'Actions',
            cell: (row) => (
              <div className="flex gap-2">
                <Link
                  to={ROUTES.ADMIN_PRODUCT_EDIT(row.id)}
                  aria-label={`Edit ${row.title}`}
                  className="rounded-lg p-1.5 hover:bg-ink/5"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${row.title}`}
                  onClick={() => removeMutation.mutate(row.id)}
                  className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
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