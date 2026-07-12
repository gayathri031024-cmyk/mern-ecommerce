import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { LoginPage } from '@/pages/LoginPage';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/contexts/ToastContext';

// This is a page-level integration test: it exercises the real LoginPage,
// the real useAuth hook, the real Zustand auth store, and React Router
// navigation together. Only the network boundary (authService) is mocked.
vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService, true);

function renderLoginPage(initialEntries: string[] = ['/login']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Home page</div>} />
            <Route path="/account" element={<div>Account page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );

  return {
    ...utils,
    emailInput: screen.getByLabelText('Email') as HTMLInputElement,
    passwordInput: screen.getByLabelText('Password') as HTMLInputElement,
  };
}

describe('LoginPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
  });

  it('logs the user in, stores the session, and redirects to home on success', async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockResolvedValue({
      user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', role: 'customer' } as never,
      accessToken: 'token-123',
    });

    const { emailInput, passwordInput } = renderLoginPage();

    await user.type(emailInput, 'jane@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument());

    expect(mockedAuthService.login).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'Password123!',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('token-123');
  });

  it('redirects back to the originally-requested page after login', async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockResolvedValue({
      user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', role: 'customer' } as never,
      accessToken: 'token-123',
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter
            initialEntries={[{ pathname: '/login', state: { from: { pathname: '/account' } } }]}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/account" element={<div>Account page</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>,
    );
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    await user.type(emailInput, 'jane@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Account page')).toBeInTheDocument());
  });

  it('shows an inline error and stays on the page when credentials are rejected', async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

    const { emailInput, passwordInput } = renderLoginPage();

    await user.type(emailInput, 'jane@example.com');
    await user.type(passwordInput, 'WrongPassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });

  it('disables the submit button and shows a loading state while the request is in flight', async () => {
    const user = userEvent.setup();
    let resolveLogin!: (value: { user: unknown; accessToken: string }) => void;
    mockedAuthService.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve as never;
      }),
    );

    const { emailInput, passwordInput } = renderLoginPage();

    await user.type(emailInput, 'jane@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled());

    await act(async () => {
      resolveLogin({
        user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', role: 'customer' },
        accessToken: 'token-123',
      });
    });
  });

  it('requires both email and password before the browser allows submission', async () => {
    const { emailInput, passwordInput } = renderLoginPage();

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});
