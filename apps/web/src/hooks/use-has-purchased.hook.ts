import { useQuery } from "@tanstack/react-query";
import { useSession } from "@kioskfy/auth-client";
import { api } from "@/lib/api";

export const purchaseKeys = {
  all: ["purchases"] as const,
  check: (newspaperId: string) =>
    [...purchaseKeys.all, "check", newspaperId] as const,
};

/**
 * Check whether the current user has purchased a given newspaper.
 * Disabled while unauthenticated (the API endpoint requires a session).
 */
export function useHasPurchased(newspaperId: string) {
  const { isAuthenticated } = useSession();

  const { data, isLoading, error } = useQuery({
    queryKey: purchaseKeys.check(newspaperId),
    queryFn: () => api.orders.check(newspaperId),
    enabled: isAuthenticated && !!newspaperId,
    retry: false,
  });

  return {
    hasPurchased: data?.hasPurchased ?? false,
    isCheckingPurchase: isLoading,
    purchaseError: error,
  };
}
