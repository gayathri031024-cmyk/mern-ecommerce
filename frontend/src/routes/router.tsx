import { createBrowserRouter } from 'react-router-dom';

import { MainLayout } from '@components/layout/MainLayout';
import { AuthLayout } from '@components/layout/AuthLayout';
import { AdminLayout } from '@components/layout/AdminLayout';
import { RouteErrorBoundary } from '@components/common/RouteErrorBoundary';

import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { GuestRoute } from './GuestRoute';

import { HomePage } from '@pages/HomePage';
import { ProductListPage } from '@pages/ProductListPage';
import { ProductDetailPage } from '@pages/ProductDetailPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutPage } from '@pages/CheckoutPage';
import { OrderSuccessPage } from '@pages/OrderSuccessPage';
import { OrdersPage } from '@pages/OrdersPage';
import { OrderDetailPage } from '@pages/OrderDetailPage';
import { WishlistPage } from '@pages/WishlistPage';
import { ProfilePage } from '@pages/ProfilePage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { ForgotPasswordPage } from '@pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@pages/ResetPasswordPage';
import { VerifyEmailPage } from '@pages/VerifyEmailPage';
import { NotFoundPage } from '@pages/NotFoundPage';

import { AdminDashboardPage } from '@pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '@pages/admin/AdminProductsPage';
import { AdminProductFormPage } from '@pages/admin/AdminProductFormPage';
import { AdminOrdersPage } from '@pages/admin/AdminOrdersPage';
import { AdminUsersPage } from '@pages/admin/AdminUsersPage';

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
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'wishlist', element: <WishlistPage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'order-success', element: <OrderSuccessPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
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
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    path: 'verify-email',
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [{ index: true, element: <VerifyEmailPage /> }],
  },
  {
    path: 'admin',
    element: <AdminRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'products/new', element: <AdminProductFormPage /> },
          { path: 'products/:id/edit', element: <AdminProductFormPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'users', element: <AdminUsersPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouteErrorBoundary />,
  },
]);

