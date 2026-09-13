import { create } from "zustand";
import { combine } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────

export type ErrorType = "error" | "warning" | "info";

export interface ErrorMessage {
  id: string;
  title?: string;
  message: string;
  type?: ErrorType;
}

export interface ErrorState {
  errors: readonly ErrorMessage[];
  addError: (error: Omit<ErrorMessage, "id">) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────

/**
 * Store global pour la gestion des erreurs applicatives.
 * Non persisté (les erreurs sont volatiles par nature).
 */
export const useErrorStore = create(
  combine(
    {
      errors: [] as ErrorMessage[],
    },
    (set) => ({
      addError: (error: Omit<ErrorMessage, "id">) =>
        set((state) => {
          // Déduplication : ne pas ajouter deux fois la même erreur
          const exists = state.errors.some(
            (e) => e.message === error.message && e.title === error.title,
          );
          if (exists) return state;
          return {
            errors: [
              ...state.errors,
              { ...error, id: crypto.randomUUID() },
            ],
          };
        }),

      removeError: (id: string) =>
        set((state) => ({
          errors: state.errors.filter((e) => e.id !== id),
        })),

      clearErrors: () => set({ errors: [] }),
    }),
  ),
);
