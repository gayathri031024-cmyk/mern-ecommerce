import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@components/layout/MainLayout';
import { RouteErrorBoundary } from '@components/common/RouteErrorBoundary';
import { HomePage } from '@pages/HomePage';
import { NotFoundPage } from '@pages/NotFoundPage';

/**
 * Central route tree. Feature route modules (auth, products, cart,
 * account, admin, ...) will be added as children of `MainLayout` in
 * later phases, e.g.:
 *
 *   { path: 'products', children: productRoutes }
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
