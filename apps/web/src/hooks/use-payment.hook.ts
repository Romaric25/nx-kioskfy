import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MonerooPaymentVerifyResponse } from "@kioskfy/types";

/** Verify a Moneroo payment by id. */
export function useVerifyPayment(paymentId: string | null) {
  const { data: paymentVerify, isLoading, isError, error } = useQuery({
    queryKey: ["payment", "verify", paymentId],
    queryFn: async () => {
      if (!paymentId) {
        throw new Error("Payment ID is required");
      }
      return (await api.payments.verify(paymentId)) as MonerooPaymentVerifyResponse;
    },
    enabled: !!paymentId,
    retry: false,
  });

  return { paymentVerify, isLoading, isError, error };
}

/**
 * Mark a payment as successful on the API
 * (`POST /payments/success`) — creates the revenue shares.
 */
export function useProcessPaymentSuccess() {
  return useMutation({
    mutationFn: (paymentId: string) => api.payments.success({ paymentId }),
  });
}

/**
 * Confirm a PI-SPI payment server-side (`POST /payments/pispi/confirm`).
 * Polls every 5 s until the API reports success (the RTP status may take
 * a few seconds to become irrevocable).
 */
export function useConfirmPispiPayment(txId: string | null) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["payment", "pispi", "confirm", txId],
    queryFn: async () => {
      try {
        return (await api.payments.confirmPispi({
          txId: txId as string,
        })) as {
          success: boolean;
          statut?: string;
          orderIds?: string[];
        };
      } catch (err) {
        // Ne jamais tuer le polling : l'API SaaS peut être momentanément
        // indisponible. On renvoie un statut neutre et on réessaie 5 s
        // plus tard tant que la page de succès est ouverte.
        console.warn(
          "[PI-SPI] Confirmation momentanément indisponible, nouvel essai dans 5 s :",
          err,
        );
        return { success: false, statut: "INDISPONIBLE" };
      }
    },
    enabled: !!txId,
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.success === true) return false;
      const statut = String(data?.statut ?? "").toUpperCase();
      if (["REJETE", "REJETEE", "ANNULE"].includes(statut)) return false;
      return 5000;
    },
  });

  return { pispiConfirm: data, isLoading, isError, error, refetch };
}
