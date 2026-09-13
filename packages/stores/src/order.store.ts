import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────

export interface OrderState {
  selectedItemIds: readonly string[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  hasItem: (id: string) => boolean;
  clearItems: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────

/**
 * Gère la sélection d'articles avant la commande.
 * Persisté dans le localStorage pour survivre aux rechargements.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      selectedItemIds: [],

      addItem: (id) =>
        set((state) => {
          if (state.selectedItemIds.includes(id)) return state;
          return { selectedItemIds: [...state.selectedItemIds, id] };
        }),

      removeItem: (id) =>
        set((state) => ({
          selectedItemIds: state.selectedItemIds.filter((itemId) => itemId !== id),
        })),

      hasItem: (id) => get().selectedItemIds.includes(id),

      clearItems: () => set({ selectedItemIds: [] }),
    }),
    { name: "order-storage" },
  ),
);
