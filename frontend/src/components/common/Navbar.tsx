import { Link, useNavigate } from 'react-router-dom';
import { Heart, Menu, Moon, ShoppingCart, Sun, User, X } from 'lucide-react';

import { SearchBar } from './SearchBar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/contexts/ThemeContext';
import { ROUTES } from '@/utils/constants';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCartStore();
  const { productIds } = useWishlistStore();
  const { isMobileNavOpen, toggleMobileNav } = useUIStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <button
          type="button"
          className="md:hidden"
          onClick={toggleMobileNav}
          aria-label="Toggle navigation menu"
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to={ROUTES.HOME} className="text-xl font-display font-bold">
          Shopfront
        </Link>

        <nav className="ml-2 hidden items-center gap-5 text-sm md:flex">
          <Link to={ROUTES.PRODUCTS} className="hover:text-accent">
            Shop
          </Link>
        </nav>

        <div className="ml-auto hidden md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-3 md:ml-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg p-1.5 text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link to={ROUTES.WISHLIST} className="relative" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {productIds.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                {productIds.length}
              </span>
            )}
          </Link>

          <Link to={ROUTES.CART} className="relative" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cart.itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                {cart.itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <Dropdown trigger={<User className="h-5 w-5 cursor-pointer" aria-label="Account menu" />}>
              <div className="px-3 py-2 text-xs text-ink/50">{user?.email}</div>
              <DropdownItem onClick={() => navigate(ROUTES.PROFILE)}>Profile</DropdownItem>
              <DropdownItem onClick={() => navigate(ROUTES.ORDERS)}>Orders</DropdownItem>
              {user?.role === 'admin' && (
                <DropdownItem onClick={() => navigate(ROUTES.ADMIN)}>Admin dashboard</DropdownItem>
              )}
              <DropdownItem onClick={() => logout()}>Sign out</DropdownItem>
            </Dropdown>
          ) : (
            <Link to={ROUTES.LOGIN} className="text-sm font-medium hover:text-accent">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="border-t border-border p-4 md:hidden">
          <SearchBar />
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <Link to={ROUTES.PRODUCTS}>Shop</Link>
            <Link to={ROUTES.WISHLIST}>Wishlist</Link>
            <Link to={ROUTES.ORDERS}>Orders</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
