import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  currencySymbol,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kioskfy/ui";
import { Banknote, DollarSign, Landmark, RefreshCw, TrendingDown, Wallet, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type {
  OrganizationBalanceResponse,
  OrganizationOrder,
  OrganizationStatsResponse,
} from "@kioskfy/types/accounting";
import type { WithdrawalItem } from "@kioskfy/types";

interface AccountingManagementProps {
  organizationId: string;
  /** Seul le propriétaire peut demander un retrait / l'annuler. */
  isOwner: boolean;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

/** Revenus réels (après commission), solde et toutes les commandes. */
export function AccountingManagement({
  organizationId,
  isOwner,
}: AccountingManagementProps) {
  const queryClient = useQueryClient();
  const [montant, setMontant] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["org-orders", organizationId],
    queryFn: () =>
      api.orders.getOrganizationOrders(organizationId) as Promise<OrganizationOrder[]>,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["withdrawals", organizationId],
    queryFn: () =>
      api.withdrawals.getByOrganization(organizationId) as Promise<WithdrawalItem[]>,
    enabled: isOwner,
  });

  const invalidateFinances = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["withdrawals", organizationId] }),
      queryClient.invalidateQueries({ queryKey: ["org-balances", organizationId] }),
    ]);

  const createMutation = useMutation({
    mutationFn: (amount: number) =>
      api.withdrawals.create({ organizationId, amount }) as Promise<WithdrawalItem>,
    onSuccess: () => {
      setMontant("");
      setActionError(null);
      setActionSuccess(
        "Demande de paiement envoyée. Elle sera traitée par l'équipe kioskfy.",
      );
      void invalidateFinances();
    },
    onError: (err) => {
      setActionSuccess(null);
      setActionError(
        err instanceof Error ? err.message : "Impossible d'envoyer la demande",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) =>
      api.withdrawals.cancel(id) as Promise<WithdrawalItem>,
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Demande annulée, le solde a été restauré.");
      void invalidateFinances();
    },
    onError: (err) => {
      setActionSuccess(null);
      setActionError(
        err instanceof Error ? err.message : "Impossible d'annuler la demande",
      );
    },
  });

  const soldeDisponible = Number(balances?.organizationAmount ?? 0);
  const montantDemande = Number(montant);
  const montantInvalide =
    !Number.isFinite(montantDemande) || montantDemande <= 0;
  const montantDepasse = montantDemande > soldeDisponible;

  const syncBalances = async () => {
    try {
      await api.organizations.syncBalances(organizationId);
    } catch (err) {
      console.error("Sync error:", err);
      window.alert("Erreur lors de la synchronisation des soldes.");
    }
  };

  const devise = currencySymbol(balances?.currency);

  return (
    <div className="space-y-6">
      {/* ── Revenus réels ─────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus réels (après commission)
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {(stats?.totalOrgRevenue ?? 0).toLocaleString("fr-FR")} {devise}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Part de l'agence sur les ventes, commission déduite
            </p>
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
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalPlatformRevenue ?? 0).toLocaleString("fr-FR")}{" "}
                {devise}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Conservée par kioskfy sur les ventes
            </p>
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
                {devise}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Retiré :{" "}
              {(balances?.withdrawnAmount ?? 0).toLocaleString("fr-FR")} {devise}
            </p>
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

      {/* ── Toutes les commandes ──────────────────────────────────────── */}
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
                        ? Number(order.revenueShare.platformAmount).toLocaleString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {order.revenueShare
                        ? Number(order.revenueShare.organizationAmount).toLocaleString("fr-FR")
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

      {/* ── Demande de paiement + retraits (owner uniquement) ─────────── */}
      {isOwner && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Demande de paiement</CardTitle>
              <CardDescription>
                Demandez le versement de vos gains. Le montant sera débité
                de votre solde et traité par l&apos;équipe kioskfy sur votre
                alias PI-SPI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="montant-retrait"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Montant ({devise})
                  </label>
                  <Input
                    id="montant-retrait"
                    type="number"
                    min="1"
                    step="1"
                    placeholder={`Solde disponible : ${soldeDisponible.toLocaleString("fr-FR")}`}
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate(montantDemande)}
                  disabled={
                    montantInvalide || montantDepasse || createMutation.isPending
                  }
                >
                  <Banknote data-icon="inline-start" />
                  {createMutation.isPending ? "Envoi…" : "Envoyer la demande"}
                </Button>
              </div>
              {montantDepasse && !montantInvalide && (
                <p className="text-sm text-destructive">
                  Le montant demandé dépasse votre solde disponible.
                </p>
              )}
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
              {actionSuccess && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {actionSuccess}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demandes de retrait</CardTitle>
              <CardDescription>
                Historique de vos demandes de paiement
              </CardDescription>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          {formatDate(withdrawal.requestedAt ?? new Date())}
                        </TableCell>
                        <TableCell>
                          {(withdrawal.amount ?? 0).toLocaleString("fr-FR")}{" "}
                          {devise}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {withdrawal.status ?? "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {withdrawal.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(withdrawal.id)}
                            >
                              <XCircle data-icon="inline-start" />
                              Annuler
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
