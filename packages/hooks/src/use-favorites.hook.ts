import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "./client";

export const favoriteKeys = {
  all: ["favorites"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
  check: (newspaperId: string) =>
    [...favoriteKeys.all, "check", newspaperId] as const,
};

export interface FavoriteItem {
  id: number;
  newspaperId: string;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newspaper: any;
}

export const useFavorites = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: async () => {
      const response = await getApiClient().api.v1.favorites.get();
      return response.data;
    },
  });

  return {
    favorites: (data?.data as FavoriteItem[]) ?? [],
    favoritesLoading: isLoading,
    favoritesError: error,
  };
};

export const useCheckFavorite = (
  newspaperId: string,
  enabled = true,
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: favoriteKeys.check(newspaperId),
    queryFn: async () => {
      const response = await getApiClient()
        .api.v1.favorites.check({ newspaperId })
        .get();
      return response.data;
    },
    enabled: enabled && !!newspaperId,
    retry: false,
  });

  return {
    isFavorite: (data as { isFavorite?: boolean } | undefined)?.isFavorite ?? false,
    isCheckingFavorite: isLoading,
    checkError: error,
  };
};

export const useToggleFavorite = (
  options?: {
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newspaperId: string) => {
      const response = await getApiClient()
        .api.v1.favorites({ newspaperId })
        .toggle.post();
      return response.data;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (data: any, newspaperId: string) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.check(newspaperId),
      });

      if (data) {
        const favoriteData = data as { isFavorite?: boolean };
        queryClient.setQueryData(favoriteKeys.check(newspaperId), {
          success: true,
          isFavorite: favoriteData.isFavorite,
        });

        if (favoriteData.isFavorite) {
          options?.onSuccess?.("Ajouté aux favoris");
        } else {
          options?.onSuccess?.("Retiré des favoris");
        }
      }
    },
    onError: () => {
      options?.onError?.("Erreur lors de la modification des favoris");
    },
  });
};
