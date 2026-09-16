import { createApiClient } from "@kioskfy/api-client";

const isProd = import.meta.env?.PROD;

const API_URL = isProd
  ? "https://api.kioskfy.com/api"
  : (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    (typeof window !== "undefined" &&
      (window as { __API_URL?: string }).__API_URL) ||
    "http://localhost:3000/api";

export const api = createApiClient({
  baseUrl: API_URL,
  onError: (err) => console.error(`[API] ${err.status}: ${err.message}`),
});
