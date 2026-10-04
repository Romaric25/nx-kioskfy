import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CountryItem } from "@kioskfy/types";

/** All countries (used for agency country selectors). */
export function useCountries() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["countries"],
    queryFn: () => api.countries.getAll() as Promise<CountryItem[]>,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return {
    countries: data ?? [],
    isLoadingCountries: isLoading,
    countriesError: error,
  };
}
