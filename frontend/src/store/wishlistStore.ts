import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const current = get().productIds;
        set({
          productIds: current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [...current, productId],
        });
      },
      isWishlisted: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'shopfront_wishlist' },
  ),
);
