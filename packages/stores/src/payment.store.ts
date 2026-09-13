import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────

export interface PaymentState {
  paymentId: string | null;
  setPaymentId: (paymentId: string) => void;
  clearPaymentId: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────

/**
 * Stocke l'ID du paiement en cours.
 * Permet de suivre un paiement Moneroo à travers les redirections.
 */
export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      paymentId: null,

      setPaymentId: (paymentId) => set({ paymentId }),

      clearPaymentId: () => set({ paymentId: null }),
    }),
    { name: "payment-storage" },
  ),
);
