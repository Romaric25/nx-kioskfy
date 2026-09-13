import { useSyncExternalStore } from "react";

const STORAGE_KEY = "payment-storage";

let paymentId = "";
const listeners = new Set<() => void>();

function load() {
  try {
    paymentId = window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    paymentId = "";
  }
}

function persist() {
  try {
    if (paymentId) {
      window.localStorage.setItem(STORAGE_KEY, paymentId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable — ignore.
  }
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

// Load the persisted payment id on the client before the first render.
if (typeof window !== "undefined") {
  load();
}

export const paymentStore = {
  getPaymentId: (): string => paymentId,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setPaymentId: (id: string) => {
    paymentId = id;
    emit();
  },
  clearPaymentId: () => {
    paymentId = "";
    emit();
  },
};

/**
 * React binding to the payment store. Keeps the last initialized payment id
 * across the gateway redirect (persisted to localStorage).
 */
export function usePaymentStore(): {
  paymentId: string;
  setPaymentId: (id: string) => void;
  clearPaymentId: () => void;
} {
  const id = useSyncExternalStore(
    paymentStore.subscribe,
    paymentStore.getPaymentId,
    () => "",
  );
  return {
    paymentId: id,
    setPaymentId: paymentStore.setPaymentId,
    clearPaymentId: paymentStore.clearPaymentId,
  };
}
