import { create } from 'zustand';

interface UIState {
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

/**
 * Global, cross-cutting UI state (nav toggles, modals, etc.) that doesn't
 * belong to any single feature. Feature-specific state (cart, auth, ...)
 * will get its own store under a feature folder in a later phase.
 */
export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
}));
