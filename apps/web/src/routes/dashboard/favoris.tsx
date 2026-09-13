import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kioskfy/ui";
import { useFavorites } from "@/hooks/use-favorites-list.hook";
import { NewspaperCard } from "@/components/home/newspaper-card";

export const Route = createFileRoute("/dashboard/favoris")({
  component: FavorisPage,
});

function FavorisPage() {
  const { favorites, favoritesLoading, favoritesError } = useFavorites();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500" />
          Mes favoris
        </h1>
        <p className="text-muted-foreground mt-1">
          Retrouvez tous les journaux que vous avez ajoutés à vos favoris
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {favorites.length} {favorites.length <= 1 ? "favori" : "favoris"}
          </CardTitle>
          <CardDescription>
            Cliquez sur le cœur pour retirer un journal de vos favoris
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favoritesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : favoritesError ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">
                Une erreur est survenue lors du chargement de vos favoris.
              </p>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-xl mb-2">Aucun favori</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Vous n&apos;avez pas encore ajouté de journaux à vos favoris.
                Parcourez notre catalogue et cliquez sur le cœur pour
                sauvegarder vos journaux préférés.
              </p>
              <Button asChild size="lg">
                <Link to="/newspapers">Découvrir les journaux</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {favorites.map((fav) => (
                <NewspaperCard key={fav.id} newspaper={fav.newspaper} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
