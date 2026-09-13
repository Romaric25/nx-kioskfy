import { useMutation, useQuery } from "@tanstack/react-query";
import { getApiClient } from "./client";
import { getAuthClient } from "./auth-client";

// ── Types ─────────────────────────────────────────────────────────────────

/** Profil utilisateur retourné par l'API (sans le mot de passe) */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  role?: string;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AssignRoleInput {
  userId: string;
  role: string;
}

/** Données d'une session utilisateur */
export interface UserSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Informations de géolocalisation pour une IP */
export interface GeoIPInfo {
  country: string | null;
  countryCode: string | null;
  continent: string | null;
  continentCode: string | null;
  flag: string;
}

// ── Callback options ──────────────────────────────────────────────────────

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

// ── useUser ───────────────────────────────────────────────────────────────

/** Récupère un utilisateur par son ID */
export const useUser = (userId: string) => {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data, error } = await getApiClient().api.v1
        .users({ id: userId })
        .get();
      if (error || !data?.success || !data?.data) {
        throw new Error("Utilisateur non trouvé");
      }
      return data.data as UserProfile;
    },
    enabled: !!userId,
  });
  return { user, isLoading, error, refetch };
};

// ── useAssignRole ─────────────────────────────────────────────────────────

/** Assigne un rôle à un utilisateur */
export const useAssignRole = (options?: MutationCallbacks) => {
  const {
    mutate: assignRole,
    mutateAsync: assignRoleAsync,
    isPending: isAssigningRole,
  } = useMutation({
    mutationFn: async ({ userId, role }: AssignRoleInput) => {
      const { error } = await getAuthClient().admin.setRole({
        userId,
        role: role as "admin",
      });
      if (error) {
        throw new Error(
          error.message ??
            "Une erreur est survenue lors de l'attribution du rôle",
        );
      }
    },
    onSuccess: options?.onSuccess,
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });
  return { assignRole, assignRoleAsync, isAssigningRole };
};

// ── useUserSessions ───────────────────────────────────────────────────────

/** Récupère les sessions d'un utilisateur */
export const useUserSessions = (userId: string) => {
  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useQuery<UserSession[]>({
    queryKey: ["user-sessions", userId],
    queryFn: async () => {
      const { data, error } = await getAuthClient().admin.listUserSessions({
        userId,
      });
      if (error) {
        throw new Error(
          error.message ?? "Impossible de récupérer les sessions",
        );
      }
      return (data?.sessions || []) as UserSession[];
    },
    enabled: !!userId,
  });
  return { sessions, isLoading, error, refetch };
};

// ── useRevokeUserSession ──────────────────────────────────────────────────

/** Révoque une session utilisateur */
export const useRevokeUserSession = (options?: MutationCallbacks) => {
  const {
    mutate: revokeSession,
    mutateAsync: revokeSessionAsync,
    isPending: isRevokingSession,
  } = useMutation({
    mutationFn: async (sessionToken: string) => {
      const { error } = await getAuthClient().admin.revokeUserSession({
        sessionToken,
      });
      if (error) {
        throw new Error(error.message ?? "Impossible de révoquer la session");
      }
    },
    onSuccess: options?.onSuccess,
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });
  return { revokeSession, revokeSessionAsync, isRevokingSession };
};

// ── useConfirmEmail ───────────────────────────────────────────────────────

/** Vérifie l'email d'un utilisateur via un token */
export const useConfirmEmail = (options?: MutationCallbacks) => {
  const {
    mutateAsync: confirmEmail,
    isPending: isConfirmingEmail,
    isSuccess: isConfirmingEmailSuccess,
  } = useMutation({
    mutationFn: async (token: string) =>
      await getApiClient().api.v1.users["confirm-email"].post({ token }),
    onSuccess: options?.onSuccess,
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });
  return { confirmEmail, isConfirmingEmail, isConfirmingEmailSuccess };
};

// ── useResendToken ────────────────────────────────────────────────────────

/** Renvoie un token de vérification */
export const useResendToken = (options?: MutationCallbacks) => {
  const {
    mutateAsync: resendToken,
    isPending: isResendingToken,
    isSuccess: isResendingTokenSuccess,
  } = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (input: { token: string }) =>
      await getApiClient().api.v1.users["resend-token"].post(input as any),
    onSuccess: options?.onSuccess,
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });
  return { resendToken, isResendingToken, isResendingTokenSuccess };
};

// ── useGeoIP ──────────────────────────────────────────────────────────────

/** Récupère les informations de géolocalisation pour plusieurs IPs */
export const useGeoIP = (ips: string[]) => {
  const {
    data: geoData,
    isLoading,
    error,
  } = useQuery<Record<string, GeoIPInfo | null>>({
    queryKey: ["geoip", ips.sort().join(",")],
    queryFn: async () => {
      if (ips.length === 0) return {};

      const { data, error } = await getApiClient().api.v1.geoip.batch.post({
        ips,
      });
      if (error || !data?.success) {
        throw new Error(
          "Impossible de récupérer les informations de géolocalisation",
        );
      }
      return data.data as Record<string, GeoIPInfo | null>;
    },
    enabled: ips.length > 0,
    staleTime: 1000 * 60 * 60, // 1 heure cache
  });
  return { geoData, isLoading, error };
};
