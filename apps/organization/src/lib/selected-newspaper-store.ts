import { useSyncExternalStore } from "react";

const STORAGE_KEY = "selected-newspaper";

let selected = { newspaperId: "" };
const listeners = new Set<() => void>();

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      selected = JSON.parse(raw);
    }
  } catch {
    selected = { newspaperId: "" };
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  } catch {
    // Storage may be unavailable — ignore.
  }
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  load();
}

export const selectedNewspaperStore = {
  getSnapshot: () => selected,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setSelected: (newspaperId: string) => {
    selected = { newspaperId };
    emit();
  },
  clear: () => {
    selected = { newspaperId: "" };
    emit();
  },
};

/** React binding to the newspaper selected for PDF preview (persisted to localStorage). */
export function useSelectedNewspaper() {
  return useSyncExternalStore(
    selectedNewspaperStore.subscribe,
    selectedNewspaperStore.getSnapshot,
    () => ({ newspaperId: "" }),
  );
}
