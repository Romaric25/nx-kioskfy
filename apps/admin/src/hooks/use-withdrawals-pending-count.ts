import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

/** Intervalle de rafraîchissement du badge de retraits (ms). */
const POLL_INTERVAL_MS = 30_000;

/**
 * Nombre de demandes de retrait à traiter par l'admin (statuts `pending` +
 * `processing`) — badge de notification de la sidebar.
 *
 * Mis à jour en temps réel : polling toutes les 30 s + rafraîchissement
 * immédiat dès que l'onglet redevient visible. Les erreurs sont silencieuses
 * (le dernier compteur affiché est conservé).
 */
export function useWithdrawalsPendingCount(): number {
  const [count, setCount] = useState(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const { count } = await api.withdrawals.countPending();
        setCount(count);
      } catch (err) {
        // Silencieux : le badge garde sa dernière valeur connue.
        console.warn(
          "[admin] Impossible de charger le compteur de retraits :",
          err,
        );
      } finally {
        inFlightRef.current = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };

    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return count;
}
