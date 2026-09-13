import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CountryItem } from "@kioskfy/types";

/** A single country by slug (public). */
export function useCountryBySlug(slug: string) {
  const {
    data: country,
    isLoading: countryLoading,
    error: countryError,
  } = useQuery({
    queryKey: ["country", slug],
    queryFn: () => api.countries.getBySlug(slug) as Promise<CountryItem | null>,
    enabled: !!slug,
    retry: 1,
  });

  return { country, countryLoading, countryError };
}
