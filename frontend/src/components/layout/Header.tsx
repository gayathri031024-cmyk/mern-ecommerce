import { Link } from 'react-router-dom';
import { ShoppingCart, Menu } from 'lucide-react';
import { env } from '@config/env';
import { useUIStore } from '@store/useUIStore';

export function Header() {
  const toggleMobileNav = useUIStore((state) => state.toggleMobileNav);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          {env.appName}
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Cart"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={toggleMobileNav}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
