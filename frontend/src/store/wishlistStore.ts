import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
  has: (id: number) => boolean;
  toggle: (product: Product) => void;
  remove: (id: number) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      has: (id) => get().items.some((p) => p.id === id),

      toggle: (product) => {
        const exists = get().has(product.id);
        if (exists) {
          set((s) => ({ items: s.items.filter((p) => p.id !== product.id) }));
        } else {
          set((s) => ({ items: [...s.items, product] }));
        }
      },

      remove: (id) => set((s) => ({ items: s.items.filter((p) => p.id !== id) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'shebliss-wishlist',
    },
  ),
);
