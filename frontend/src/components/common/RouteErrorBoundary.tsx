import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';

/**
 * Rendered by react-router when a route's loader/action/render throws.
 * Distinct from `ErrorBoundary` (a React class error boundary): this
 * component reads the error via `useRouteError()`, which only works
 * inside the router tree.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message ?? message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="max-w-md text-sm text-gray-500">{message}</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
