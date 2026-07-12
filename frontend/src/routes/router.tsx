
import { lazy, Suspense, ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { MainLayout } from '@components/layout/MainLayout';
import { AuthLayout } from '@components/layout/AuthLayout';
import { AdminLayout } from '@components/layout/AdminLayout';
import { RouteErrorBoundary } from '@components/common/RouteErrorBoundary';
import { PageLoader } from '@components/common/PageLoader';

import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { GuestRoute } from './GuestRoute';

/**
 * Every storefront/auth/admin page is code-split into its own chunk via
 * `lazy()`, so the initial bundle only ships the shell (layouts, router,
 * providers) plus whichever page the visitor actually lands on. React
 * Router only requests a page's chunk the moment its route is matched.
 */
const HomePage = lazy(() => import('@pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductListPage = lazy(() =>
  import('@pages/ProductListPage').then((m) => ({ default: m.ProductListPage })),
);
const ProductDetailPage = lazy(() =>
  import('@pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const CartPage = lazy(() => import('@pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() =>
  import('@pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const OrderSuccessPage = lazy(() =>
  import('@pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })),
);
const OrdersPage = lazy(() => import('@pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() =>
  import('@pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })),
);
const WishlistPage = lazy(() =>
  import('@pages/WishlistPage').then((m) => ({ default: m.WishlistPage })),
);
const ProfilePage = lazy(() =>
  import('@pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const LoginPage = lazy(() => import('@pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import('@pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
);
const NotFoundPage = lazy(() =>
  import('@pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const AdminDashboardPage = lazy(() =>
  import('@pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminProductsPage = lazy(() =>
  import('@pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })),
);
const AdminProductFormPage = lazy(() =>
  import('@pages/admin/AdminProductFormPage').then((m) => ({ default: m.AdminProductFormPage })),
);
const AdminOrdersPage = lazy(() =>
  import('@pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })),
);
const AdminUsersPage = lazy(() =>
  import('@pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);

/** Wraps a lazy page element with the shared Suspense fallback. */
function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

/**
 * Central route tree. Every page in `src/pages` is wired up here, grouped
 * under the layout that matches its context (storefront, auth, admin).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'products', element: withSuspense(<ProductListPage />) },
      { path: 'products/:slug', element: withSuspense(<ProductDetailPage />) },
      { path: 'cart', element: withSuspense(<CartPage />) },
      { path: 'wishlist', element: withSuspense(<WishlistPage />) },

      {
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout', element: withSuspense(<CheckoutPage />) },
          { path: 'order-success', element: withSuspense(<OrderSuccessPage />) },
          { path: 'orders', element: withSuspense(<OrdersPage />) },
          { path: 'orders/:id', element: withSuspense(<OrderDetailPage />) },
          { path: 'profile', element: withSuspense(<ProfilePage />) },
        ],
      },
    ],
  },
  {
    element: <GuestRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: withSuspense(<LoginPage />) },
          { path: 'register', element: withSuspense(<RegisterPage />) },
          { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
          { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
        ],
      },
    ],
  },
  {
    path: 'verify-email',
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: withSuspense(<VerifyEmailPage />) }],
  },
  {
    path: 'admin',
    element: <AdminRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: withSuspense(<AdminDashboardPage />) },
          { path: 'products', element: withSuspense(<AdminProductsPage />) },
          { path: 'products/new', element: withSuspense(<AdminProductFormPage />) },
          { path: 'products/:id/edit', element: withSuspense(<AdminProductFormPage />) },
          { path: 'orders', element: withSuspense(<AdminOrdersPage />) },
          { path: 'users', element: withSuspense(<AdminUsersPage />) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
    errorElement: <RouteErrorBoundary />,
  },
]);