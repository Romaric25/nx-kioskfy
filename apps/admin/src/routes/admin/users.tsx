import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../../components/admin/data-table";
import { RowActions } from "../../components/admin/row-actions";
import { ConfirmDialog } from "../../components/admin/confirm-dialog";
import { api } from "../../lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserProfile } from "@kioskfy/types";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Ban, CircleCheck } from "lucide-react";
import { Badge, Avatar, AvatarFallback, AvatarImage } from "@kioskfy/ui";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

const baseColumns: ColumnDef<UserProfile>[] = [
  {
    id: "image",
    header: "",
    cell: ({ row }) => (
      <Avatar className="size-8">
        {row.original.image ? <AvatarImage src={row.original.image} /> : null}
        <AvatarFallback>{row.original.name?.charAt(0) ?? "?"}</AvatarFallback>
      </Avatar>
    ),
  },
  { accessorKey: "name", header: "Nom" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "phone",
    header: "Téléphone",
    cell: ({ row }) => row.original.phone ?? "—",
  },
  {
    accessorKey: "typeUser",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.typeUser ?? "client"}</Badge>,
  },
  {
    accessorKey: "emailVerified",
    header: "Vérifié",
    cell: ({ row }) =>
      row.original.emailVerified ? (
        <span className="text-emerald-500">✓</span>
      ) : (
        <span className="text-destructive">✗</span>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Inscription",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("fr-FR"),
  },
];

function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingBan, setPendingBan] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.users.getAll();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUsers(Array.isArray(data) ? data : (data as any)?.data ?? []);
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

  const toggleBan = useCallback(
    async (user: UserProfile) => {
      setActionLoading(true);
      try {
        if (user.banned) {
          await api.admin.unbanUser(user.id);
        } else {
          await api.admin.banUser(user.id);
        }
        setPendingBan(null);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setActionLoading(false);
      }
    },
    [load],
  );

  const columns = useMemo<ColumnDef<UserProfile>[]>(
    () => [
      ...baseColumns,
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <RowActions
              actions={[
                {
                  label: user.banned ? "Débannir" : "Bannir",
                  icon: user.banned ? CircleCheck : Ban,
                  destructive: !user.banned,
                  disabled: actionLoading,
                  onClick: () => (user.banned ? toggleBan(user) : setPendingBan(user)),
                },
              ]}
            />
          );
        },
      },
    ],
    [actionLoading, toggleBan],
  );

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">{users.length} utilisateurs</p>
      </div>
      <DataTable columns={columns} data={users} searchKey="email" />

      <ConfirmDialog
        open={!!pendingBan}
        title="Bannir cet utilisateur ?"
        description={`${pendingBan?.name ?? pendingBan?.email} ne pourra plus se connecter à la plateforme.`}
        confirmLabel="Bannir"
        loading={actionLoading}
        onConfirm={() => pendingBan && toggleBan(pendingBan)}
        onCancel={() => setPendingBan(null)}
      />
    </div>
  );
}
