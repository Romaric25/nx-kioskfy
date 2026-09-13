import { useSyncExternalStore } from "react";
import type { NewspaperItem } from "@kioskfy/types";

/**
 * A newspaper/magazine item stored in the cart. Extends the public
 * `NewspaperItem` with the extra fields the cart UI needs
 * (organization metadata, country currency).
 */
export interface CartItem extends NewspaperItem {
  organization?: {
    id: string;
    name: string;
    slug?: string;
    logo?: string | null;
    metadata?: Record<string, unknown> | string | null;
  } | null;
  country?: {
    id: number;
    name: string;
    slug: string;
    flag: string;
    currency?: string;
  } | null;
}

const STORAGE_KEY = "cart-storage";

// Stable empty snapshot returned during SSR/hydration to avoid
// a hydration mismatch between server HTML and the client's stored cart.
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
const listeners = new Set<() => void>();

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { items?: CartItem[] };
    items = Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    items = [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    // Storage may be unavailable (private mode, quota) — ignore.
  }
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

// Load the persisted cart on the client before the first render.
if (typeof window !== "undefined") {
  load();
}

export const cartStore = {
  getItems: (): CartItem[] => items,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  addItem: (item: CartItem) => {
    // Don't add if the item already exists
    if (items.some((i) => i.id === item.id)) return;
    items = [...items, item];
    emit();
  },
  removeItem: (id: string) => {
    items = items.filter((item) => item.id !== id);
    emit();
  },
  clearCart: () => {
    items = [];
    emit();
  },
  isInCart: (id: string): boolean => items.some((item) => item.id === id),
  total: (): number =>
    items.reduce((acc, item) => acc + Number(item.price), 0),
};

/** React binding to the cart store (reactive, persisted to localStorage). */
export function useCartStore(): CartItem[] {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getItems, () => EMPTY);
}
