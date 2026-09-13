import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NewspaperItem } from "@kioskfy/types";

/** A favorite entry with its embedded newspaper. */
export interface FavoriteItem {
  id: number;
  newspaperId: string;
  createdAt: string;
  newspaper: NewspaperItem;
}

/** Current user's favorite newspapers (auth required). */
export function useFavorites() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["favorites", "list"],
    queryFn: () => api.favorites.getAll() as Promise<FavoriteItem[]>,
    retry: 1,
  });

  return {
    favorites: data ?? [],
    favoritesLoading: isLoading,
    favoritesError: error,
  };
}
