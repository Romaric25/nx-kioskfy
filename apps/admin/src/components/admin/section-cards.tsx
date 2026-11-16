import { Building2, ShoppingBag, Users, Wallet } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
  formatCurrency,
} from "@kioskfy/ui";
import type { AdminStatsResponse } from "@kioskfy/types";

interface SectionCardsProps {
  stats: AdminStatsResponse | null;
  loading: boolean;
}

/** Cartes de synthèse du dashboard, alimentées par GET /admin/stats. */
export function SectionCards({ stats, loading }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Chiffre d&apos;affaires total</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatCurrency(stats?.totalSalesRevenue ?? 0)
            )}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Wallet className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            Commission plateforme :{" "}
            <span className="font-medium text-foreground">
              {loading ? "—" : formatCurrency(stats?.totalPlatformRevenue ?? 0)}
            </span>
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Commandes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              (stats?.totalOrders ?? 0).toLocaleString("fr-FR")
            )}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <ShoppingBag className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            Toutes les commandes passées sur la plateforme
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Utilisateurs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              (stats?.totalUsers ?? 0).toLocaleString("fr-FR")
            )}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Users className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Comptes inscrits</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Agences partenaires</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              (stats?.totalOrganizations ?? 0).toLocaleString("fr-FR")
            )}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Building2 className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            Agences de presse actives
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
