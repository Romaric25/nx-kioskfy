import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "./client";

export const favoriteCountryKeys = {
  all: ["favoriteCountries"] as const,
  list: () => [...favoriteCountryKeys.all, "list"] as const,
  allWithStatus: () => [...favoriteCountryKeys.all, "allWithStatus"] as const,
  newspapers: () => [...favoriteCountryKeys.all, "newspapers"] as const,
};

export interface Country {
  id: number;
  name: string;
  slug: string;
  flag: string;
  currency: string;
  code: string;
  host?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CountryWithFavoriteStatus extends Country {
  isFavorite: boolean;
}

export const useFavoriteCountries = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: favoriteCountryKeys.list(),
    queryFn: async () => {
      const response =
        await getApiClient().api.v1["favorite-countries"].get();
      return response.data;
    },
  });

  return {
    favoriteCountries: (data?.data ?? []) as Country[],
    favoriteCountriesLoading: isLoading,
    favoriteCountriesError: error,
  };
};

export const useAllCountriesWithFavoriteStatus = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: favoriteCountryKeys.allWithStatus(),
    queryFn: async () => {
      const response =
        await getApiClient().api.v1["favorite-countries"].all.get();
      return response.data;
    },
  });

  return {
    countries: (data?.data ?? []) as CountryWithFavoriteStatus[],
    countriesLoading: isLoading,
    countriesError: error,
  };
};

export const useNewspapersFromFavoriteCountries = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: favoriteCountryKeys.newspapers(),
    queryFn: async () => {
      const response =
        await getApiClient().api.v1["favorite-countries"].newspapers.get();
      return response.data;
    },
  });

  return {
    newspapers: data?.data ?? [],
    newspapersLoading: isLoading,
    newspapersError: error,
  };
};

export const useToggleFavoriteCountry = (
  options?: {
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (countryId: number) => {
      const response = await getApiClient()
        .api.v1["favorite-countries"]({
          countryId: countryId.toString(),
        })
        .toggle.post();
      return response.data;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.allWithStatus(),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.newspapers(),
      });

      if (data) {
        const favData = data as { isFavorite?: boolean };
        if (favData.isFavorite) {
          options?.onSuccess?.("Pays ajouté aux favoris");
        } else {
          options?.onSuccess?.("Pays retiré des favoris");
        }
      }
    },
    onError: () => {
      options?.onError?.("Erreur lors de la modification");
    },
  });
};

export const useAddFavoriteCountry = (
  options?: {
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (countryId: number) => {
      const response = await getApiClient()
        .api.v1["favorite-countries"]({
          countryId: countryId.toString(),
        })
        .post();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.allWithStatus(),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.newspapers(),
      });
      options?.onSuccess?.("Pays ajouté aux favoris");
    },
    onError: () => {
      options?.onError?.("Erreur lors de l'ajout");
    },
  });
};

export const useRemoveFavoriteCountry = (
  options?: {
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (countryId: number) => {
      const response = await getApiClient()
        .api.v1["favorite-countries"]({
          countryId: countryId.toString(),
        })
        .delete();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.allWithStatus(),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteCountryKeys.newspapers(),
      });
      options?.onSuccess?.("Pays retiré des favoris");
    },
    onError: () => {
      options?.onError?.("Erreur lors de la suppression");
    },
  });
};
