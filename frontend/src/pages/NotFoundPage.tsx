import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
