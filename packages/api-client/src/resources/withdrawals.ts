import type { WithdrawalItem, CreateWithdrawalInput } from "@kioskfy/types";
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

export class WithdrawalsResource {
  constructor(private fetch: Fetcher) {}

  /** Admin: Get all withdrawals (optionally filtered by organization). */
  async getAll(
    orgId?: string,
    limit?: number,
    offset?: number,
    opts?: FetchOptions,
  ): Promise<WithdrawalItem[]> {
    const qs = new URLSearchParams();
    if (orgId) qs.set("organizationId", orgId);
    if (limit !== undefined) qs.set("limit", String(limit));
    if (offset !== undefined) qs.set("offset", String(offset));
    const query = qs.toString();
    return this.fetch(
      `/withdrawals${query ? `?${query}` : ""}`,
      buildInit("GET", opts),
    );
  }

  /** Retraits d'une organisation (propriétaire uniquement côté API). */
  async getByOrganization(
    orgId: string,
    limit?: number,
    offset?: number,
    opts?: FetchOptions,
  ): Promise<WithdrawalItem[]> {
    const qs = new URLSearchParams();
    if (limit !== undefined) qs.set("limit", String(limit));
    if (offset !== undefined) qs.set("offset", String(offset));
    const query = qs.toString();
    return this.fetch(
      `/withdrawals/organization/${encodeURIComponent(orgId)}${query ? `?${query}` : ""}`,
      buildInit("GET", opts),
    );
  }

  /** Get a withdrawal by ID. */
  async getById(
    id: number,
    opts?: FetchOptions,
  ): Promise<WithdrawalItem> {
    return this.fetch(`/withdrawals/${id}`, buildInit("GET", opts));
  }

  /** Create a new withdrawal request. */
  async create(
    data: CreateWithdrawalInput,
    opts?: FetchOptions,
  ): Promise<WithdrawalItem> {
    return this.fetch("/withdrawals", buildInit("POST", opts, data));
  }

  /** Cancel a withdrawal request (owner de l'agence). */
  async cancel(
    id: number,
    reason?: string,
    opts?: FetchOptions,
  ): Promise<WithdrawalItem> {
    return this.fetch(
      `/withdrawals/${id}`,
      buildInit("DELETE", opts, reason ? { reason } : undefined),
    );
  }

  /**
   * Admin/superadmin : traite une demande (completed / failed / cancelled).
   */
  async traiter(
    id: number,
    data: {
      statut: "processing" | "completed" | "failed" | "cancelled";
      externalReference?: string;
      notes?: string;
      reason?: string;
    },
    opts?: FetchOptions,
  ): Promise<WithdrawalItem> {
    return this.fetch(
      `/withdrawals/${id}`,
      buildInit("PATCH", opts, data),
    );
  }
}
