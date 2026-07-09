import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users } from 'lucide-react';

import { cn } from '@/utils/cn';
import { ROUTES } from '@/utils/constants';

const links = [
  { to: ROUTES.ADMIN, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.ADMIN_PRODUCTS, label: 'Products', icon: Package },
  { to: ROUTES.ADMIN_ORDERS, label: 'Orders', icon: ShoppingBag },
  { to: ROUTES.ADMIN_USERS, label: 'Customers', icon: Users },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-white p-4 md:block">
      <p className="mb-6 px-2 font-display text-lg font-bold">Admin</p>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5',
                isActive && 'bg-ink text-paper hover:bg-ink',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}