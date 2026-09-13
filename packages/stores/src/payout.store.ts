import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────

export interface PayoutState {
  payoutId: string | null;
  setPayoutId: (payoutId: string) => void;
  clearPayoutId: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────

/**
 * Stocke l'ID du retrait (payout) en cours.
 * Permet de suivre un retrait Moneroo à travers les redirections.
 */
export const usePayoutStore = create<PayoutState>()(
  persist(
    (set) => ({
      payoutId: null,

      setPayoutId: (payoutId) => set({ payoutId }),

      clearPayoutId: () => set({ payoutId: null }),
    }),
    { name: "payout-storage" },
  ),
);
