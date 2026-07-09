import { create } from 'zustand';

import { AuthUser } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { storage } from '@/utils/storage';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  isAuthenticated: Boolean(storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN)),

  setSession: (user, accessToken) => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  logout: () => {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
