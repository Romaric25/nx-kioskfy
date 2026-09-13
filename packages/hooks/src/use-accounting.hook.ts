import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "./client";

export interface OrganizationBalanceResponse {
  id: number;
  organizationId: string;
  organizationAmount: number;
  platformAmount: number;
  totalSales: number;
  totalWithdrawals: number;
  withdrawnAmount: number;
  currency: string;
}

/**
 * Hook pour récupérer les soldes d'une organisation
 */
export function useOrganizationBalances(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["organizationBalances", organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("Organization ID is required");

      const { data, error } = await getApiClient().api.v1.accounting.organization({ organizationId }).balances.get();

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((error as any).value?.message || "Failed to fetch balances");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any).data as OrganizationBalanceResponse;
    },
    enabled: !!organizationId,
  });
}

/**
 * Hook pour synchroniser les soldes depuis les revenue shares
 */
export function useSyncBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { data, error } = await getApiClient().api.v1.accounting.organization({ organizationId }).sync.post();

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((error as any).value?.message || "Failed to sync balances");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any).data as OrganizationBalanceResponse;
    },
    onSuccess: (_data, organizationId) => {
      // Invalidate the balances query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["organizationBalances", organizationId] });
    },
  });
}
