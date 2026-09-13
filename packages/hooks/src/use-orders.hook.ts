import { getApiClient } from './client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface OrderInput {
  newspaperId: string;
  price: string;
  quantity?: number;
  [key: string]: any;
}

interface OrderResponse {
  id: string;
  newspaperId: string;
  price: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}

interface OrderWithNewspaperResponse extends OrderResponse {
  newspaper: any;
}

interface CreateOrderResponse {
  success: boolean;
  data: OrderResponse;
}

interface CreateOrderBatchResponse {
  success: boolean;
  data: OrderResponse[];
}

interface MyOrdersResponse {
  success: boolean;
  data: OrderWithNewspaperResponse[];
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for creating a single order
 */
export function useCreateOrder(onSuccess?: (data: CreateOrderResponse) => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OrderInput) => {
      const { data, error } = await getApiClient().api.v1.orders.post(input);

      if (error) {
        throw new Error((error as any).value?.message || 'Failed to create order');
      }

      return data as CreateOrderResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Hook for creating multiple orders at once
 */
export function useCreateBatchOrder(onSuccess?: (data: CreateOrderBatchResponse) => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orders: OrderInput[]) => {
      const { data, error } = await getApiClient().api.v1.orders.batch.post({ orders });

      if (error) {
        throw new Error((error as any).value?.message || 'Failed to create orders');
      }

      return data as CreateOrderBatchResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Hook for updating orders with payment ID
 */
export function useUpdatePaymentId(onSuccess?: (data: any) => void, onError?: (error: Error) => void) {
  return useMutation({
    mutationFn: async ({ orderIds, paymentId }: { orderIds: string[]; paymentId: string }) => {
      const { data, error } = await getApiClient().api.v1.orders['payment-id'].put({ orderIds, paymentId });

      if (error) {
        throw new Error((error as any).value?.message || 'Failed to update payment ID');
      }

      return data;
    },
    onSuccess,
    onError,
  });
}

/**
 * Hook for fetching current user's orders
 */
export function useMyOrders() {
  return useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const { data, error } = await getApiClient().api.v1.orders.my.get();

      if (error) {
        throw new Error((error as any).value?.message || 'Failed to fetch orders');
      }

      return data as unknown as MyOrdersResponse;
    },
  });
}

/**
 * Hook for checking if user has purchased a newspaper
 */
export function useCheckPurchase(newspaperId: string, enabled = true) {
  return useQuery({
    queryKey: ['checkPurchase', newspaperId],
    queryFn: async () => {
      const { data, error } = await getApiClient().api.v1.orders.check({ newspaperId }).get();

      if (error) {
        throw new Error((error as any).value?.message || 'Failed to check purchase status');
      }

      return data as { success: boolean; data: { hasPurchased: boolean } };
    },
    enabled: !!newspaperId && enabled,
  });
}
