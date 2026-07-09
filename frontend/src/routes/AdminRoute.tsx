
import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user && user.role !== 'admin') {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
