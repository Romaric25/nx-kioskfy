import type { SiteSetting } from "@kioskfy/types";
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

export class SettingsResource {
  constructor(private fetch: Fetcher) {}

  /** Get all site settings. */
  async getAll(
    opts?: FetchOptions,
  ): Promise<Record<string, SiteSetting>> {
    return this.fetch("/settings", buildInit("GET", opts));
  }

  /** Update site settings. */
  async update(
    data: Record<string, unknown>,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch("/settings", buildInit("PUT", opts, data));
  }

  /** Seed default settings. */
  async seed(opts?: FetchOptions): Promise<void> {
    return this.fetch("/settings/seed", buildInit("POST", opts));
  }
}
