import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kioskfy/ui";
import { DollarSign, Landmark, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type {
  OrganizationBalanceResponse,
  OrganizationStatsResponse,
} from "@kioskfy/types/accounting";
import type { WithdrawalItem } from "@kioskfy/types";

interface AccountingManagementProps {
  organizationId: string;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Revenue + withdrawals overview for the selected agency. */
export function AccountingManagement({
  organizationId,
}: AccountingManagementProps) {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["org-stats", organizationId],
    queryFn: () =>
      api.orders.getOrganizationStats(organizationId) as Promise<OrganizationStatsResponse>,
  });

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ["org-balances", organizationId],
    queryFn: () =>
      api.organizations.getBalances(organizationId) as Promise<OrganizationBalanceResponse>,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["withdrawals", organizationId],
    queryFn: () =>
      api.withdrawals.getAll(organizationId) as Promise<WithdrawalItem[]>,
  });

  const syncBalances = async () => {
    try {
      await api.organizations.syncBalances(organizationId);
    } catch (err) {
      console.error("Sync error:", err);
      window.alert("Erreur lors de la synchronisation des soldes.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalRevenue ?? 0).toLocaleString("fr-FR")} XAF
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde disponible</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {balancesLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {(balances?.organizationAmount ?? 0).toLocaleString("fr-FR")}{" "}
                {balances?.currency ?? "XAF"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{stats?.salesCount ?? 0}</div>
            <Button variant="outline" size="sm" onClick={syncBalances}>
              <RefreshCw data-icon="inline-start" />
              Synchroniser
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes de retrait</CardTitle>
          <CardDescription>Historique de vos retraits</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !withdrawals?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune demande de retrait.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {formatDate(withdrawal.requestedAt ?? new Date())}
                    </TableCell>
                    <TableCell>
                      {(withdrawal.amount ?? 0).toLocaleString("fr-FR")} XAF
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {withdrawal.status ?? "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
