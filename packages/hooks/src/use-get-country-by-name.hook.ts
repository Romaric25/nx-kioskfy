import { useCountries } from "./use-countries.hook";

export const useGetCountryByName = (name: string) => {
  const { countries, countriesLoading } = useCountries();

  const countriesList = Array.isArray(countries)
    ? countries
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((countries as any)?.data ?? []);

  const country = Array.isArray(countriesList)
    ? countriesList.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.name === name,
      )
    : undefined;

  return { country, isLoading: countriesLoading };
};
