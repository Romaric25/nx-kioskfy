import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────

export interface OrganizationState {
  selectedOrganizationId: string | null;
  selectedOrganizationSlug: string | null;
  setSelectedOrganization: (id: string, slug: string) => void;
  clearSelectedOrganization: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────

/**
 * Organisation actuellement sélectionnée (dashboard, filtrage, etc.).
 * Persisté pour restaurer la sélection après rechargement.
 */
export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      selectedOrganizationId: null,
      selectedOrganizationSlug: null,

      setSelectedOrganization: (id, slug) =>
        set({ selectedOrganizationId: id, selectedOrganizationSlug: slug }),

      clearSelectedOrganization: () =>
        set({ selectedOrganizationId: null, selectedOrganizationSlug: null }),
    }),
    { name: "selected-organization-storage" },
  ),
);
