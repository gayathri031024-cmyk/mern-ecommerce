import { Link, Outlet } from 'react-router-dom';

import { ROUTES } from '@/utils/constants';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <Link to={ROUTES.HOME} className="mb-6 block text-center font-display text-2xl font-bold">
          Shopfront
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
