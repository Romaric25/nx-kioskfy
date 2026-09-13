import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../../components/admin/data-table";
import { RowActions } from "../../components/admin/row-actions";
import { api } from "../../lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrganizationItem } from "@kioskfy/types";
import type { OrganizationBalanceResponse } from "@kioskfy/types/accounting";
import { useState, useEffect, useMemo } from "react";
import { Loader2, RefreshCcw, Wallet } from "lucide-react";
import {
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kioskfy/ui";

export const Route = createFileRoute("/admin/organizations")({ component: OrganizationsPage });

const baseColumns: ColumnDef<OrganizationItem>[] = [
  {
    id: "logo",
    header: "Logo",
    cell: ({ row }) => (
      <Avatar className="size-8">
        {row.original.logo ? <AvatarImage src={row.original.logo} /> : null}
        <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
      </Avatar>
    ),
  },
  { accessorKey: "name", header: "Nom" },
  { accessorKey: "slug", header: "Slug" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Téléphone" },
  { accessorKey: "country", header: "Pays" },
  {
    accessorKey: "suspended",
    header: "Statut",
    cell: ({ row }) =>
      row.original.suspended ? (
        <Badge variant="destructive">Suspendu</Badge>
      ) : (
        <Badge variant="secondary">Actif</Badge>
      ),
  },
];

function formatXaf(value: number): string {
  return `${value.toLocaleString("fr-FR")} XAF`;
}

function BalanceDialog({
  organization,
  onClose,
}: {
  organization: OrganizationItem | null;
  onClose: () => void;
}) {
  const [balance, setBalance] = useState<OrganizationBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    setLoading(true);
    setError(null);
    setBalance(null);
    api.organizations
      .getBalances(organization.id)
      .then(setBalance)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [organization]);

  return (
    <Dialog open={!!organization} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Soldes — {organization?.name}</DialogTitle>
          <DialogDescription>Répartition des revenus de l'organisation.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            Erreur : {error}
          </p>
        ) : balance ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Montant organisation</dt>
              <dd className="mt-1 text-base font-semibold">{formatXaf(balance.organizationAmount)}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Montant plateforme</dt>
              <dd className="mt-1 text-base font-semibold">{formatXaf(balance.platformAmount)}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Ventes</dt>
              <dd className="mt-1 text-base font-semibold">{balance.totalSales}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Retiré</dt>
              <dd className="mt-1 text-base font-semibold">{formatXaf(balance.withdrawnAmount)}</dd>
            </div>
            <div className="col-span-2 rounded-md border p-3">
              <dt className="text-muted-foreground">Retraits</dt>
              <dd className="mt-1 text-base font-semibold">{balance.totalWithdrawals}</dd>
            </div>
          </dl>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceOrg, setBalanceOrg] = useState<OrganizationItem | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    api.organizations
      .getAll()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => setOrgs(Array.isArray(data) ? data : data?.data ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const syncBalances = async (org: OrganizationItem) => {
    setSyncLoading(true);
    try {
      await api.organizations.syncBalances(org.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSyncLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<OrganizationItem>[]>(
    () => [
      ...baseColumns,
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const org = row.original;
          return (
            <RowActions
              actions={[
                {
                  label: "Voir les soldes",
                  icon: Wallet,
                  onClick: () => setBalanceOrg(org),
                },
                {
                  label: "Synchroniser les soldes",
                  icon: RefreshCcw,
                  disabled: syncLoading,
                  onClick: () => syncBalances(org),
                },
              ]}
            />
          );
        },
      },
    ],
    [syncLoading],
  );

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organisations</h1>
        <p className="text-sm text-muted-foreground">{orgs.length} organisations</p>
      </div>
      <DataTable columns={columns} data={orgs} searchKey="name" />
      <BalanceDialog organization={balanceOrg} onClose={() => setBalanceOrg(null)} />
    </div>
  );
}
