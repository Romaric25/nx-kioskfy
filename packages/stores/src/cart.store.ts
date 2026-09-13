import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  price: number;
  /** Optionnel : métadonnées pour l'affichage (titre, image, etc.) */
  title?: string;
  coverImage?: string;
}

export interface CartState {
  items: readonly CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  /** Retourne le total du panier */
  getTotal: () => number;
}

// ── Store ────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        if (items.some((i) => i.id === item.id)) return; // déjà présent
        set({ items: [...items, item] });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearCart: () => set({ items: [] }),

      isInCart: (id) => get().items.some((item) => item.id === id),

      getTotal: () =>
        get().items.reduce((acc, item) => acc + item.price, 0),
    }),
    { name: "cart-storage" },
  ),
);
