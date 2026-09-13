import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const organizationKeys = {
  all: ["organizations"] as const,
  detail: (slug: string) => [...organizationKeys.all, "detail", slug] as const,
};

/** Single organization (press agency) by slug (public). */
export function useOrganizationBySlug(slug: string) {
  const {
    data: organization,
    isLoading: organizationLoading,
    error: organizationError,
  } = useQuery({
    queryKey: organizationKeys.detail(slug),
    queryFn: () => api.organizations.getBySlug(slug),
    enabled: !!slug,
    retry: 1,
  });

  return { organization, organizationLoading, organizationError };
}
