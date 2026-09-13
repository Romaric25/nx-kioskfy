import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Globe, ArrowUpRight, Settings2, Loader2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Switch,
} from "@kioskfy/ui";
import { NewspaperCard } from "@/components/home/newspaper-card";
import {
  useAllCountriesWithStatus,
  useFavoriteCountries,
  useNewspapersFromFavoriteCountries,
  useToggleFavoriteCountry,
} from "@/hooks/use-favorite-countries.hook";

function CountrySelector({ onClose }: { onClose: () => void }) {
  const { countries, isLoading } = useAllCountriesWithStatus();
  const toggle = useToggleFavoriteCountry();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {countries.map((country) => (
        <div
          key={country.id}
          className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Image
              src={country.flag}
              alt={country.name}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
            <span className="text-sm font-medium">{country.name}</span>
          </div>
          <Switch
            checked={country.isFavorite}
            onCheckedChange={() => toggle.mutate(country.id)}
            aria-label={`Suivre ${country.name}`}
          />
        </div>
      ))}
      <div className="flex justify-end pt-4">
        <Button variant="outline" size="sm" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}

export function FavoriteCountriesSection() {
  const { favoriteCountries, favoriteCountriesLoading } =
    useFavoriteCountries();
  const { newspapers, newspapersLoading } =
    useNewspapersFromFavoriteCountries();
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Show only the first 6 newspapers
  const displayedNewspapers = newspapers.slice(0, 6);

  if (favoriteCountriesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Mes pays favoris
            </CardTitle>
            <CardDescription>Journaux des pays que vous suivez</CardDescription>
          </div>
          <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Settings2 data-icon="inline-start" />
                Gérer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Gérer mes pays favoris
                </DialogTitle>
                <DialogDescription>
                  Sélectionnez les pays dont vous souhaitez suivre les journaux
                </DialogDescription>
              </DialogHeader>
              <CountrySelector onClose={() => setSelectorOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {favoriteCountries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              Aucun pays sélectionné
            </h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm">
              Sélectionnez vos pays préférés pour voir les derniers journaux de
              ces régions.
            </p>
            <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
              <DialogTrigger asChild>
                <Button>Sélectionner des pays</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Gérer mes pays favoris
                  </DialogTitle>
                  <DialogDescription>
                    Sélectionnez les pays dont vous souhaitez suivre les
                    journaux
                  </DialogDescription>
                </DialogHeader>
                <CountrySelector onClose={() => setSelectorOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorite countries badges */}
            <div className="flex flex-wrap gap-2">
              {favoriteCountries.map((country) => (
                <Badge
                  key={country.id}
                  variant="secondary"
                  className="gap-1.5 pl-1.5 pr-2.5 py-1"
                >
                  <Image
                    src={country.flag}
                    alt={country.name}
                    width={16}
                    height={16}
                    className="rounded-full object-cover"
                  />
                  {country.name}
                </Badge>
              ))}
            </div>

            {/* Newspapers from favorite countries */}
            {newspapersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayedNewspapers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun journal disponible pour vos pays favoris.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {displayedNewspapers.map((newspaper) => (
                  <NewspaperCard key={newspaper.id} newspaper={newspaper} />
                ))}
              </div>
            )}

            {newspapers.length > 6 && (
              <div className="flex justify-center pt-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/newspapers">
                    Voir plus de journaux
                    <ArrowUpRight data-icon="inline-start" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
