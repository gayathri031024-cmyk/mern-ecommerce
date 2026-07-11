import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from '@routes/router';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { useAuthInit } from '@/hooks/useAuth';

export default function App() {
  const { initializing } = useAuthInit();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </ErrorBoundary>
  );
}

