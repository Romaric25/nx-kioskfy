import { getApiClient } from './client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface InitializePayoutInput {
  amount: number;
  currency: string;
  method: string;
  accountNumber: string;
  accountName: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface PaymentResponse {
  success: boolean;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    [key: string]: any;
  };
  message?: string;
}

interface VerifyTransactionResponse {
  success: boolean;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    [key: string]: any;
  };
  message?: string;
}

/**
 * Hook pour initialiser un retrait Moneroo
 */
export function useInitializePayout(onSuccess?: (data: PaymentResponse) => void, onError?: (error: Error) => void) {
  return useMutation({
    mutationFn: async (input: InitializePayoutInput) => {
      const { data, error } = await getApiClient().api.v1.payouts.initialize.post(
        input as any,
      );

      if (error) {
        throw new Error(
          (error as any).value?.message || 'Failed to initialize payout',
        );
      }

      return data as any as PaymentResponse;
    },
    onSuccess,
    onError,
  });
}

/**
 * Hook pour vérifier une transaction Moneroo
 */
export function useVerifyTransaction(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['verifyTransaction', transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error('Transaction ID is required');

      const { data, error } = await getApiClient().api.v1
        .payouts({ payoutId: transactionId })
        .verify.get();

      if (error) {
        throw new Error(
          (error as any).value?.message || 'Failed to verify transaction',
        );
      }

      return (data as any).data as VerifyTransactionResponse;
    },
    enabled: !!transactionId,
  });
}

/**
 * Hook de mutation pour vérifier une transaction manuellement
 */
export function useVerifyPayoutMutation(onSuccess?: (data: VerifyTransactionResponse) => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await getApiClient().api.v1
        .payouts({ payoutId: transactionId })
        .verify.get();

      if (error) {
        throw new Error(
          (error as any).value?.message || 'Failed to verify transaction',
        );
      }

      return (data as any).data as VerifyTransactionResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['organizationBalances'] });
      onSuccess?.(data);
    },
    onError,
  });
}
