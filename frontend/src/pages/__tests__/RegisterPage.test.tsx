import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { RegisterPage } from '@/pages/RegisterPage';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/contexts/ToastContext';

// Page-level integration test: real RegisterPage, real useAuth hook, real
// authStore, real router navigation. Only the network boundary
// (authService) is mocked.
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

function renderRegisterPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<div>Home page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
  await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
  await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
}

describe('RegisterPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
  });

  it('registers, stores the session, and redirects home on success', async () => {
    const user = userEvent.setup();
    mockedAuthService.register.mockResolvedValue({
      user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', role: 'customer' } as never,
      accessToken: 'token-123',
    });

    renderRegisterPage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument());
    expect(mockedAuthService.register).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shows a client-side error and never calls the API for an invalid email', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it('shows a client-side error and never calls the API for a weak password', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it('shows a client-side error when the passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it('shows a server-error message and stays on the page when the API rejects (e.g. duplicate email)', async () => {
    const user = userEvent.setup();
    mockedAuthService.register.mockRejectedValue(new Error('Email already in use'));

    renderRegisterPage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/could not create your account/i)).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });

  it('disables the submit button while the request is in flight', async () => {
    const user = userEvent.setup();
    let resolveRegister!: (value: { user: unknown; accessToken: string }) => void;
    mockedAuthService.register.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve as never;
      }),
    );

    renderRegisterPage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled());

    resolveRegister({
      user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', role: 'customer' },
      accessToken: 'token-123',
    });
    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument());
  });
});