import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cartService } from '@/services/cartService';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/contexts/ToastContext';

export function useCart() {
  const queryClient = useQueryClient();
  const { setCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: async () => {
      const cart = await cartService.get();
      setCart(cart);
      return cart;
    },
    enabled: isAuthenticated,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });

  const addItem = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      cartService.addItem(productId, quantity),
    onSuccess: (cart) => {
      setCart(cart);
      invalidate();
      showToast({ title: 'Added to cart', variant: 'success' });
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.updateItem(productId, quantity),
    onSuccess: (cart) => {
      setCart(cart);
      invalidate();
    },
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onSuccess: (cart) => {
      setCart(cart);
      invalidate();
      showToast({ title: 'Removed from cart', variant: 'info' });
    },
  });

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    removeItem: removeItem.mutateAsync,
  };
}
