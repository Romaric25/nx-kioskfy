import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../../components/admin/data-table";
import { RowActions } from "../../components/admin/row-actions";
import { ConfirmDialog } from "../../components/admin/confirm-dialog";
import { api } from "../../lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { WithdrawalItem } from "@kioskfy/types";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Ban, Loader2, Send, XCircle } from "lucide-react";
import { Badge } from "@kioskfy/ui";

export const Route = createFileRoute("/admin/withdrawals")({ component: WithdrawalsPage });

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "outline",
  completed: "default",
  failed: "destructive",
  cancelled: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Payée",
  failed: "Échouée",
  cancelled: "Annulée",
};

const TRAITABLE_STATUSES = new Set(["pending", "processing"]);

/** Action de traitement choisie dans le menu d'une ligne. */
type TraitementAction = "completed" | "failed" | "cancelled";

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
      <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
        {STATUS_LABEL[row.original.status] ?? row.original.status}
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
  const [pendingAction, setPendingAction] = useState<{
    item: WithdrawalItem;
    action: TraitementAction;
  } | null>(null);
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

  const handleTraiter = useCallback(async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      await api.withdrawals.traiter(pendingAction.item.id, {
        statut: pendingAction.action,
        ...(pendingAction.action === "completed"
          ? { notes: "Versement PI-SPI initié par l'administration" }
          : {}),
        ...(pendingAction.action === "failed"
          ? { reason: "Demande rejetée par l'administration" }
          : {}),
        ...(pendingAction.action === "cancelled"
          ? { reason: "Annulée depuis l'administration" }
          : {}),
      });
      setPendingAction(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoading(false);
    }
  }, [pendingAction, load]);

  const columns = useMemo<ColumnDef<WithdrawalItem>[]>(
    () => [
      ...baseColumns,
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          const traitable = TRAITABLE_STATUSES.has(item.status);
          return (
            <RowActions
              actions={[
                {
                  label: "Verser via PI-SPI",
                  icon: Send,
                  disabled: actionLoading,
                  hidden: !traitable,
                  onClick: () =>
                    setPendingAction({ item, action: "completed" }),
                },
                {
                  label: "Marquer échouée",
                  icon: Ban,
                  destructive: true,
                  disabled: actionLoading,
                  hidden: !traitable,
                  onClick: () =>
                    setPendingAction({ item, action: "failed" }),
                },
                {
                  label: "Annuler",
                  icon: XCircle,
                  destructive: true,
                  disabled: actionLoading,
                  hidden: !traitable,
                  onClick: () =>
                    setPendingAction({ item, action: "cancelled" }),
                },
              ]}
            />
          );
        },
      },
    ],
    [actionLoading],
  );

  const dialogs: Record<
    TraitementAction,
    { title: string; description: string; confirmLabel: string }
  > = {
    completed: {
      title: "Verser via PI-SPI ?",
      description: `Un transfert PI-SPI de ${pendingAction?.item.amount.toLocaleString("fr-FR")} ${pendingAction?.item.currency} sera initié vers l'alias de l'agence. Le statut passera automatiquement à « Payée » quand la plateforme confirmera le transfert.`,
      confirmLabel: "Initier le versement",
    },
    failed: {
      title: "Marquer la demande comme échouée ?",
      description: "La demande sera rejetée et le montant restauré sur le solde de l'agence.",
      confirmLabel: "Marquer échouée",
    },
    cancelled: {
      title: "Annuler cette demande ?",
      description: `La demande de ${pendingAction?.item.amount.toLocaleString("fr-FR")} ${pendingAction?.item.currency} sera annulée et le solde de l'agence restauré.`,
      confirmLabel: "Annuler la demande",
    },
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Retraits</h1>
        <p className="text-sm text-muted-foreground">
          {withdrawals.length} demandes ·{" "}
          {withdrawals.filter((w) => TRAITABLE_STATUSES.has(w.status)).length}{" "}
          à traiter
        </p>
      </div>
      <DataTable columns={columns} data={withdrawals} searchKey="status" />

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction ? dialogs[pendingAction.action].title : ""}
        description={
          pendingAction ? dialogs[pendingAction.action].description : ""
        }
        confirmLabel={
          pendingAction ? dialogs[pendingAction.action].confirmLabel : ""
        }
        loading={actionLoading}
        onConfirm={handleTraiter}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
