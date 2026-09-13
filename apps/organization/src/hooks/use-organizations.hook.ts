import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OrganizationItem } from "@kioskfy/types";
import { useSelectedOrganization } from "@/lib/selected-organization-store";

/** The current user's organizations (press agencies). */
export function useOrganizations() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["organizations", "mine"],
    queryFn: () => api.organizations.getMy() as Promise<OrganizationItem[]>,
    retry: 1,
  });

  return {
    organizations: data ?? [],
    isLoadingOrganizations: isLoading,
    organizationsError: error,
    refetch,
  };
}

/** The organization the user selected in the dashboard. */
export function useActiveOrganization() {
  const { organizationId } = useSelectedOrganization();
  const { organizations, isLoadingOrganizations } = useOrganizations();

  const active = organizations.find((org) => org.id === organizationId);

  return {
    organization: active ?? null,
    isLoading: isLoadingOrganizations,
  };
}
