import type {
  InitializePaymentInput,
  MonerooPaymentResponse,
  MonerooPaymentVerifyResponse,
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

export class PaymentsResource {
  constructor(private fetch: Fetcher) {}

  /** Initialize a payment. */
  async initialize(
    data: InitializePaymentInput,
    opts?: FetchOptions,
  ): Promise<MonerooPaymentResponse> {
    return this.fetch("/payments/initialize", buildInit("POST", opts, data));
  }

  /** Verify a payment. */
  async verify(
    paymentId: string,
    opts?: FetchOptions,
  ): Promise<MonerooPaymentVerifyResponse> {
    return this.fetch(
      `/payments/verify/${paymentId}`,
      buildInit("GET", opts),
    );
  }

  /** Handle payment success callback. */
  async success(
    data: unknown,
    opts?: FetchOptions,
  ): Promise<unknown> {
    return this.fetch("/payments/success", buildInit("POST", opts, data));
  }

  /**
   * Confirm a PI-SPI payment server-side. The API checks the RTP request
   * status with the SaaS API and marks the related orders as paid.
   */
  async confirmPispi(
    data: { txId: string },
    opts?: FetchOptions,
  ): Promise<{ success: boolean; statut?: string; orderIds?: string[] }> {
    return this.fetch(
      "/payments/pispi/confirm",
      buildInit("POST", opts, data),
    );
  }
}
