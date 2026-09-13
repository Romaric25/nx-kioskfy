import type {
  InitializePayoutInput,
  PaymentResponse,
  VerifyTransactionResponse,
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

export class PayoutsResource {
  constructor(private fetch: Fetcher) {}

  /** Initialize a payout. */
  async initialize(
    data: InitializePayoutInput,
    opts?: FetchOptions,
  ): Promise<PaymentResponse> {
    return this.fetch("/payouts/initialize", buildInit("POST", opts, data));
  }

  /** Verify a payout transaction. */
  async verify(
    payoutId: string,
    opts?: FetchOptions,
  ): Promise<VerifyTransactionResponse> {
    return this.fetch(
      `/payouts/verify/${payoutId}`,
      buildInit("GET", opts),
    );
  }
}
