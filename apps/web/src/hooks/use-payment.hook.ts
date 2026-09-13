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
