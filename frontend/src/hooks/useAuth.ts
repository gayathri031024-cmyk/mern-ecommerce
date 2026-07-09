import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { LoginPayload, RegisterPayload } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export function useAuth() {
  const { user, isAuthenticated, setSession, logout: clearSession } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      showToast({ title: 'Welcome back', description: `Signed in as ${data.user.name}`, variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Sign in failed', description: 'Check your email and password.', variant: 'error' });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      showToast({ title: 'Account created', description: 'Welcome to Shopfront!', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Registration failed', description: 'Please review your details.', variant: 'error' });
    },
  });

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
      queryClient.clear();
      showToast({ title: 'Signed out', variant: 'info' });
    }
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
  };
}

/** Runs once on app boot to hydrate the session from the httpOnly refresh cookie. */
export function useAuthInit() {
  const [initializing, setInitializing] = useState(true);
  const { setUser, accessToken, logout } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!accessToken) {
        setInitializing(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { initializing };
}
