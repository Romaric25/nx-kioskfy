import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../../components/admin/data-table";
import { api } from "../../lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminOrderResponse } from "@kioskfy/types";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge } from "@kioskfy/ui";

const STATUS_TABS = [
  { key: "completed", label: "Succès" },
  { key: "pending", label: "En attente" },
  { key: "failed", label: "Échoué" },
  { key: "all", label: "Toutes" },
] as const;

export const Route = createFileRoute("/admin/orders")({ component: OrdersPage });

const columns: ColumnDef<AdminOrderResponse>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => row.original.id.slice(0, 8) + "…",
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const variant =
        row.original.status === "completed"
          ? "default"
          : row.original.status === "pending"
            ? "secondary"
            : "destructive";
      return <Badge variant={variant}>{row.original.status}</Badge>;
    },
  },
  {
    accessorKey: "price",
    header: "Montant",
    cell: ({ row }) => `${parseFloat(row.original.price).toLocaleString("fr-FR")} XAF`,
  },
  {
    id: "user",
    header: "Client",
    cell: ({ row }) => row.original.user?.email ?? "—",
  },
  {
    id: "newspaper",
    header: "Journal",
    cell: ({ row }) => row.original.newspaper?.issueNumber ?? "—",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("fr-FR"),
  },
];

function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("completed");
  const [orders, setOrders] = useState<AdminOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const data = await api.orders.getAll(100, 0, status === "all" ? undefined : status);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter, fetchOrders]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
        <p className="text-sm text-muted-foreground">Suivi des transactions.</p>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
          ) : (
            <DataTable columns={columns} data={orders} searchKey="id" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
