import { useEffect } from "react";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { getSessionUser, useSession } from "@kioskfy/auth-client";
import { Button } from "@kioskfy/ui";
import { Loader2, Lock, BookOpen } from "lucide-react";
import { NewspaperPdfViewer } from "@/components/newspapers/newspaper-pdf-viewer";
import { useHasPurchased } from "@/hooks/use-has-purchased.hook";

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
            <h1 className="text-2xl font-bold">Achat requis</h1>
            <p className="text-muted-foreground">
              Ce magazine n&apos;est pas encore dans votre bibliothèque. Achetez
              l&apos;édition pour la lire en illimité.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/magazines/$magazineId" params={{ magazineId }}>
              <BookOpen className="h-4 w-4" />
              Voir le magazine
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <NewspaperPdfViewer newspaperId={magazineId} back="/dashboard/achats" />
  );
}
