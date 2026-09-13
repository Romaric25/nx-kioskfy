import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NewspaperItem } from "@kioskfy/types";

/**
 * A single newspaper with its full relations, as returned by
 * `GET /newspapers/:id` (organization incl. description/metadata, country,
 * categories).
 */
export interface NewspaperDetail extends NewspaperItem {
  organization?: {
    id: string;
    name: string;
    slug?: string;
    logo?: string | null;
    description?: string;
    email?: string | null;
    metadata?: Record<string, unknown> | string | null;
  } | null;
}

/** Single newspaper by ID (public). */
export function useNewspaper(id: string) {
  const {
    data: newspaper,
    isLoading: newspaperLoading,
    error: newspaperError,
  } = useQuery({
    queryKey: ["newspaper", id],
    queryFn: () => api.newspapers.getById(id) as Promise<NewspaperDetail>,
    enabled: !!id,
    retry: 1,
  });

  return { newspaper, newspaperLoading, newspaperError };
}

/** Infinite-scroll newspapers of an organization (related editions). */
export function useInfiniteNewspapersByOrganization(
  organizationId: string,
  options: { excludeId?: string; limit?: number } = {},
) {
  const { excludeId, limit = 6 } = options;

  return useInfiniteQuery({
    queryKey: ["newspapers-organization-infinite", organizationId, excludeId],
    queryFn: async ({ pageParam = 0 }) => {
      const page = (await api.newspapers.getByOrganization(organizationId, {
        cursor: pageParam as number,
        limit,
        ...(excludeId ? { excludeId } : {}),
      })) as unknown as {
        data: NewspaperItem[];
        nextCursor: number | null;
      };
      return page;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled: !!organizationId,
  });
}

/** Infinite-scroll published newspapers of a country (public). */
export function useInfiniteNewspapersByCountrySlug(
  countrySlug: string,
  options: { limit?: number; search?: string } = {},
) {
  const { limit = 12, search } = options;

  return useInfiniteQuery({
    queryKey: ["newspapers-country-slug-infinite", countrySlug, search],
    queryFn: async ({ pageParam = 0 }) => {
      const page = await api.newspapers.getByCountry(countrySlug, {
        cursor: pageParam as number,
        limit,
        ...(search ? { search } : {}),
      });
      return page as {
        data: NewspaperItem[];
        country?: { id: number; name: string; slug: string; flag: string } | null;
        nextCursor: number | null;
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled: !!countrySlug,
  });
}
