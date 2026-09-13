import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@kioskfy/ui";
import { Building2, Globe, Mail, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";
import type { OrganizationBalanceResponse } from "@kioskfy/types/accounting";

/** Read-only view of the selected agency's info and balance. */
export function SettingsOrganization() {
  const { organization } = useActiveOrganization();

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["org-balances", organization?.id],
    queryFn: () =>
      organization
        ? (api.organizations.getBalances(
            organization.id,
          ) as Promise<OrganizationBalanceResponse>)
        : null,
    enabled: !!organization,
  });

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucune agence sélectionnée.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Informations de votre agence
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {organization.name}
          </CardTitle>
          <CardDescription>
            <Badge variant="secondary" className="mt-1">
              <Globe data-icon="inline-start" />
              {organization.slug}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            Contactez le support pour modifier vos informations d'agence.
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            Les modifications d'agence sont gérées par l'équipe kioskfy.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solde</CardTitle>
          <CardDescription>Vos revenus disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="text-3xl font-bold">
              {(balance?.organizationAmount ?? 0).toLocaleString("fr-FR")}{" "}
              {balance?.currency ?? "XAF"}
            </div>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {balance?.totalSales ?? 0} vente
            {balance?.totalSales === 1 ? "" : "s"} au total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
