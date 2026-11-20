import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { AdminStatsResponse } from "@kioskfy/types";

interface UseAdminStatsResult {
  stats: AdminStatsResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Intervalle de rafraîchissement automatique des statistiques (ms). */
const POLL_INTERVAL_MS = 15_000;

/**
 * Charge les statistiques du dashboard admin (GET /admin/stats) et les
 * maintient à jour en temps réel :
 * - chargement initial avec skeleton ;
 * - polling toutes les 15 s (silencieux : pas de clignotement) ;
 * - rafraîchissement immédiat dès que l'onglet redevient visible/focus ;
 * - en cas d'erreur de rafraîchissement, les derniers chiffres affichés
 *   sont conservés (l'erreur n'est signalée que si rien n'a jamais chargé).
 */
export function useAdminStats(): UseAdminStatsResult {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Données déjà affichées + verrou anti-requêtes concurrentes.
  const hasDataRef = useRef(false);
  const inFlightRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    // Évite d'empiler les requêtes si l'une d'elles dépasse l'intervalle.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!silent) setLoading(true);
    try {
      const data = await api.admin.getStats();
      hasDataRef.current = true;
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Erreur de chargement des stats admin :", err);
      if (!silent || !hasDataRef.current) {
        setError("Impossible de charger les statistiques.");
      }
    } finally {
      inFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  // Chargement initial.
  useEffect(() => {
    void load(false);
  }, [load]);

  // Temps réel : polling périodique + rafraîchissement au retour sur l'onglet.
  useEffect(() => {
    const tick = () => void load(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };

    const timer = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [load]);

  return { stats, loading, error, refresh: () => load(false) };
}
