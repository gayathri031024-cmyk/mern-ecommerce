import { Outlet } from 'react-router-dom';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Navbar } from '@/components/common/Navbar';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
