import { createApiClient } from "@kioskfy/api-client";

export const api = createApiClient({
  baseUrl:
    (typeof window !== "undefined" &&
      (window as { __API_URL?: string }).__API_URL) ||
    "http://localhost:3000/api",
  onError: (err) => console.error(`[API] ${err.status}: ${err.message}`),
});
