import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

/** Redirects already-authenticated users away from login/register pages. */
export function GuestRoute() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}