/**
 * Shared Auth client for @kioskfy/hooks.
 *
 * Each app MUST call `initAuthClient()` once before using auth-dependent hooks.
 *
 * @example
 * ```ts
 * import { initAuthClient } from '@kioskfy/hooks/auth-client';
 * import { createAuthClient } from 'better-auth/react';
 *
 * const authClient = createAuthClient({ ... });
 * initAuthClient(authClient);
 * ```
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _authClient: any = null;

/** Initialize the shared Auth client. Call once at app startup. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initAuthClient(client: any): void {
  _authClient = client;
}

/** @internal Returns the configured Auth client. Throws if not initialized. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuthClient(): any {
  if (!_authClient) {
    throw new Error(
      "[@kioskfy/hooks] Auth client not initialized. Call initAuthClient() first.",
    );
  }
  return _authClient;
}

/** @internal Helper: extract error message from a response error value */
export function extractErrorMessage(errorValue: unknown, fallback = "Une erreur est survenue"): string {
  if (!errorValue) return fallback;
  if (typeof errorValue === "string") return errorValue;
  const err = errorValue as Record<string, unknown>;
  return String(err.message || err.error || fallback);
}
