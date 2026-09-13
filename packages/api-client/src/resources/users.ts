import type { UserProfile } from "@kioskfy/types";
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

export class UsersResource {
  constructor(private fetch: Fetcher) {}

  /** Create a partnership (public registration). */
  async createPartnership(
    data: unknown,
    opts?: FetchOptions,
  ): Promise<{ id: string; token?: string }> {
    return this.fetch(
      "/users/partnership",
      buildInit("POST", opts, data),
    );
  }

  /** Confirm a user's email address. */
  async confirmEmail(
    token: string,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(
      "/users/confirm-email",
      buildInit("POST", opts, { token }),
    );
  }

  /** Resend a confirmation or login token. */
  async resendToken(
    data: { email?: string; token?: string },
    opts?: FetchOptions,
  ): Promise<{ token: string }> {
    return this.fetch(
      "/users/resend-token",
      buildInit("POST", opts, data),
    );
  }

  /** Admin: Get all users. */
  async getAll(opts?: FetchOptions): Promise<UserProfile[]> {
    return this.fetch("/users", buildInit("GET", opts));
  }

  /** Get the currently authenticated user's profile. */
  async getMe(opts?: FetchOptions): Promise<UserProfile> {
    return this.fetch("/users/me", buildInit("GET", opts));
  }

  /** Get a user's profile by ID. */
  async getById(id: string, opts?: FetchOptions): Promise<UserProfile> {
    return this.fetch(`/users/${id}`, buildInit("GET", opts));
  }

  /** Update the current user's phone number. */
  async updatePhone(
    phone: string,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(
      "/users/phone",
      buildInit("PUT", opts, { phone }),
    );
  }

  /** Set the current user's password. */
  async setPassword(
    password: string,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(
      "/users/password",
      buildInit("POST", opts, { password }),
    );
  }
}
