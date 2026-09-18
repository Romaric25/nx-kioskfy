import { createApiClient } from "@kioskfy/api-client";

const isProd = import.meta.env?.PROD;

const envApiUrl =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined;

// En prod : VITE_API_URL permet de pointer vers une API du même site que le
// frontend (ex: https://api.<ip>.sslip.io/api pour les domaines de test),
// sinon on utilise le domaine officiel. En dev : localhost.
const API_URL = isProd
  ? envApiUrl || "https://api.kioskfy.com/api"
  : envApiUrl ||
    (typeof window !== "undefined" &&
      (window as { __API_URL?: string }).__API_URL) ||
    "http://localhost:3000/api";

/** Origin of the API server (without the /api path) — used for auth endpoints. */
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const api = createApiClient({
  baseUrl: API_URL,
  onError: (err) => console.error(`[API] ${err.status}: ${err.message}`),
});
