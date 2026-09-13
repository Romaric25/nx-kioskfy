import type { CategoryItem } from "@kioskfy/types";
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

export class CategoriesResource {
  constructor(private fetch: Fetcher) {}

  /** Get all categories. */
  async getAll(opts?: FetchOptions): Promise<CategoryItem[]> {
    return this.fetch("/categories", buildInit("GET", opts));
  }

  /** Get a category by ID. */
  async getById(id: number, opts?: FetchOptions): Promise<CategoryItem> {
    return this.fetch(`/categories/${id}`, buildInit("GET", opts));
  }

  /** Get a category by slug. */
  async getBySlug(slug: string, opts?: FetchOptions): Promise<CategoryItem> {
    return this.fetch(`/categories/slug/${slug}`, buildInit("GET", opts));
  }

  /** Create a new category. */
  async create(
    data: {
      name: string;
      slug: string;
      icon: string;
      color?: string;
    },
    opts?: FetchOptions,
  ): Promise<{ id: number }> {
    return this.fetch("/categories", buildInit("POST", opts, data));
  }

  /** Update a category. */
  async update(
    id: number,
    data: {
      name?: string;
      slug?: string;
      icon?: string;
      color?: string;
    },
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(`/categories/${id}`, buildInit("PUT", opts, data));
  }

  /** Delete a category. */
  async delete(id: number, opts?: FetchOptions): Promise<void> {
    return this.fetch(`/categories/${id}`, buildInit("DELETE", opts));
  }
}
