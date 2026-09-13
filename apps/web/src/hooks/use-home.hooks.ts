import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CategoryItem,
  CountryItem,
  NewspaperItem,
  OrganizationItem,
} from "@kioskfy/types";

function isMagazine(newspaper: NewspaperItem): boolean {
  const metadata = (newspaper.organization as unknown as { metadata?: unknown } | null)?.metadata;
  if (!metadata) return false;
  try {
    const meta = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    return (meta as { type?: string })?.type === "Magazine";
  } catch {
    return false;
  }
}

/** All published newspapers & magazines (public) — used by the hero. */
export function usePublishedNewspapersAndMagazines() {
  const { data, isLoading: newspapersLoading, error: newspapersError } = useQuery({
    queryKey: ["home", "published"],
    queryFn: () => api.newspapers.getAllPublished(),
  });
  return { newspapersAndMagazines: data, newspapersLoading, newspapersError };
}

/** Published newspapers only (public) — used by the "À la une" section. */
export function usePublishedNewspapers() {
  const { data, isLoading: newspapersLoading, error: newspapersError } = useQuery({
    queryKey: ["home", "published"],
    queryFn: () => api.newspapers.getAllPublished(),
  });
  const newspapers = Array.isArray(data)
    ? data.filter((item) => !isMagazine(item))
    : [];
  return { newspapers, newspapersLoading, newspapersError };
}

/**
 * Infinite-scroll published newspapers/magazines (public).
 * The Journal/Magazine split is derived from the organization's metadata
 * (the newspapers table has no dedicated type column).
 */
export function useInfinitePublishedNewspapers(
  options: {
    type?: "Journal" | "Magazine";
    limit?: number;
    search?: string;
  } = {},
) {
  const { type, limit = 12, search } = options;

  return useInfiniteQuery({
    queryKey: ["newspapers-published-infinite", type, search],
    queryFn: async ({ pageParam = 0 }) => {
      const page = await api.newspapers.getPublishedPaginated({
        limit,
        cursor: pageParam as number,
        search,
      });
      const rows = Array.isArray(page)
        ? page
        : ((page as { data?: NewspaperItem[] }).data ?? []);
      const data = type
        ? rows.filter((item) =>
            type === "Magazine" ? isMagazine(item) : !isMagazine(item),
          )
        : rows;
      const nextCursor = Array.isArray(page)
        ? null
        : ((page as { nextCursor?: number | null }).nextCursor ?? null);
      return { data, nextCursor };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** Published magazines only (public) — used by the "Magazines" section. */
export function usePublishedMagazines() {
  const { data, isLoading: magazinesLoading, error: magazinesError } = useQuery({
    queryKey: ["home", "published"],
    queryFn: () => api.newspapers.getAllPublished(),
  });
  const magazines = Array.isArray(data) ? data.filter(isMagazine) : [];
  return { magazines, magazinesLoading, magazinesError };
}

/** All countries (public). */
export function useCountries() {
  const { data, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ["home", "countries"],
    queryFn: () => api.countries.getAll(),
  });
  return {
    countries: (data ?? []) as CountryItem[],
    countriesLoading,
    countriesError,
  };
}

/** All categories (public). */
export function useCategories() {
  const { data, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["home", "categories"],
    queryFn: () => api.categories.getAll(),
  });
  return {
    categories: (data ?? []) as CategoryItem[],
    categoriesLoading,
    categoriesError,
  };
}

/** Public agencies (organizations with active metadata). */
export function useAllAgencies() {
  const { data, isLoading: isLoadingAgencies, error: errorAgencies } = useQuery({
    queryKey: ["home", "agencies"],
    queryFn: () => api.organizations.getAll(),
    staleTime: 10 * 60 * 1000,
  });

  const agencies = (data ?? []).filter((org) => {
    if (!org.metadata) return false;
    try {
      const meta =
        typeof org.metadata === "string" ? JSON.parse(org.metadata) : org.metadata;
      return (meta as { isActive?: boolean })?.isActive === true;
    } catch {
      return false;
    }
  }) as OrganizationItem[];

  return { agencies, isLoadingAgencies, errorAgencies };
}
