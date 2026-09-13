/**
 * Shared API client for @kioskfy/hooks.
 *
 * Each app MUST call `initApiClient()` once before using any hook.
 *
 * @example
 * ```ts
 * import { initApiClient } from '@kioskfy/hooks/client';
 * import { treaty } from '@elysiajs/eden';
 * import type { App } from '@kioskfy/api';
 *
 * const client = treaty<App>('http://localhost:3000');
 * initApiClient(client);
 * ```
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;

/** Initialize the shared API client. Call once at app startup. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initApiClient(client: any): void {
  _client = client;
}

/** @internal Returns the configured API client. Throws if not initialized. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getApiClient(): any {
  if (!_client) {
    throw new Error(
      "[@kioskfy/hooks] API client not initialized. Call initApiClient() first.",
    );
  }
  return _client;
}
