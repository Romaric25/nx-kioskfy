import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  currencySymbol,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kioskfy/ui";
import { ShoppingBag, TrendingDown, Users, Wallet } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";
import type {
  OrganizationBalanceResponse,
  OrganizationCustomersResponse,
  OrganizationOrder,
  OrganizationStatsResponse,
} from "@kioskfy/types/accounting";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatutBadge({ statut }: { statut: string }) {
  const styles: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
    completed: "default",
    pending: "secondary",
    failed: "destructive",
    refunded: "outline",
  };
  const labels: Record<string, string> = {
    completed: "Payée",
    pending: "En attente",
    failed: "Échouée",
    refunded: "Remboursée",
  };
  return (
    <Badge variant={styles[statut] ?? "secondary"}>
      {labels[statut] ?? statut}
    </Badge>
  );
}

/** Overview cards + all orders for the selected agency. */
export function OrganizationHome() {
  const { organization } = useActiveOrganization();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["org-stats", organization?.id],
    queryFn: () =>
      organization
        ? (api.orders.getOrganizationStats(
            organization.id,
          ) as Promise<OrganizationStatsResponse>)
        : null,
    enabled: !!organization,
  });

  const { data: balances } = useQuery({
    queryKey: ["org-balances", organization?.id],
    queryFn: () =>
      organization
        ? (api.organizations.getBalances(
            organization.id,
          ) as Promise<OrganizationBalanceResponse>)
        : null,
    enabled: !!organization,
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["org-customers", organization?.id],
    queryFn: () =>
      organization
        ? (api.orders.getOrganizationCustomers(
            organization.id,
          ) as Promise<OrganizationCustomersResponse>)
        : null,
    enabled: !!organization,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["org-orders", organization?.id],
    queryFn: () =>
      organization
        ? (api.orders.getOrganizationOrders(
            organization.id,
          ) as Promise<OrganizationOrder[]>)
        : null,
    enabled: !!organization,
  });

  if (!organization) return null;

  const devise = currencySymbol(balances?.currency);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Agence {organization.name}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.salesCount ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus réels (après commission)
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {(stats?.totalOrgRevenue ?? 0).toLocaleString("fr-FR")} {devise}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commission plateforme
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalPlatformRevenue ?? 0).toLocaleString("fr-FR")}{" "}
                {devise}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {customers?.totalCustomers ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes</CardTitle>
          <CardDescription>
            Toutes les ventes de vos journaux, avec la part qui vous revient
            après commission
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !orders?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune commande pour le moment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Journal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Part agence</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="tabular-nums">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {order.newspaper?.issueNumber
                          ? `Édition N° ${order.newspaper.issueNumber}`
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block">
                        {order.payeurNom ?? order.user?.name ?? "Client"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {order.user?.email ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(order.price).toLocaleString("fr-FR")} {devise}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {order.revenueShare
                        ? Number(
                            order.revenueShare.platformAmount,
                          ).toLocaleString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {order.revenueShare
                        ? Number(
                            order.revenueShare.organizationAmount,
                          ).toLocaleString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatutBadge statut={order.status} />
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
