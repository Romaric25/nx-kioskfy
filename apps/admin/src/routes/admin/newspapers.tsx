import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../../components/admin/data-table";
import { RowActions } from "../../components/admin/row-actions";
import { ConfirmDialog } from "../../components/admin/confirm-dialog";
import { NewspaperDialog } from "../../components/admin/newspaper-dialog";
import { api } from "../../lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { NewspaperItem } from "@kioskfy/types";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Trash2, UploadCloud, CircleOff } from "lucide-react";
import { Badge } from "@kioskfy/ui";

export const Route = createFileRoute("/admin/newspapers")({ component: NewspapersPage });

const baseColumns: ColumnDef<NewspaperItem>[] = [
  { accessorKey: "issueNumber", header: "N°" },
  {
    id: "coverImage",
    header: "Image",
    cell: ({ row }) =>
      row.original.coverImage ? (
        <img src={row.original.coverImage} alt="" className="size-10 rounded object-cover" />
      ) : (
        <div className="size-10 rounded bg-muted" />
      ),
  },
  { accessorKey: "price", header: "Prix" },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "published" ? "default" : "secondary"} className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "organization",
    header: "Organisation",
    cell: ({ row }) => row.original.organization?.name ?? "—",
  },
  {
    accessorKey: "publishDate",
    header: "Date",
    cell: ({ row }) => new Date(row.original.publishDate).toLocaleDateString("fr-FR"),
  },
];

function NewspapersPage() {
  const [newspapers, setNewspapers] = useState<NewspaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<NewspaperItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.newspapers.getAll();
      setNewspapers(Array.isArray(data) ? data : []);
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

  const toggleStatus = useCallback(
    async (item: NewspaperItem) => {
      const nextStatus = item.status === "published" ? "draft" : "published";
      setActionLoading(true);
      try {
        await api.newspapers.updateStatus(item.id, nextStatus);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setActionLoading(false);
      }
    },
    [load],
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setActionLoading(true);
    try {
      await api.newspapers.delete(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoading(false);
    }
  }, [pendingDelete, load]);

  const columns = useMemo<ColumnDef<NewspaperItem>[]>(
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
                  label: item.status === "published" ? "Dépublier" : "Publier",
                  icon: item.status === "published" ? CircleOff : UploadCloud,
                  disabled: actionLoading,
                  onClick: () => toggleStatus(item),
                },
                {
                  label: "Supprimer",
                  icon: Trash2,
                  destructive: true,
                  disabled: actionLoading,
                  onClick: () => setPendingDelete(item),
                },
              ]}
            />
          );
        },
      },
    ],
    [actionLoading, toggleStatus],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journaux</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Chargement…" : `${newspapers.length} journaux au total`}
          </p>
        </div>
        <NewspaperDialog onCreated={load} />
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Erreur : {error}
        </p>
      ) : (
        <DataTable columns={columns} data={newspapers} searchKey="issueNumber" />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Supprimer ce journal ?"
        description={`« ${pendingDelete?.issueNumber} » sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
