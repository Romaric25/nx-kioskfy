import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "./client";

export interface OrganizationCustomer {
  id: string | null;
  name: string | null;
  email: string;
  image: string | null;
  purchaseCount: number;
}

export interface OrganizationCustomersResponse {
  totalCustomers: number;
  customers: OrganizationCustomer[];
}

export function useOrganizationCustomers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["organizationCustomers", organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("Organization ID is required");

      const { data, error } = await getApiClient().api.v1.orders.organization({ organizationId }).customers.get();

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((error as any).value?.message || "Failed to fetch organization customers");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any).data as OrganizationCustomersResponse;
    },
    enabled: !!organizationId,
  });
}
