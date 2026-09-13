import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "./client";

export interface SiteSetting {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  label: string;
  description?: string;
  type: "string" | "boolean" | "number" | "json";
  group: string;
  isPublic: boolean;
}

export interface MutationCallbacks {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useSettings = () => {
  const queryClient = useQueryClient();

  // Récupérer les paramètres
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await getApiClient().api.v1.settings.get();
      if (error || !data?.success)
        throw new Error("Impossible de charger les paramètres");
      return data.data as Record<string, SiteSetting>;
    },
  });

  // Mettre à jour les paramètres
  const { mutateAsync: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newSettings: Record<string, any>,
    ) => {
      const { data, error } = await getApiClient().api.v1.settings.put({
        settings: newSettings,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      if (error || !data?.success)
        throw new Error("Erreur lors de la sauvegarde");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  // Initialiser les paramètres par défaut
  const {
    mutateAsync: seedSettings,
    isPending: isSeeding,
  } = useMutation({
    mutationFn: async () => {
      const { data, error } = await getApiClient().api.v1.settings.seed.post();
      if (error || !data?.success) throw new Error("Erreur d'initialisation");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
    isUpdating,
    seedSettings,
    isSeeding,
  };
};
