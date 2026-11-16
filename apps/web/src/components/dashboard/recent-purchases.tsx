import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  formatCurrency,
} from "@kioskfy/ui";
import { useMyOrders, type MyOrder } from "@/hooks/use-orders.hook";

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

/** Derniers journaux achetés par l'utilisateur sur son dashboard. */
export function RecentPurchases() {
  const { data: orders, isLoading } = useMyOrders();

  const recentOrders = (orders ?? []).slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Mes achats récents</CardTitle>
            <CardDescription>
              Les derniers journaux que vous avez achetés
            </CardDescription>
          </div>
          {(orders?.length ?? 0) > 0 && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Link to="/dashboard/achats">
                Voir tous mes achats
                <ArrowUpRight data-icon="inline-start" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Aucun achat</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm">
              Vous n&apos;avez pas encore acheté de journaux. Parcourez le
              catalogue pour découvrir les dernières éditions.
            </p>
            <Button asChild>
              <Link to="/newspapers">Découvrir les journaux</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: MyOrder) => {
              const status = order.status || "pending";
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="h-20 w-14 bg-muted rounded overflow-hidden shrink-0">
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
                      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          Acheté le {formatOrderDate(order.createdAt)}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(order.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 sm:shrink-0">
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
                          Lire
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
                        Voir
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
