import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CountryItem, CountryWithFavoriteStatus, NewspaperItem } from "@kioskfy/types";

/** Current user's favorite countries (auth required). */
export function useFavoriteCountries() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["favorite-countries", "list"],
    queryFn: () => api.favoriteCountries.getMy() as Promise<CountryItem[]>,
    retry: 1,
  });

  return {
    favoriteCountries: data ?? [],
    favoriteCountriesLoading: isLoading,
    favoriteCountriesError: error,
  };
}

/** Newspapers from the current user's favorite countries (auth required). */
export function useNewspapersFromFavoriteCountries() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["favorite-countries", "newspapers"],
    queryFn: () =>
      api.favoriteCountries.getNewspapers() as Promise<NewspaperItem[]>,
    retry: 1,
  });

  return {
    newspapers: data ?? [],
    newspapersLoading: isLoading,
    newspapersError: error,
  };
}

/** Toggle a country as favorite (auth required). */
export function useToggleFavoriteCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (countryId: number) =>
      api.favoriteCountries.toggle(String(countryId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-countries"] });
    },
  });
}

/** All countries with the current user's favorite status (auth required). */
export function useAllCountriesWithStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorite-countries", "all-status"],
    queryFn: () =>
      api.favoriteCountries.getAllWithStatus() as Promise<
        CountryWithFavoriteStatus[]
      >,
    retry: 1,
  });

  return { countries: data ?? [], isLoading };
}
