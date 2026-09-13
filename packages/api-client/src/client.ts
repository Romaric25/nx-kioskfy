import { ApiError } from "./errors";
import type { FetchOptions } from "./types";
import { NewspapersResource } from "./resources/newspapers";
import { CategoriesResource } from "./resources/categories";
import { CountriesResource } from "./resources/countries";
import { OrdersResource } from "./resources/orders";
import { PaymentsResource } from "./resources/payments";
import { PayoutsResource } from "./resources/payouts";
import { FavoritesResource } from "./resources/favorites";
import { FavoriteCountriesResource } from "./resources/favorite-countries";
import { UsersResource } from "./resources/users";
import { OrganizationsResource } from "./resources/organizations";
import { SettingsResource } from "./resources/settings";
import { UploadsResource } from "./resources/uploads";
import { WithdrawalsResource } from "./resources/withdrawals";
import { AdminResource } from "./resources/admin";

// ── Config ───────────────────────────────────────────────────────────────

export interface ApiClientConfig {
  /** Base URL of the NestJS API, e.g. "http://localhost:3000/api" */
  baseUrl: string;
  /** Auth token getter. Return null/undefined if not authenticated. */
  getToken?: () => string | null | undefined;
  /** Called on non-2xx responses. If not provided, throws ApiError. */
  onError?: (error: ApiError) => void;
  /** Send cookies with cross-origin requests. Default: true */
  credentials?: RequestCredentials;
}

// ── Client ───────────────────────────────────────────────────────────────

export interface ApiClient {
  readonly newspapers: NewspapersResource;
  readonly categories: CategoriesResource;
  readonly countries: CountriesResource;
  readonly orders: OrdersResource;
  readonly payments: PaymentsResource;
  readonly payouts: PayoutsResource;
  readonly favorites: FavoritesResource;
  readonly favoriteCountries: FavoriteCountriesResource;
  readonly users: UsersResource;
  readonly organizations: OrganizationsResource;
  readonly settings: SettingsResource;
  readonly uploads: UploadsResource;
  readonly withdrawals: WithdrawalsResource;
  readonly admin: AdminResource;
  /** Update the auth token getter at runtime. */
  setTokenGetter(getToken: () => string | null | undefined): void;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  let _getToken = config.getToken;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function fetcher(path: string, init?: RequestInit): Promise<any> {
    const headers: Record<string, string> = {
      ...((init?.headers as Record<string, string>) || {}),
    };

    const token = _getToken?.();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Don't set Content-Type for GET/HEAD/DELETE or if FormData
    if (init?.body && !headers["Content-Type"] && !(init.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: config.credentials ?? "include",
    });

    if (!response.ok) {
      let body: unknown;
      try { body = await response.json(); } catch { body = await response.text(); }
      const error = new ApiError(
        `API ${response.status}: ${typeof body === "object" && body && "message" in body ? (body as { message: string }).message : response.statusText}`,
        response.status,
        body,
      );
      if (config.onError) {
        config.onError(error);
        throw error;
      }
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined;

    // Some endpoints (e.g. void mutations) return an empty body — avoid
    // calling .json() on it, which would throw.
    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  }

  const client: ApiClient = {
    newspapers: new NewspapersResource(fetcher),
    categories: new CategoriesResource(fetcher),
    countries: new CountriesResource(fetcher),
    orders: new OrdersResource(fetcher),
    payments: new PaymentsResource(fetcher),
    payouts: new PayoutsResource(fetcher),
    favorites: new FavoritesResource(fetcher),
    favoriteCountries: new FavoriteCountriesResource(fetcher),
    users: new UsersResource(fetcher),
    organizations: new OrganizationsResource(fetcher),
    settings: new SettingsResource(fetcher),
    uploads: new UploadsResource(fetcher),
    withdrawals: new WithdrawalsResource(fetcher),
    admin: new AdminResource(fetcher),
    setTokenGetter(getToken) {
      _getToken = getToken;
    },
  };

  return client;
}
