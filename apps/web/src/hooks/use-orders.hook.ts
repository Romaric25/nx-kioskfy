import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** An order with its embedded newspaper (and organization). */
export interface MyOrder {
  id: string;
  newspaperId: string;
  price: string;
  status: string;
  paymentId: string | null;
  createdAt: string;
  newspaper?: {
    id: string;
    issueNumber: string;
    coverImage: string;
    publishDate: string;
    organization: { id: string; name: string } | null;
  } | null;
}

/** Current user's orders (auth required). */
export function useMyOrders() {
  return useQuery({
    queryKey: ["myOrders"],
    queryFn: () => api.orders.getMy() as Promise<MyOrder[]>,
    retry: 1,
    // Après un paiement, la page des achats doit refléter le nouveau
    // statut des commandes dès qu'on y revient.
    refetchOnMount: true,
  });
}
