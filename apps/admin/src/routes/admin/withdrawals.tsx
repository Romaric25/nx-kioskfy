import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../../components/admin/data-table";
import { RowActions } from "../../components/admin/row-actions";
import { ConfirmDialog } from "../../components/admin/confirm-dialog";
import { api } from "../../lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { WithdrawalItem } from "@kioskfy/types";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, XCircle } from "lucide-react";
import { Badge } from "@kioskfy/ui";

export const Route = createFileRoute("/admin/withdrawals")({ component: WithdrawalsPage });

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "outline",
  completed: "default",
  failed: "destructive",
  cancelled: "outline",
};

const CANCELABLE_STATUSES = new Set(["pending", "processing"]);

const baseColumns: ColumnDef<WithdrawalItem>[] = [
  { accessorKey: "id", header: "ID" },
  {
    id: "organization",
    header: "Organisation",
    cell: ({ row }) => row.original.organization?.name ?? row.original.organizationId,
  },
  {
    accessorKey: "amount",
    header: "Montant",
    cell: ({ row }) => `${row.original.amount.toLocaleString("fr-FR")} ${row.original.currency}`,
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"} className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Méthode",
    cell: ({ row }) => row.original.paymentMethod ?? "—",
  },
  {
    accessorKey: "requestedAt",
    header: "Date",
    cell: ({ row }) => new Date(row.original.requestedAt).toLocaleDateString("fr-FR"),
  },
];

function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<WithdrawalItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.withdrawals.getAll();
      setWithdrawals(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = useCallback(async () => {
    if (!pendingCancel) return;
    setActionLoading(true);
    try {
      await api.withdrawals.cancel(pendingCancel.id, "Annulé depuis l'administration");
      setPendingCancel(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoading(false);
    }
  }, [pendingCancel, load]);

  const columns = useMemo<ColumnDef<WithdrawalItem>[]>(
    () => [
      ...baseColumns,
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <RowActions
              actions={[
                {
                  label: "Annuler",
                  icon: XCircle,
                  destructive: true,
                  disabled: actionLoading,
                  hidden: !CANCELABLE_STATUSES.has(item.status),
                  onClick: () => setPendingCancel(item),
                },
              ]}
            />
          );
        },
      },
    ],
    [actionLoading],
  );

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Retraits</h1>
        <p className="text-sm text-muted-foreground">{withdrawals.length} demandes de retrait</p>
      </div>
      <DataTable columns={columns} data={withdrawals} searchKey="status" />

      <ConfirmDialog
        open={!!pendingCancel}
        title="Annuler ce retrait ?"
        description={`La demande de ${pendingCancel?.amount.toLocaleString("fr-FR")} ${pendingCancel?.currency} sera marquée comme annulée.`}
        confirmLabel="Annuler le retrait"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
}
