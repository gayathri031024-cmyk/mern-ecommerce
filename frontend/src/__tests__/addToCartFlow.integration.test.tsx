import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { ProductCard } from '@/components/common/ProductCard';
import { CartSummary } from '@/components/cart/CartSummary';
import { cartService } from '@/services/cartService';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCart } from '@/hooks/useCart';
import { ToastProvider } from '@/contexts/ToastContext';
import { Product } from '@/types';

// Integration test: renders the real ProductCard + real useCart hook +
// real cartStore + real CartSummary together, so "add to cart" flowing
// through to the order summary is exercised end-to-end. Only the network
// boundary (cartService, i.e. axios) is mocked.
vi.mock('@/services/cartService', () => ({
  cartService: {
    get: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const mockedCartService = vi.mocked(cartService, true);

const product: Product = {
  id: 'p1',
  title: 'Mechanical Keyboard',
  slug: 'mechanical-keyboard',
  description: 'Clicky and satisfying',
  price: 120,
  currency: 'USD',
  stock: 8,
  sku: 'SKU-KB-1',
  rating: 5,
  reviewCount: 12,
  images: [{ id: 'img1', url: '/keyboard.jpg', alt: 'Keyboard' }],
  category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
  tags: [],
  createdAt: new Date().toISOString(),
};

const emptyCart = { items: [], subtotal: 0, itemCount: 0 };
const cartWithKeyboard = {
  items: [{ product: product as never, quantity: 1, priceAtAdd: 120 }],
  subtotal: 120,
  itemCount: 1,
};

function Harness() {
  const { cart } = useCart();
  return (
    <>
      <ProductCard product={product} />
      <CartSummary cart={cart ?? emptyCart} />
    </>
  );
}

function renderHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <Harness />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Add-to-cart flow (ProductCard -> useCart -> cartStore -> CartSummary)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true });
    useCartStore.setState({ cart: emptyCart, isDrawerOpen: false });
    useWishlistStore.setState({ productIds: [] });
  });

  it('starts with an empty order summary and a disabled checkout link', async () => {
    mockedCartService.get.mockResolvedValue(emptyCart);
    renderHarness();

    await waitFor(() => expect(mockedCartService.get).toHaveBeenCalled());
    expect(screen.getByText('Subtotal (0 items)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /proceed to checkout/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('updates the order summary total after adding the product to the cart', async () => {
    const user = userEvent.setup();
    // Initial GET /cart (on mount) returns empty; the addItem mutation
    // resolves the updated cart directly, and the invalidated refetch
    // triggered afterwards should see the same updated cart, not stale data.
    mockedCartService.get.mockResolvedValueOnce(emptyCart).mockResolvedValue(cartWithKeyboard);
    mockedCartService.addItem.mockResolvedValue(cartWithKeyboard);

    renderHarness();
    await waitFor(() => expect(screen.getByText('Subtotal (0 items)')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add mechanical keyboard to cart/i }));

    await waitFor(() => expect(screen.getByText('Subtotal (1 items)')).toBeInTheDocument());
    expect(mockedCartService.addItem).toHaveBeenCalledWith('p1', undefined);
    expect(useCartStore.getState().cart.itemCount).toBe(1);
    expect(screen.getByRole('link', { name: /proceed to checkout/i })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByText('$136.59')).toBeInTheDocument(); // 120 + 6.99 shipping + 8% tax, formatted
  });

  it('shows an error toast and leaves the summary unchanged when the mutation is rejected (no unhandled rejection)', async () => {
    const user = userEvent.setup();
    mockedCartService.get.mockResolvedValue(emptyCart);
    mockedCartService.addItem.mockRejectedValue(new Error('Not enough stock available'));

    renderHarness();
    await waitFor(() => expect(screen.getByText('Subtotal (0 items)')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add mechanical keyboard to cart/i }));

    expect(await screen.findByText('Could not add to cart')).toBeInTheDocument();
    expect(screen.getByText('Subtotal (0 items)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /proceed to checkout/i })).toHaveAttribute('aria-disabled', 'true');
  });
});
