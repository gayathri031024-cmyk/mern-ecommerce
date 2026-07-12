import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { CheckoutPage } from '@/pages/CheckoutPage';
import { cartService } from '@/services/cartService';
import { orderService } from '@/services/orderService';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ToastProvider } from '@/contexts/ToastContext';
import { Product } from '@/types';

// Page-level integration test: exercises the real CheckoutPage, the real
// useCart/useCreateOrder hooks, the real Zustand cart store, and React
// Router navigation together. Only the network boundary (cartService /
// orderService) is mocked.
vi.mock('@/services/cartService', () => ({
  cartService: {
    get: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('@/services/orderService', () => ({
  orderService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

const mockedCartService = vi.mocked(cartService, true);
const mockedOrderService = vi.mocked(orderService, true);

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
  items: [{ productId: 'p1', product, quantity: 1, priceAtAdd: 120 }],
  subtotal: 120,
  itemCount: 1,
};

function renderCheckoutPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<div>Order success page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );

  return { ...utils, addressInput: screen.getByLabelText('Saved address ID') as HTMLInputElement };
}

describe('CheckoutPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true });
    useCartStore.setState({ cart: emptyCart, isDrawerOpen: false });
  });

  it('renders the order summary from the current cart', async () => {
    mockedCartService.get.mockResolvedValue(cartWithKeyboard);
    renderCheckoutPage();

    expect(await screen.findByText(/mechanical keyboard × 1/i)).toBeInTheDocument();
    // Both the line item total and the subtotal show $120.00 for this cart.
    expect(screen.getAllByText('$120.00')).toHaveLength(2);
  });

  it('disables the "Place order" button while the cart is empty', async () => {
    mockedCartService.get.mockResolvedValue(emptyCart);
    renderCheckoutPage();

    await waitFor(() => expect(mockedCartService.get).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /place order/i })).toBeDisabled();
  });

  it('enables the "Place order" button once the cart has items', async () => {
    mockedCartService.get.mockResolvedValue(cartWithKeyboard);
    renderCheckoutPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled());
  });

  it('submits the address and default payment method, then navigates to the success page', async () => {
    const user = userEvent.setup();
    mockedCartService.get.mockResolvedValue(cartWithKeyboard);
    mockedOrderService.create.mockResolvedValue({ id: 'order1' } as never);

    const { addressInput } = renderCheckoutPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled());

    await user.type(addressInput, 'addr_123');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(screen.getByText('Order success page')).toBeInTheDocument());
    expect(mockedOrderService.create).toHaveBeenCalledWith({
      shippingAddressId: 'addr_123',
      paymentMethod: 'card',
    });
  });

  it('submits the payment method selected from the dropdown', async () => {
    const user = userEvent.setup();
    mockedCartService.get.mockResolvedValue(cartWithKeyboard);
    mockedOrderService.create.mockResolvedValue({ id: 'order1' } as never);

    const { addressInput } = renderCheckoutPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled());

    await user.type(addressInput, 'addr_456');
    await user.selectOptions(screen.getByRole('combobox'), 'paypal');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() =>
      expect(mockedOrderService.create).toHaveBeenCalledWith({
        shippingAddressId: 'addr_456',
        paymentMethod: 'paypal',
      }),
    );
  });

  it('shows an error toast and stays on the page when order creation fails', async () => {
    const user = userEvent.setup();
    mockedCartService.get.mockResolvedValue(cartWithKeyboard);
    mockedOrderService.create.mockRejectedValue(new Error('Insufficient stock'));

    const { addressInput } = renderCheckoutPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled());

    await user.type(addressInput, 'addr_123');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText('Order failed')).toBeInTheDocument();
    expect(screen.queryByText('Order success page')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('shows a loading state on the button while the order request is in flight', async () => {
    const user = userEvent.setup();
    mockedCartService.get.mockResolvedValue(cartWithKeyboard);
    let resolveCreate!: (value: unknown) => void;
    mockedOrderService.create.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }) as never,
    );

    const { addressInput } = renderCheckoutPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled());

    await user.type(addressInput, 'addr_123');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).toBeDisabled());

    resolveCreate({ id: 'order1' });
    await waitFor(() => expect(screen.getByText('Order success page')).toBeInTheDocument());
  });
});
