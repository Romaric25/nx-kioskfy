import type { CountryItem } from "@kioskfy/types";
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

export class CountriesResource {
  constructor(private fetch: Fetcher) {}

  /** Get all countries. */
  async getAll(opts?: FetchOptions): Promise<CountryItem[]> {
    return this.fetch("/countries", buildInit("GET", opts));
  }

  /** Get a country by ID. */
  async getById(id: number, opts?: FetchOptions): Promise<CountryItem> {
    return this.fetch(`/countries/${id}`, buildInit("GET", opts));
  }

  /** Get a country by slug. */
  async getBySlug(slug: string, opts?: FetchOptions): Promise<CountryItem> {
    return this.fetch(`/countries/slug/${slug}`, buildInit("GET", opts));
  }

  /** Get a country by code. */
  async getByCode(code: string, opts?: FetchOptions): Promise<CountryItem> {
    return this.fetch(`/countries/code/${code}`, buildInit("GET", opts));
  }

  /** Create a new country. */
  async create(
    data: {
      name: string;
      slug: string;
      flag: string;
      currency: string;
      code: string;
      host?: string;
    },
    opts?: FetchOptions,
  ): Promise<{ id: number }> {
    return this.fetch("/countries", buildInit("POST", opts, data));
  }

  /** Update a country. */
  async update(
    id: number,
    data: Record<string, unknown>,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(`/countries/${id}`, buildInit("PUT", opts, data));
  }

  /** Delete a country. */
  async delete(id: number, opts?: FetchOptions): Promise<void> {
    return this.fetch(`/countries/${id}`, buildInit("DELETE", opts));
  }
}
