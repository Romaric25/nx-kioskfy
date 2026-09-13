import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────

export interface NewspaperState {
  selectedNewspaperId: string | null;
  selectedNewspaperSlug: string | null;
  setSelectedNewspaper: (id: string, slug: string) => void;
  clearSelectedNewspaper: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────

/**
 * Journal actuellement sélectionné (pour la navigation ou le détail).
 * Persisté pour restaurer la sélection après rechargement.
 */
export const useNewspaperStore = create<NewspaperState>()(
  persist(
    (set) => ({
      selectedNewspaperId: null,
      selectedNewspaperSlug: null,

      setSelectedNewspaper: (id, slug) =>
        set({ selectedNewspaperId: id, selectedNewspaperSlug: slug }),

      clearSelectedNewspaper: () =>
        set({ selectedNewspaperId: null, selectedNewspaperSlug: null }),
    }),
    { name: "selected-newspaper-storage" },
  ),
);
