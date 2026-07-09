import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/admin/DataTable';
import { userService } from '@/services/userService';
import { formatDate } from '@/utils/formatDate';
import { UserProfile } from '@/types';

export function AdminUsersPage() {
  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => userService.listAll({ page: 1, limit: 50 }),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <DataTable<UserProfile>
        rows={users ?? []}
        rowKey={(row) => row.id}
        columns={[
          { header: 'Name', cell: (row) => row.name },
          { header: 'Email', cell: (row) => row.email },
          { header: 'Role', cell: (row) => <Badge tone="neutral">{row.role}</Badge> },
          { header: 'Joined', cell: (row) => formatDate(row.createdAt) },
        ]}
      />
    </div>
  );
}
