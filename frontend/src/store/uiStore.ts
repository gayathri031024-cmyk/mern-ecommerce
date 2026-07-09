import { create } from 'zustand';

interface UIState {
  isMobileNavOpen: boolean;
  isAdminSidebarCollapsed: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  toggleAdminSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  isAdminSidebarCollapsed: false,
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleAdminSidebar: () =>
    set((state) => ({ isAdminSidebarCollapsed: !state.isAdminSidebarCollapsed })),
}));
