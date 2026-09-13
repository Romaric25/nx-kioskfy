import { useSyncExternalStore } from "react";

const STORAGE_KEY = "selected-organization";

let selected = { organizationId: "", slug: "" };
const listeners = new Set<() => void>();

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      selected = JSON.parse(raw);
    }
  } catch {
    selected = { organizationId: "", slug: "" };
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

export const selectedOrganizationStore = {
  getSnapshot: () => selected,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setSelected: (organizationId: string, slug: string) => {
    selected = { organizationId, slug };
    emit();
  },
  clear: () => {
    selected = { organizationId: "", slug: "" };
    emit();
  },
};

/** React binding to the selected organization (persisted to localStorage). */
export function useSelectedOrganization() {
  return useSyncExternalStore(
    selectedOrganizationStore.subscribe,
    selectedOrganizationStore.getSnapshot,
    () => ({ organizationId: "", slug: "" }),
  );
}
