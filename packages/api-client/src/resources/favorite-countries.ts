import type { CountryItem, CountryWithFavoriteStatus } from "@kioskfy/types";
import type { FetchOptions } from "../types";

type Fetcher = (path: string, init?: RequestInit) => Promise<any>;

function buildInit(
  method: string,
  opts?: FetchOptions,
  body?: unknown,
): RequestInit {
  const init: RequestInit = { method };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }

  if (opts?.headers) {
    init.headers = {
      ...((init.headers as Record<string, string>) ?? {}),
      ...opts.headers,
    };
  }

  if (opts?.signal) {
    init.signal = opts.signal;
  }

  return init;
}

export class FavoriteCountriesResource {
  constructor(private fetch: Fetcher) {}

  /** Get the current user's favorite countries. */
  async getMy(opts?: FetchOptions): Promise<CountryItem[]> {
    return this.fetch("/favorite-countries", buildInit("GET", opts));
  }

  /** Get all countries with favorite status for the current user. */
  async getAllWithStatus(
    opts?: FetchOptions,
  ): Promise<CountryWithFavoriteStatus[]> {
    return this.fetch("/favorite-countries/all", buildInit("GET", opts));
  }

  /** Add a country to the current user's favorites. */
  async add(
    countryId: string,
    opts?: FetchOptions,
  ): Promise<unknown> {
    return this.fetch(
      `/favorite-countries/${countryId}`,
      buildInit("POST", opts),
    );
  }

  /** Remove a country from the current user's favorites. */
  async remove(
    countryId: string,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(
      `/favorite-countries/${countryId}`,
      buildInit("DELETE", opts),
    );
  }

  /** Toggle a country's favorite status. */
  async toggle(
    countryId: string,
    opts?: FetchOptions,
  ): Promise<{ isFavorite: boolean }> {
    return this.fetch(
      `/favorite-countries/${countryId}/toggle`,
      buildInit("POST", opts),
    );
  }

  /** Get favorite newspapers grouped by country. */
  async getNewspapers(opts?: FetchOptions): Promise<unknown[]> {
    return this.fetch(
      "/favorite-countries/newspapers",
      buildInit("GET", opts),
    );
  }
}
