/** Options for individual fetch calls */
export interface FetchOptions {
  /** Additional headers */
  headers?: Record<string, string>;
  /** Abort signal */
  signal?: AbortSignal;
  /** Override base URL for this call */
  baseUrl?: string;
}
