import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { ToastProvider } from '@/contexts/ToastContext';
import { Product } from '@/types';

// Page-level integration test: real ProductDetailPage, real useProduct/
// useCart hooks, real cartStore/wishlistStore, real router. Only the
// network boundary (productService/cartService) is mocked.
vi.mock('@/services/productService', () => ({
  productService: {
    list: vi.fn(),
    getBySlug: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/services/cartService', () => ({
  cartService: {
    get: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const mockedProductService = vi.mocked(productService, true);
const mockedCartService = vi.mocked(cartService, true);

const baseProduct: Product = {
  id: 'p1',
  title: 'Mechanical Keyboard',
  slug: 'mechanical-keyboard',
  description: 'Clicky and satisfying',
  price: 120,
  currency: 'USD',
  stock: 8,
  sku: 'SKU-KB-1',
  rating: 4.5,
  reviewCount: 12,
  images: [{ id: 'img1', url: '/keyboard.jpg', alt: 'Keyboard' }],
  category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
  tags: [],
  createdAt: new Date().toISOString(),
};

const emptyCart = { items: [], subtotal: 0, itemCount: 0 };

function renderProductDetailPage(slug = 'mechanical-keyboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/products/${slug}`]}>
          <Routes>
            <Route path="/products/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('ProductDetailPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true });
    useCartStore.setState({ cart: emptyCart, isDrawerOpen: false });
    useWishlistStore.setState({ productIds: [] });
    mockedCartService.get.mockResolvedValue(emptyCart);
  });

  it('renders the product details once loaded', async () => {
    mockedProductService.getBySlug.mockResolvedValue(baseProduct);
    renderProductDetailPage();

    expect(await screen.findByRole('heading', { name: 'Mechanical Keyboard' })).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();
    expect(screen.getByText(/8 in stock/i)).toBeInTheDocument();
    expect(screen.getByText(/SKU SKU-KB-1/i)).toBeInTheDocument();
    expect(mockedProductService.getBySlug).toHaveBeenCalledWith('mechanical-keyboard');
  });

  it('shows a not-found state when the product does not exist', async () => {
    mockedProductService.getBySlug.mockResolvedValue(undefined as never);
    renderProductDetailPage('does-not-exist');

    expect(await screen.findByText('Product not found')).toBeInTheDocument();
  });

  it('shows the sale badge and strikethrough price when on sale', async () => {
    mockedProductService.getBySlug.mockResolvedValue({ ...baseProduct, compareAtPrice: 150 });
    renderProductDetailPage();

    expect(await screen.findByText('Sale')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('disables "Add to cart" when the product is out of stock', async () => {
    mockedProductService.getBySlug.mockResolvedValue({ ...baseProduct, stock: 0 });
    renderProductDetailPage();

    await screen.findByRole('heading', { name: 'Mechanical Keyboard' });
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  it('increases the quantity and adds that quantity to the cart', async () => {
    const user = userEvent.setup();
    mockedProductService.getBySlug.mockResolvedValue(baseProduct);
    mockedCartService.addItem.mockResolvedValue({
      items: [{ productId: 'p1', product: baseProduct, quantity: 3, priceAtAdd: 120 }],
      subtotal: 360,
      itemCount: 3,
    });

    renderProductDetailPage();
    await screen.findByRole('heading', { name: 'Mechanical Keyboard' });

    await user.click(screen.getByRole('button', { name: /increase quantity/i }));
    await user.click(screen.getByRole('button', { name: /increase quantity/i }));
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    await waitFor(() => expect(mockedCartService.addItem).toHaveBeenCalledWith('p1', 3));
  });

  it('never lets the quantity go below 1', async () => {
    const user = userEvent.setup();
    mockedProductService.getBySlug.mockResolvedValue(baseProduct);
    renderProductDetailPage();
    await screen.findByRole('heading', { name: 'Mechanical Keyboard' });

    await user.click(screen.getByRole('button', { name: /decrease quantity/i }));
    await user.click(screen.getByRole('button', { name: /decrease quantity/i }));

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('toggles the wishlist state and updates the button label', async () => {
    const user = userEvent.setup();
    mockedProductService.getBySlug.mockResolvedValue(baseProduct);
    renderProductDetailPage();
    await screen.findByRole('heading', { name: 'Mechanical Keyboard' });

    expect(screen.getByRole('button', { name: /add to wishlist/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add to wishlist/i }));

    expect(screen.getByRole('button', { name: /remove from wishlist/i })).toBeInTheDocument();
    expect(useWishlistStore.getState().productIds).toContain('p1');
  });
});