import { useEffect } from "react";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { getSessionUser, useSession } from "@kioskfy/auth-client";
import { Button } from "@kioskfy/ui";
import { Loader2, Lock, BookOpen, ShoppingCart } from "lucide-react";
import { NewspaperPdfViewer } from "@/components/newspapers/newspaper-pdf-viewer";
import { useHasPurchased } from "@/hooks/use-has-purchased.hook";
import { useMyOrders } from "@/hooks/use-orders.hook";

export const Route = createFileRoute("/magazines/$magazineId/render")({
  // Block access on client-side navigations when no session exists.
  beforeLoad: async ({ params }) => {
    if (typeof window !== "undefined") {
      const user = await getSessionUser();
      if (!user) {
        throw redirect({
          to: "/login",
          search: {
            redirect: `/magazines/${params.magazineId}/render`,
          } as never,
        });
      }
    }
  },
  component: RenderMagazinePage,
  head: () => ({
    meta: [
      { title: "Lecture du magazine | kioskfy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function RenderMagazinePage() {
  const { magazineId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useSession();
  const { hasPurchased, isCheckingPurchase } = useHasPurchased(magazineId);
  const { data: myOrders } = useMyOrders();

  // Commande non payée existante (en attente ou échouée) pour ce magazine :
  // on propose de la payer au lieu d'acheter une seconde fois.
  const hasPendingOrder = !!myOrders?.some(
    (order) =>
      order.newspaperId === magazineId &&
      (order.status === "pending" || order.status === "failed"),
  );

  // Covers hard page loads (SSR can't read the session cookie): redirect
  // once the session resolves on the client.
  useEffect(() => {
    if (!isLoading && !user) {
      navigate({
        to: "/login",
        search: { redirect: `/magazines/${magazineId}/render` } as never,
        replace: true,
      });
    }
  }, [isLoading, user, navigate, magazineId]);

  if (isLoading || !user || isCheckingPurchase) {
    return <FullPageLoader />;
  }

  if (!hasPurchased) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative bg-muted rounded-full p-6 inline-flex">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {hasPendingOrder
                ? "Commande en attente de paiement"
                : "Achat requis"}
            </h1>
            <p className="text-muted-foreground">
              {hasPendingOrder
                ? "Ce magazine n'est pas encore payé. Rendez-vous dans votre espace membre pour finaliser le paiement, puis revenez lire l'édition."
                : "Ce magazine n'est pas encore dans votre bibliothèque. Achetez l'édition pour la lire en illimité."}
            </p>
          </div>
          {hasPendingOrder ? (
            <Button asChild size="lg" className="gap-2">
              <Link to="/dashboard/achats">
                <ShoppingCart className="h-4 w-4" />
                Payer ma commande
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="gap-2">
              <Link to="/magazines/$magazineId" params={{ magazineId }}>
                <BookOpen className="h-4 w-4" />
                Acheter l'édition
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <NewspaperPdfViewer newspaperId={magazineId} back="/dashboard/achats" />
  );
}
