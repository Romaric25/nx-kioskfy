import { getApiClient } from './client';
import { useMutation, useQuery } from '@tanstack/react-query';

interface Payment {
  amount: number;
  currency: string;
  description: string;
  customer: any;
  return_url: string;
  metadata: any;
  methods: string[];
  withdrawalId?: number;
}

interface MonerooPaymentVerifyResponse {
  success: boolean;
  data: {
    status: string;
    transactionId?: string;
    amount?: number;
    currency?: string;
    [key: string]: any;
  };
  message?: string;
}

export const useInitializePayment = () => {
  const { mutateAsync, isPending, isError, error, isSuccess, data } =
    useMutation({
      mutationFn: async (data: Payment) => {
        const { data: response, error } =
          await getApiClient().api.v1.payments.initialize.post(data as any);

        if (error) {
          throw new Error(
            error.value?.message || 'Failed to initialize payment',
          );
        }

        return response;
      },
    });
  return { mutateAsync, isPending, isError, error, isSuccess, data };
};

export const useVerifyPayment = (paymentId: string | null) => {
  const {
    data: paymentVerify,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MonerooPaymentVerifyResponse>({
    queryKey: ['payment', 'verify', paymentId],
    queryFn: async () => {
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      const { data: response, error } = await getApiClient().api.v1.payments
        .verify({ paymentId })
        .get();

      if (error) {
        throw new Error(error.value?.message || 'Failed to verify payment');
      }

      return response as MonerooPaymentVerifyResponse;
    },
    enabled: !!paymentId,
    retry: false,
  });

  return { paymentVerify, isLoading, isError, error, refetch };
};
