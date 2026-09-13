import { getApiClient } from './client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface WithdrawalResponse {
  id: number;
  organizationId: number;
  amount: number;
  currency: string;
  status: string;
  method: string;
  accountNumber: string;
  accountName: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface CreateWithdrawalInput {
  organizationId: number;
  amount: number;
  currency: string;
  method: string;
  accountNumber: string;
  accountName: string;
  description?: string;
}

/**
 * Hook pour récupérer les retraits d'une organisation
 */
export function useWithdrawals(
  organizationId: string | undefined,
  limit = 50,
) {
  return useQuery({
    queryKey: ['withdrawals', organizationId, limit],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await getApiClient().api.v1.withdrawals
        .organization({ organizationId })
        .get({
          query: {
            limit: limit.toString(),
            offset: '0',
          } as { limit: string; offset: string },
        });

      if (error) {
        throw new Error(
          (error as any).value?.message || 'Failed to fetch withdrawals',
        );
      }

      return (data as any).data as WithdrawalResponse[];
    },
    enabled: !!organizationId,
  });
}

/**
 * Hook pour créer une demande de retrait
 */
export function useCreateWithdrawal(onSuccess?: (data: WithdrawalResponse) => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWithdrawalInput) => {
      const { data, error } = await getApiClient().api.v1.withdrawals.post(
        input as any,
      );

      if (error) {
        throw new Error(
          (error as any).value?.message || 'Failed to create withdrawal',
        );
      }

      return (data as any).data as WithdrawalResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['withdrawals', data.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['organizationBalances', data.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['organizationStats', data.organizationId],
      });
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Hook pour annuler un retrait
 */
export function useCancelWithdrawal(onSuccess?: (data: WithdrawalResponse) => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const { data, error } = await getApiClient().api.v1
        .withdrawals({ id: id.toString() })
        .delete({
          reason,
        });

      if (error) {
        throw new Error(
          (error as any).value?.message || 'Failed to cancel withdrawal',
        );
      }

      return (data as any).data as WithdrawalResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['withdrawals', data.organizationId],
      });
      onSuccess?.(data);
    },
    onError,
  });
}
