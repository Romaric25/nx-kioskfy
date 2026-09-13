import type {
  OrganizationItem,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "@kioskfy/types";
import type { OrganizationBalanceResponse } from "@kioskfy/types/accounting";
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

export class OrganizationsResource {
  constructor(private fetch: Fetcher) {}

  /** Get all organizations. */
  async getAll(opts?: FetchOptions): Promise<OrganizationItem[]> {
    return this.fetch("/organizations", buildInit("GET", opts));
  }

  /** Get an organization by its slug. */
  async getBySlug(
    slug: string,
    opts?: FetchOptions,
  ): Promise<OrganizationItem | null> {
    return this.fetch(`/organizations/slug/${slug}`, buildInit("GET", opts));
  }

  /** Get the current user's organizations (press agencies). */
  async getMy(opts?: FetchOptions): Promise<OrganizationItem[]> {
    return this.fetch("/organizations/me", buildInit("GET", opts));
  }

  /** Get balances for an organization. */
  async getBalances(
    orgId: string,
    opts?: FetchOptions,
  ): Promise<OrganizationBalanceResponse> {
    return this.fetch(
      `/organizations/${orgId}/balances`,
      buildInit("GET", opts),
    );
  }

  /** Sync balances for an organization. */
  async syncBalances(
    orgId: string,
    opts?: FetchOptions,
  ): Promise<OrganizationBalanceResponse> {
    return this.fetch(
      `/organizations/${orgId}/sync-balances`,
      buildInit("POST", opts),
    );
  }

  /** Create a new organization. */
  async create(
    data: CreateOrganizationInput,
    opts?: FetchOptions,
  ): Promise<{ id: string }> {
    return this.fetch("/organizations", buildInit("POST", opts, data));
  }

  /** Update an organization. */
  async update(
    id: string,
    data: UpdateOrganizationInput,
    opts?: FetchOptions,
  ): Promise<unknown> {
    return this.fetch(`/organizations/${id}`, buildInit("PUT", opts, data));
  }

  /** Delete an organization. */
  async delete(id: string, opts?: FetchOptions): Promise<void> {
    return this.fetch(`/organizations/${id}`, buildInit("DELETE", opts));
  }
}
