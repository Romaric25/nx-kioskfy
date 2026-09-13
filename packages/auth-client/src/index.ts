/**
 * @kioskfy/auth-client — Lightweight auth client for Better Auth API.
 *
 * Uses plain fetch + Zustand store. No dependency on better-auth/react.
 *
 * @example
 * ```ts
 * import { initAuth, useSession, useSignIn, isAdminRole } from '@kioskfy/auth-client';
 *
 * initAuth({ baseURL: 'http://localhost:3000', basePath: '/api/auth' });
 *
 * function Login() {
 *   const { signIn, isLoading, error } = useSignIn();
 *   return <form onSubmit={...}>...</form>;
 * }
 * ```
 */

import { create } from "zustand";

// ── Roles ─────────────────────────────────────────────────────────────────

/** System-wide roles allowed to access the admin panel. */
export const ADMIN_ROLES = ["admin", "superadmin"] as const;

/** True if the user has an admin system role. */
export function isAdminRole(
  user: Pick<SessionUser, "role"> | null | undefined,
): boolean {
  if (!user || !user.role) return false;
  return (ADMIN_ROLES as readonly string[]).includes(user.role);
}

// ── Store ─────────────────────────────────────────────────────────────────

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: SessionUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ user: null, token: null, isLoading: false, error: null }),
}));

// ── Config ────────────────────────────────────────────────────────────────

let _baseURL = "";
let _basePath = "/api/auth";

export interface AuthConfig {
  baseURL: string;
  basePath?: string;
}

export function initAuth(config: AuthConfig): void {
  _baseURL = config.baseURL;
  _basePath = config.basePath ?? "/api/auth";
  // Fetch session on init
  getSessionUser();
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role?: string | null;
  typeUser?: string | null;
}

/** True if the user is a press agency (typeUser === "agency"). */
export function isAgencyUser(
  user: Pick<SessionUser, "typeUser"> | null | undefined,
): boolean {
  return !!user && user.typeUser === "agency";
}

/**
 * List the current user's organizations (Better Auth
 * `GET /organization/list`). Returns the organizations the user belongs to
 * (press agencies).
 */
export async function listMyOrganizations(): Promise<
  { id: string; name: string; slug: string; logo: string | null }[]
> {
  const data = await authFetch("/organization/list");
  const orgs = data?.organizations ?? data?.data?.organizations ?? [];
  return Array.isArray(orgs) ? orgs : [];
}

// ── Internal fetch helpers ────────────────────────────────────────────────

async function authFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${_baseURL}${_basePath}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `HTTP ${res.status}`);
  }
  return res.json();
}

let _sessionPromise: Promise<SessionUser | null> | null = null;

function invalidateSession(): void {
  _sessionPromise = null;
}

async function fetchSession(): Promise<SessionUser | null> {
  try {
    const data = await authFetch("/get-session");
    const user = data?.user ?? data?.data?.user ?? null;
    const token = data?.session?.token ?? data?.data?.session?.token ?? null;
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setToken(token);
    return user;
  } catch {
    useAuthStore.getState().reset();
    return null;
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}

/**
 * Fetch the current session (cached). Safe to call from route loaders,
 * guards and effects — the result is shared and the store is kept in sync.
 */
export function getSessionUser(): Promise<SessionUser | null> {
  if (!_sessionPromise) {
    _sessionPromise = fetchSession();
  }
  return _sessionPromise;
}

/** Force a session refetch on the next call to getSessionUser(). */
export function refreshSession(): Promise<SessionUser | null> {
  invalidateSession();
  return getSessionUser();
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ?? null;
}

// ── Public hooks ──────────────────────────────────────────────────────────

export function useSession() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);

  const isAuthenticated = !!user || !!getCookie("kioskfy.session_token");

  return {
    user,
    session: token ? { token, expiresAt: null } : null,
    isAuthenticated,
    isLoading,
    refetch: refreshSession,
  };
}

export function useSignIn() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const setError = useAuthStore((s) => s.setError);

  const signIn = async (input: { email: string; password: string }) => {
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setError(null);
    try {
      const data = await authFetch("/sign-in/email", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const user = data?.user ?? data?.data?.user ?? null;
      const token = data?.session?.token ?? data?.data?.session?.token ?? null;
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setToken(token);
      // Cache the freshly signed-in session
      _sessionPromise = Promise.resolve(user);
      return user as SessionUser | null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      setError(msg);
      throw err;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  return { signIn, isLoading, error };
}

/**
 * Create a new account via Better Auth.
 *
 * Note: the API has `autoSignIn: false`, so this does NOT open a session —
 * call `signIn` right after a successful sign-up to log the user in.
 */
export function useSignUp() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const setError = useAuthStore((s) => s.setError);

  const signUp = async (input: {
    email: string;
    password: string;
    name: string;
    lastName?: string;
    phone?: string;
  }) => {
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setError(null);
    try {
      await authFetch("/sign-up/email", {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setError(msg);
      throw err;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  return { signUp, isLoading, error };
}

export function useSignOut() {
  const signOut = async () => {
    try {
      await authFetch("/sign-out", { method: "POST" });
    } catch {
      // Ignore errors on sign-out
    }
    invalidateSession();
    useAuthStore.getState().reset();
  };

  return { signOut, isLoading: false };
}

// ── Password reset ─────────────────────────────────────────────────────────

/**
 * Send a password-reset email (Better Auth `POST /request-password-reset`).
 * Always resolves for unknown emails — the API returns success either way to
 * avoid leaking which addresses are registered.
 */
export async function requestPasswordReset(input: {
  email: string;
  redirectTo: string;
}): Promise<void> {
  await authFetch("/request-password-reset", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Reset the password with the emailed token
 * (Better Auth `POST /reset-password`). Throws on invalid/expired tokens.
 */
export async function resetPassword(input: {
  newPassword: string;
  token: string;
}): Promise<void> {
  await authFetch("/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ── Profile & account ──────────────────────────────────────────────────────

/**
 * Update the current user's profile (Better Auth `POST /update-user`).
 * Supports the standard fields (name, image) and the additional fields
 * declared on the auth schema (phone, lastName, address).
 */
export async function updateUser(input: {
  name?: string;
  lastName?: string;
  image?: string;
  phone?: string;
  address?: string;
}): Promise<void> {
  await authFetch("/update-user", {
    method: "POST",
    body: JSON.stringify(input),
  });
  // Session may have changed — refetch it.
  invalidateSession();
}

/**
 * Change the current user's password
 * (Better Auth `POST /change-password`). Throws when the current password
 * is wrong.
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}): Promise<void> {
  await authFetch("/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
