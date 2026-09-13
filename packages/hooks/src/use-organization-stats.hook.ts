import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "./client";

export interface OrganizationStatsResponse {
  totalRevenue: number;
  totalSales: number;
  publishedCount: number;
  recentSales: any[];
}

export function useOrganizationStats(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["organizationStats", organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("Organization ID is required");

      const { data, error } = await getApiClient().api.v1.orders.organization({ organizationId }).stats.get();

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((error as any).value?.message || "Failed to fetch organization stats");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any).data as OrganizationStatsResponse;
    },
    enabled: !!organizationId,
  });
}
