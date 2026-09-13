/**
 * Kioskfy API Client — typed client for the NestJS API.
 *
 * @example
 * ```ts
 * import { createApiClient } from '@kioskfy/api-client';
 *
 * const api = createApiClient({ baseUrl: 'http://localhost:3000/api' });
 *
 * // Set auth token when user logs in
 * api.setToken('your-session-token');
 *
 * // Use typed methods
 * const newspapers = await api.newspapers.getPublished();
 * const categories = await api.categories.getAll();
 * ```
 */

export { createApiClient } from './client';
export type { ApiClient, ApiClientConfig } from './client';
export { ApiError } from './errors';
export type { FetchOptions } from './types';
