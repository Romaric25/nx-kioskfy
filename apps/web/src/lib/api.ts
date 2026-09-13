import { createApiClient } from "@kioskfy/api-client";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof window !== "undefined" &&
    (window as { __API_URL?: string }).__API_URL) ||
  "http://localhost:3000/api";

/** Origin of the API server (without the /api path) — used for auth endpoints. */
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const api = createApiClient({
  baseUrl: API_URL,
  onError: (err) => console.error(`[API] ${err.status}: ${err.message}`),
});
