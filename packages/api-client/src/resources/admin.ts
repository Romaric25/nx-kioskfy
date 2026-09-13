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

export class AdminResource {
  constructor(private fetch: Fetcher) {}

  /** Get admin dashboard statistics. */
  async getStats(opts?: FetchOptions): Promise<unknown> {
    return this.fetch("/admin/stats", buildInit("GET", opts));
  }

  /** Ban a user (Better Auth admin plugin). */
  async banUser(userId: string, opts?: FetchOptions): Promise<unknown> {
    return this.fetch("/auth/admin/ban-user", buildInit("POST", opts, { userId }));
  }

  /** Unban a user (Better Auth admin plugin). */
  async unbanUser(userId: string, opts?: FetchOptions): Promise<unknown> {
    return this.fetch("/auth/admin/unban-user", buildInit("POST", opts, { userId }));
  }
}
