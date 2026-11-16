import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AdminStatsResponse } from "@kioskfy/types";

interface UseAdminStatsResult {
  stats: AdminStatsResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Charge les statistiques du dashboard admin (GET /admin/stats). */
export function useAdminStats(): UseAdminStatsResult {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (err) {
      console.error("Erreur de chargement des stats admin :", err);
      setError("Impossible de charger les statistiques.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, refresh: load };
}
