import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "./client";

export interface AdminOrderResponse {
  id: string;
  userId: string | null;
  newspaperId: string;
  price: string;
  status: string;
  paymentId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  newspaper?: {
    id: string;
    issueNumber: string;
    coverImage: string;
    price: string;
    publishDate: Date | string;
    organization: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export function useAdminOrders(
  params: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {},
) {
  return useQuery<AdminOrderResponse[]>({
    queryKey: ["admin-orders", params],
    queryFn: async () => {
      const response = await getApiClient().api.v1.orders.get({
        query: {
          limit: params.limit != null ? String(params.limit) : undefined,
          offset: params.offset != null ? String(params.offset) : undefined,
          status: params.status || undefined,
        } as { limit: string; offset: string; status: string },
      });

      if (response.error) {
        throw response.error;
      }

      let responseData = response.data;

      // Handle SuperJSON format if present
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (
        responseData &&
        typeof responseData === "object" &&
        "json" in responseData
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseData = (responseData as any).json;
      }

      if (
        !responseData ||
        typeof responseData !== "object" ||
        !("data" in responseData)
      ) {
        throw new Error("Invalid response format");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (responseData as any).data as AdminOrderResponse[];
    },
  });
}
