import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Image } from "@unpic/react";
import {
  ShoppingBag,
  Eye,
  Calendar,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@kioskfy/ui";
import { useMyOrders, type MyOrder } from "@/hooks/use-orders.hook";

export const Route = createFileRoute("/dashboard/achats")({
  component: AchatsPage,
});

function formatOrderDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  completed: {
    label: "Payé",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: "En attente",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  failed: {
    label: "Échoué",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function AchatsPage() {
  const { data: orders, isLoading, error } = useMyOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const orderList = orders ?? [];

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orderList;

    const query = searchQuery.toLowerCase().trim();
    return orderList.filter((order: MyOrder) => {
      const issueNumber = order.newspaper?.issueNumber?.toLowerCase() || "";
      const organizationName =
        order.newspaper?.organization?.name?.toLowerCase() || "";
      return issueNumber.includes(query) || organizationName.includes(query);
    });
  }, [orderList, searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-blue-500" />
            Mes achats
          </h1>
          <p className="text-muted-foreground mt-1">
            Retrouvez l&apos;historique de tous vos achats de journaux
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-blue-500" />
            Mes achats
          </h1>
          <p className="text-muted-foreground mt-1">
            Retrouvez l&apos;historique de tous vos achats de journaux
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive">
              Une erreur est survenue lors du chargement de vos achats.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-blue-500" />
          Mes achats
        </h1>
        <p className="text-muted-foreground mt-1">
          Retrouvez l&apos;historique de tous vos achats de journaux
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Historique des achats</CardTitle>
              <CardDescription>
                {orderList.length > 0
                  ? `${filteredOrders.length} ${filteredOrders.length > 1 ? "journaux" : "journal"} trouvé${filteredOrders.length > 1 ? "s" : ""}`
                  : "Tous les journaux que vous avez achetés sur Kioskfy"}
              </CardDescription>
            </div>
            {orderList.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un journal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {orderList.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-xl mb-2">Aucun achat</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Vous n&apos;avez pas encore effectué d&apos;achat. Parcourez
                notre catalogue pour découvrir les dernières éditions.
              </p>
              <Button asChild size="lg">
                <Link to="/newspapers">Découvrir les journaux</Link>
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-xl mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Aucun journal ne correspond à votre recherche &quot;
                {searchQuery}&quot;
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Effacer la recherche
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedOrders.map((order) => {
                  const status = order.status || "pending";
                  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                  return (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <div className="h-24 w-16 sm:h-20 sm:w-14 bg-muted rounded overflow-hidden relative shrink-0">
                          {order.newspaper?.coverImage && (
                            <Image
                              src={order.newspaper.coverImage}
                              alt={order.newspaper.issueNumber || "Journal"}
                              layout="fullWidth"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base truncate">
                              {order.newspaper?.issueNumber || "Journal"}
                            </h4>
                            <Badge variant={cfg.variant} className="gap-1 text-xs">
                              {cfg.icon}
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {order.newspaper?.organization?.name ||
                              "Éditeur inconnu"}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1 sm:gap-x-4 sm:gap-y-1 text-xs text-muted-foreground mt-2 sm:mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>
                                Acheté le {formatOrderDate(order.createdAt)}
                              </span>
                            </div>
                            {order.newspaper?.publishDate && (
                              <span>
                                Paru le{" "}
                                {formatOrderDate(order.newspaper.publishDate)}
                              </span>
                            )}
                            <span className="font-semibold text-foreground text-sm sm:text-xs mt-1 sm:mt-0">
                              {order.price} XAF
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:shrink-0">
                        {status === "completed" && order.newspaperId && (
                          <Button
                            asChild
                            size="sm"
                            className="w-full sm:w-auto gap-2"
                          >
                            <Link
                              to="/newspapers/$newspaperId/render"
                              params={{ newspaperId: order.newspaperId }}
                            >
                              <BookOpen className="h-4 w-4" />
                              Lire le journal
                            </Link>
                          </Button>
                        )}
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <Link
                            to="/newspapers/$newspaperId"
                            params={{ newspaperId: order.newspaperId }}
                          >
                            <Eye data-icon="inline-start" />
                            Voir le journal
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage de {startIndex + 1} à{" "}
                    {Math.min(endIndex, filteredOrders.length)} sur{" "}
                    {filteredOrders.length} résultat
                    {filteredOrders.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, arr) => {
                        const prevPage = arr[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-muted-foreground">
                                ...
                              </span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => goToPage(page)}
                              className="min-w-9"
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
