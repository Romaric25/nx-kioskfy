import { getApiClient } from "./client";
import { useQuery } from "@tanstack/react-query";

export const useCountries = () => {
  const {
    data,
    isLoading: countriesLoading,
    error: countriesError,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: () => getApiClient().api.v1.countries.get(),
  });

  const countries = data?.data;
  return { countries, countriesLoading, countriesError };
};

export const useCountryBySlug = (slug: string) => {
  const {
    data,
    isLoading: countryLoading,
    error: countryError,
  } = useQuery({
    queryKey: ["country", slug],
    queryFn: () =>
      getApiClient().api.v1.countries.slug({ slug }).get(),
    enabled: !!slug,
  });

  const country =
    data?.data && "data" in data.data ? data.data.data : undefined;
  return { country, countryLoading, countryError };
};
