import type {
  NewspaperItem,
  CreateNewspaperInput,
  UpdateNewspaperInput,
} from "@kioskfy/types";
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

export class NewspapersResource {
  constructor(private fetch: Fetcher) {}

  /** Get all published newspapers (public). */
  async getAllPublished(opts?: FetchOptions): Promise<NewspaperItem[]> {
    return this.fetch("/newspapers/all-published", buildInit("GET", opts));
  }

  /** Get published newspapers with cursor-based pagination. */
  async getPublishedPaginated(
    params: {
      limit?: number;
      cursor?: number;
      type?: string;
      search?: string;
    } = {},
    opts?: FetchOptions,
  ): Promise<{ data: NewspaperItem[]; nextCursor: number | null }> {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.cursor !== undefined) qs.set("cursor", String(params.cursor));
    if (params.type) qs.set("type", params.type);
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return this.fetch(
      `/newspapers/published-paginated${query ? `?${query}` : ""}`,
      buildInit("GET", opts),
    );
  }

  /** Get published newspapers filtered by country slug. */
  async getByCountry(
    slug: string,
    params: { limit?: number; cursor?: number; search?: string } = {},
    opts?: FetchOptions,
  ): Promise<{
    data: NewspaperItem[];
    country: unknown;
    nextCursor: number | null;
  }> {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.cursor !== undefined) qs.set("cursor", String(params.cursor));
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return this.fetch(
      `/newspapers/country/${slug}${query ? `?${query}` : ""}`,
      buildInit("GET", opts),
    );
  }

  /** Get published newspapers filtered by category slug. */
  async getByCategory(
    slug: string,
    params: { limit?: number; cursor?: number } = {},
    opts?: FetchOptions,
  ): Promise<{
    data: NewspaperItem[];
    nextCursor: number | null;
  }> {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.cursor !== undefined) qs.set("cursor", String(params.cursor));
    const query = qs.toString();
    return this.fetch(
      `/newspapers/category/${slug}${query ? `?${query}` : ""}`,
      buildInit("GET", opts),
    );
  }

  /** Get newspapers by organization (admin). */
  async getByOrganization(
    orgId: string,
    params: {
      limit?: number;
      cursor?: number;
      excludeId?: string;
      includeAllStatuses?: boolean;
    } = {},
    opts?: FetchOptions,
  ): Promise<unknown> {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.cursor !== undefined) qs.set("cursor", String(params.cursor));
    if (params.excludeId) qs.set("excludeId", params.excludeId);
    if (params.includeAllStatuses !== undefined)
      qs.set("includeAllStatuses", String(params.includeAllStatuses));
    const query = qs.toString();
    return this.fetch(
      `/newspapers/organization/${orgId}${query ? `?${query}` : ""}`,
      buildInit("GET", opts),
    );
  }

  /** Get a single newspaper by ID. */
  async getById(id: string, opts?: FetchOptions): Promise<NewspaperItem> {
    return this.fetch(`/newspapers/${id}`, buildInit("GET", opts));
  }

  /** Get all newspapers (admin). */
  async getAll(opts?: FetchOptions): Promise<NewspaperItem[]> {
    return this.fetch("/newspapers", buildInit("GET", opts));
  }

  /** Create a newspaper (admin). */
  async create(
    data: CreateNewspaperInput,
    opts?: FetchOptions,
  ): Promise<{ id: string }> {
    return this.fetch("/newspapers", buildInit("POST", opts, data));
  }

  /** Update a newspaper (admin). */
  async update(
    id: string,
    data: UpdateNewspaperInput,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(`/newspapers/${id}`, buildInit("PUT", opts, data));
  }

  /** Update newspaper status (admin). */
  async updateStatus(
    id: string,
    status: string,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(
      `/newspapers/${id}/status`,
      buildInit("PATCH", opts, { status }),
    );
  }

  /** Delete a newspaper (admin). */
  async delete(id: string, opts?: FetchOptions): Promise<void> {
    return this.fetch(`/newspapers/${id}`, buildInit("DELETE", opts));
  }
}
