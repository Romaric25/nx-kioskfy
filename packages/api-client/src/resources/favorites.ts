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

export class FavoritesResource {
  constructor(private fetch: Fetcher) {}

  /** Get all favorite newspapers for the current user. */
  async getAll(opts?: FetchOptions): Promise<unknown[]> {
    return this.fetch("/favorites", buildInit("GET", opts));
  }

  /** Check if a newspaper is in the current user's favorites. */
  async check(
    newspaperId: string,
    opts?: FetchOptions,
  ): Promise<{ isFavorite: boolean }> {
    return this.fetch(
      `/favorites/check/${newspaperId}`,
      buildInit("GET", opts),
    );
  }

  /** Add a newspaper to the current user's favorites. */
  async add(
    newspaperId: string,
    opts?: FetchOptions,
  ): Promise<unknown> {
    return this.fetch(
      `/favorites/${newspaperId}`,
      buildInit("POST", opts),
    );
  }

  /** Remove a newspaper from the current user's favorites. */
  async remove(
    newspaperId: string,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(
      `/favorites/${newspaperId}`,
      buildInit("DELETE", opts),
    );
  }

  /** Toggle a newspaper's favorite status. */
  async toggle(
    newspaperId: string,
    opts?: FetchOptions,
  ): Promise<{ isFavorite: boolean }> {
    return this.fetch(
      `/favorites/${newspaperId}/toggle`,
      buildInit("POST", opts),
    );
  }
}
