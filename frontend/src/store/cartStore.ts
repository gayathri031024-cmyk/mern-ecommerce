import { create } from 'zustand';

import { Cart } from '@/types';

interface CartState {
  cart: Cart;
  isDrawerOpen: boolean;
  setCart: (cart: Cart) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const emptyCart: Cart = { items: [], subtotal: 0, itemCount: 0 };

export const useCartStore = create<CartState>((set) => ({
  cart: emptyCart,
  isDrawerOpen: false,
  setCart: (cart) => set({ cart }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}));
