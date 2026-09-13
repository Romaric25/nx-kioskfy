import { useState } from "react";
import { getAuthClient, extractErrorMessage } from "./auth-client";
import { useOrganizationStore } from "@kioskfy/stores";

// ── Query keys ────────────────────────────────────────────────────────────

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  verify: () => [...authKeys.all, "verify"] as const,
  user: (userId: string) => [...authKeys.all, "user", userId] as const,
  users: () => [...authKeys.all, "users"] as const,
  userByEmail: (email: string) =>
    [...authKeys.all, "userByEmail", email] as const,
};

// ── useAuth ───────────────────────────────────────────────────────────────

export const useAuth = () => {
  const authClient = getAuthClient();
  const { data, isPending, isRefetching, refetch } = authClient.useSession();
  const { clearSelectedOrganization } = useOrganizationStore();

  let isExpired = false;
  const session = data?.session;
  const user = data?.user;
  const token = session?.token;
  const expiresAt = session?.expiresAt;

  if (expiresAt) {
    isExpired = expiresAt < new Date();
  }

  const isAuthenticated = !!token && !isExpired;
  const isLoading = isPending || isRefetching;

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          clearSelectedOrganization();
        },
      },
    });
  };

  return {
    user,
    token,
    expiresAt,
    isAuthenticated,
    isLoading,
    logout,
    refetch,
  };
};

// ── useSocialAuth ─────────────────────────────────────────────────────────

interface UseSocialAuthOptions {
  redirectUrl?: string;
  onError?: (error: string) => void;
}

export const useSocialAuth = (options: UseSocialAuthOptions = {}) => {
  const authClient = getAuthClient();
  const { redirectUrl = "/", onError } = options;

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [socialAuthError, setSocialAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSocialAuthError(null);
    setIsGoogleLoading(true);
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: redirectUrl,
      },
      {
        onError: (ctx: { error: unknown }) => {
          const error = extractErrorMessage(
            ctx.error,
            "Une erreur est survenue lors de la connexion.",
          );
          setSocialAuthError(error);
          onError?.(error);
          setIsGoogleLoading(false);
        },
        onSuccess: () => {
          setIsGoogleLoading(false);
        },
      },
    );
  };

  const handleFacebookSignIn = async () => {
    setSocialAuthError(null);
    setIsFacebookLoading(true);
    await authClient.signIn.social(
      {
        provider: "facebook",
        callbackURL: redirectUrl,
      },
      {
        onError: (ctx: { error: unknown }) => {
          const error = extractErrorMessage(
            ctx.error,
            "Une erreur est survenue lors de la connexion.",
          );
          setSocialAuthError(error);
          onError?.(error);
          setIsFacebookLoading(false);
        },
        onSuccess: () => {
          setIsFacebookLoading(false);
        },
      },
    );
  };

  return {
    handleGoogleSignIn,
    handleFacebookSignIn,
    isGoogleLoading,
    isFacebookLoading,
    socialAuthError,
    setSocialAuthError,
  };
};
