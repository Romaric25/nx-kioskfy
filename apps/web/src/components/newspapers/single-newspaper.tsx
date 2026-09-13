import { useEffect, useState } from "react";
import { Image } from "@unpic/react";
import { useLocation, useNavigate, Link } from "@tanstack/react-router";
import { useSession, initAuth } from "@kioskfy/auth-client";
import {
  Card,
  Badge,
  Button,
  Separator,
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@kioskfy/ui";
import {
  CalendarIcon,
  MapPinIcon,
  BuildingIcon,
  InfoIcon,
  AlertCircleIcon,
  ShoppingCart,
  Trash2,
  CalendarRange,
  Heart,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { API_ORIGIN } from "@/lib/api";
import { cartStore, useCartStore, type CartItem } from "@/lib/cart-store";
import { priceFormatter } from "@/lib/price-formatter";
import { FrequencyContent } from "@/components/frequency-content";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { useNewspaper } from "@/hooks/use-newspapers.hook";
import {
  useCheckFavorite,
  useToggleFavorite,
} from "@/hooks/use-favorites.hook";
import { useHasPurchased } from "@/hooks/use-has-purchased.hook";
import { NewspaperDetailSkeleton } from "./newspaper-detail-skeleton";
import { RelatedNewspapers } from "./related-newspapers";
import { CartSuccessModal } from "@/components/cart/cart-success-modal";
import { ShareMenu } from "./share-menu";

// Initialize the auth client once (client-side only).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

function formatDate(date: string | Date, format: "d MMM yyyy" | "PPP") {
  const d = new Date(date);
  if (format === "d MMM yyyy") {
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface SingleNewspaperProps {
  id: string;
}

export const SingleNewspaper = ({ id }: SingleNewspaperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { newspaper, newspaperLoading, newspaperError } = useNewspaper(id);
  const items = useCartStore();
  const { isAuthenticated } = useSession();
  const { hasPurchased, isCheckingPurchase } = useHasPurchased(id);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const inCart = newspaper
    ? items.some((item) => item.id === newspaper.id)
    : false;

  const { isFavorite } = useCheckFavorite(id, isAuthenticated);
  const toggleFavorite = useToggleFavorite();

  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCartAction = () => {
    if (!newspaper) return;
    if (inCart) {
      cartStore.removeItem(newspaper.id);
    } else {
      cartStore.addItem(newspaper as CartItem);
      setShowSuccessModal(true);
    }
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      navigate({
        to: "/login",
        search: { redirect: location.pathname } as never,
      });
      return;
    }
    if (!newspaper) return;
    toggleFavorite.mutate(newspaper.id);
  };

  const handleContinuePurchase = () => {
    setShowSuccessModal(false);
    navigate({ to: "/newspapers" });
  };

  if (newspaperLoading) {
    return <NewspaperDetailSkeleton />;
  }

  if (newspaperError) {
    return (
      <div className="container mx-auto mt-8 max-w-2xl rounded-md border border-destructive/30 bg-destructive/10 p-6">
        <div className="flex items-start gap-3">
          <AlertCircleIcon className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <h2 className="font-semibold text-destructive">Erreur</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Une erreur est survenue lors du chargement des détails du journal.
              Veuillez réessayer plus tard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!newspaper) {
    return (
      <div className="container mx-auto mt-8 max-w-2xl rounded-md border bg-muted/30 p-6">
        <div className="flex items-start gap-3">
          <AlertCircleIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Journal introuvable</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ce journal n&apos;existe pas ou a été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isMagazine = location.pathname?.includes("/magazines");
  const sectionLabel = isMagazine ? "Magazines" : "Journaux";
  const sectionHref = isMagazine ? "/magazines" : "/newspapers";

  const metadata = newspaper.organization?.metadata;
  const frequency =
    metadata && typeof metadata !== "string"
      ? (metadata as Record<string, unknown>).frequency
      : undefined;

  return (
    <div className="container mx-auto py-8 px-4">
      <SiteBreadcrumb
        items={[
          { label: sectionLabel, href: sectionHref },
          { label: newspaper.issueNumber },
        ]}
      />
      <article className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Cover Image */}
        <div className="md:col-span-5 lg:col-span-4">
          <Dialog>
            <DialogTrigger asChild className="p-0">
              <Card className="overflow-hidden border-2 shadow-lg cursor-zoom-in transition-transform hover:scale-[1.02] hover:shadow-xl group">
                <div className="relative w-full">
                  <img
                    src={newspaper.coverImage}
                    alt={`Issue #${newspaper.issueNumber}`}
                    className="w-full h-auto block transition-all group-hover:brightness-110"
                  />
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
              <DialogTitle className="sr-only">
                {newspaper.issueNumber} Cover
              </DialogTitle>
              <div className="relative w-full h-full">
                <Image
                  src={newspaper.coverImage}
                  alt={`Issue #${newspaper.issueNumber} - Full Cover`}
                  layout="fullWidth"
                  className="object-contain w-full h-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right Column: Details */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {newspaper.categories?.map((cat) => (
                <Badge key={cat.category.id} variant="outline">
                  {cat.category.name}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {newspaper.issueNumber}
            </h1>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-muted-foreground">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{formatDate(newspaper.publishDate, "d MMM yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShareMenu
                  title={newspaper.issueNumber}
                  text={`Découvrez ${newspaper.issueNumber} sur Kioskfy`}
                  url={currentUrl}
                />
                <Button
                  variant={isFavorite ? "default" : "outline"}
                  size="icon"
                  onClick={handleFavorite}
                  disabled={toggleFavorite.isPending}
                  className={`rounded-full transition-all duration-200 ${
                    isFavorite
                      ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                      : "hover:border-red-300 hover:text-red-500"
                  }`}
                  title={
                    isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                  }
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <BuildingIcon className="mr-2 h-4 w-4" />
                Agence
              </div>
              <div className="font-medium">
                {newspaper.organization?.name ?? "N/A"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                <MapPinIcon className="mr-2 h-4 w-4" />
                Pays
              </div>
              <div className="font-medium">
                {newspaper.country?.name ?? "N/A"}
              </div>
            </div>

            {typeof frequency === "string" && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center">
                  <CalendarRange className="mr-2 h-4 w-4" />
                  Fréquence
                </div>
                <div className="font-medium">
                  <FrequencyContent frequency={frequency} />
                </div>
              </div>
            )}
          </div>

          {newspaper.organization?.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <InfoIcon className="h-4 w-4" />
                  À propos de l&apos;agence
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-h-[20ch] overflow-y-auto">
                  {newspaper.organization.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="bg-muted/30 p-6 rounded-lg border">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-lg font-medium">Prix</span>
              <span className="text-3xl font-bold text-primary">
                {priceFormatter(newspaper.price)}
              </span>
            </div>

            {hasPurchased ? (
              <div className="space-y-3">
                <Button asChild size="lg" className="w-full text-lg gap-2">
                  <Link
                    to={
                      isMagazine
                        ? "/magazines/$magazineId/render"
                        : "/newspapers/$newspaperId/render"
                    }
                    params={
                      isMagazine
                        ? { magazineId: newspaper.id }
                        : { newspaperId: newspaper.id }
                    }
                  >
                    <BookOpen className="h-5 w-5" />
                    Lire le journal
                  </Link>
                </Button>
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Cette édition fait partie de vos achats
                </p>
              </div>
            ) : (
              <Button
                size="lg"
                className={`w-full text-lg ${
                  inCart ? "bg-destructive hover:bg-destructive/90" : ""
                }`}
                onClick={handleCartAction}
                disabled={isCheckingPurchase}
              >
                {inCart ? (
                  <>
                    <Trash2 data-icon="inline-start" className="h-5 w-5" />
                    Retirer du panier
                  </>
                ) : (
                  <>
                    <ShoppingCart data-icon="inline-start" className="h-5 w-5" />
                    Ajouter au panier
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </article>

      {/* Related Newspapers from same publisher */}
      {newspaper.organization?.id && (
        <RelatedNewspapers
          organizationId={newspaper.organization.id}
          organizationName={newspaper.organization.name}
          currentNewspaperId={newspaper.id}
        />
      )}

      {/* Success Modal */}
      <CartSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        newspaper={newspaper}
        onContinueShopping={handleContinuePurchase}
      />
    </div>
  );
};
