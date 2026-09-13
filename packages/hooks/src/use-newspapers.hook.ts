import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "./client";

interface NewspaperResponse {
  id: string | number;
  issueNumber: string | number;
  coverImage: string | null;
  price: number;
  publishDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organization?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  country?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories?: any[];
}

export const usePublishedNewspapersAndMagazines = () => {
  const {
    data,
    isLoading: newspapersLoading,
    error: newspapersError,
  } = useQuery({
    queryKey: ["newspapers-published-and-magazines"],
    queryFn: () =>
      getApiClient().api.v1.newspapers["all-published"].get(),
  });

  const newspapersAndMagazines = data?.data;
  return { newspapersAndMagazines, newspapersLoading, newspapersError };
};

export const usePublishedNewspapers = () => {
  const {
    data,
    isLoading: newspapersLoading,
    error: newspapersError,
  } = useQuery({
    queryKey: ["newspapers-published"],
    queryFn: () =>
      getApiClient().api.v1.newspapers["all-published-newspapers"].get(),
  });

  const newspapers = data?.data;
  return { newspapers, newspapersLoading, newspapersError };
};

export const useNewspapersByCountry = (
  countrySlug: string,
  options: { limit?: number; search?: string } = {},
) => {
  const { limit = 12, search } = options;

  const {
    data,
    isLoading: newspapersLoading,
    error: newspapersError,
  } = useQuery({
    queryKey: ["newspapers-country", countrySlug, search],
    queryFn: async () => {
      const response = await getApiClient()
        .api.v1.newspapers.country({ slug: countrySlug })
        .get({
          query: {
            limit: limit.toString(),
            ...(search ? { search } : {}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        });
      return response.data;
    },
    enabled: !!countrySlug,
  });

  const newspapers = data?.data as NewspaperResponse[] | undefined;
  return { newspapers, newspapersLoading, newspapersError };
};

export const useNewspapersByCategory = (
  categorySlug: string,
  options: { limit?: number; search?: string } = {},
) => {
  const { limit = 12, search } = options;

  const {
    data,
    isLoading: newspapersLoading,
    error: newspapersError,
  } = useQuery({
    queryKey: ["newspapers-category", categorySlug, search],
    queryFn: async () => {
      const response = await getApiClient()
        .api.v1.newspapers.category({ slug: categorySlug })
        .get({
          query: {
            limit: limit.toString(),
            ...(search ? { search } : {}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        });
      return response.data;
    },
    enabled: !!categorySlug,
  });

  const newspapers = data?.data as NewspaperResponse[] | undefined;
  return { newspapers, newspapersLoading, newspapersError };
};

export const useNewspapersByOrganization = (
  organizationId: string,
  options: { includeAllStatuses?: boolean } = {},
) => {
  const { includeAllStatuses = false } = options;

  const {
    data,
    isLoading: newspapersLoading,
    error: newspapersError,
  } = useQuery({
    queryKey: [
      "newspapers-organization",
      organizationId,
      includeAllStatuses,
    ],
    queryFn: () =>
      getApiClient()
        .api.v1.newspapers.organization({ organizationId })
        .get({
          query: {
            includeAllStatuses: includeAllStatuses ? "true" : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        }),
    enabled: !!organizationId,
  });

  const newspapers = data?.data;
  return { newspapers, newspapersLoading, newspapersError };
};
