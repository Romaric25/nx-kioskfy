import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
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
import { DollarSign, ShoppingBag, Users } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";
import type {
  OrganizationCustomersResponse,
  OrganizationStatsResponse,
} from "@kioskfy/types/accounting";

/** Overview cards + recent sales + customers table for the selected agency. */
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

  if (!organization) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Agence {organization.name}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalRevenue ?? 0).toLocaleString("fr-FR")} XAF
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
          <CardTitle>Ventes récentes</CardTitle>
          <CardDescription>Vos derniers clients</CardDescription>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !customers?.customers?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune vente pour le moment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead className="text-right">Total dépensé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.customers.slice(0, 6).map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell>
                      <div className="font-medium">
                        {customer.name || "Client"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell>{customer.purchaseCount}</TableCell>
                    <TableCell className="text-right">
                      {"—"}
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
