import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const favoriteKeys = {
  all: ["favorites"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
  check: (newspaperId: string) =>
    [...favoriteKeys.all, "check", newspaperId] as const,
};

/** Check if a newspaper is in the current user's favorites. */
export function useCheckFavorite(newspaperId: string, enabled = true) {
  const { data, isLoading, error } = useQuery({
    queryKey: favoriteKeys.check(newspaperId),
    queryFn: () => api.favorites.check(newspaperId),
    enabled: enabled && !!newspaperId,
    retry: false,
  });

  return {
    isFavorite: data?.isFavorite ?? false,
    isCheckingFavorite: isLoading,
    checkError: error,
  };
}

/** Toggle a newspaper's favorite status (auth required). */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newspaperId: string) => api.favorites.toggle(newspaperId),
    onSuccess: (data, newspaperId) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      // Update the check cache immediately
      queryClient.setQueryData(favoriteKeys.check(newspaperId), data);
    },
  });
}
