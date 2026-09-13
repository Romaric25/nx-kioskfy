import type {
  OrderItem,
  AdminOrderResponse,
  CreateOrderInput,
  BatchOrderInput,
  OrganizationStatsResponse,
  OrganizationCustomersResponse,
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

export class OrdersResource {
  constructor(private fetch: Fetcher) {}

  /** Get all orders (admin). */
  async getAll(
    limit?: number,
    offset?: number,
    status?: string,
    opts?: FetchOptions,
  ): Promise<AdminOrderResponse[]> {
    const qs = new URLSearchParams();
    if (limit !== undefined) qs.set("limit", String(limit));
    if (offset !== undefined) qs.set("offset", String(offset));
    if (status) qs.set("status", status);
    const query = qs.toString();
    return this.fetch(
      `/orders${query ? `?${query}` : ""}`,
      buildInit("GET", opts),
    );
  }

  /** Get current user's orders. */
  async getMy(opts?: FetchOptions): Promise<OrderItem[]> {
    return this.fetch("/orders/my", buildInit("GET", opts));
  }

  /** Check if the current user has purchased a newspaper. */
  async check(
    newspaperId: string,
    opts?: FetchOptions,
  ): Promise<{ hasPurchased: boolean }> {
    return this.fetch(
      `/orders/check/${newspaperId}`,
      buildInit("GET", opts),
    );
  }

  /** Get organization stats (admin). */
  async getOrganizationStats(
    orgId: string,
    opts?: FetchOptions,
  ): Promise<OrganizationStatsResponse> {
    return this.fetch(
      `/orders/organization/${orgId}/stats`,
      buildInit("GET", opts),
    );
  }

  /** Get organization customers (admin). */
  async getOrganizationCustomers(
    orgId: string,
    opts?: FetchOptions,
  ): Promise<OrganizationCustomersResponse> {
    return this.fetch(
      `/orders/organization/${orgId}/customers`,
      buildInit("GET", opts),
    );
  }

  /** Create an order. */
  async create(
    data: CreateOrderInput,
    opts?: FetchOptions,
  ): Promise<OrderItem> {
    return this.fetch("/orders", buildInit("POST", opts, data));
  }

  /** Create multiple orders in batch. */
  async createBatch(
    data: BatchOrderInput,
    opts?: FetchOptions,
  ): Promise<OrderItem[]> {
    return this.fetch("/orders/batch", buildInit("POST", opts, data));
  }

  /** Update payment ID on orders. */
  async updatePaymentId(
    orderIds: string[],
    paymentId: string,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(
      "/orders/payment-id",
      buildInit("PUT", opts, { orderIds, paymentId }),
    );
  }
}
