import { useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
  Loader2,
  Newspaper,
  MapPin,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@kioskfy/ui";
import { useOrganizationBySlug } from "@/hooks/use-organizations.hook";
import { useInfiniteNewspapersByOrganization } from "@/hooks/use-newspapers.hook";
import { NewspaperCard } from "@/components/home/newspaper-card";
import { NewspaperCardSkeleton } from "@/components/home/newspaper-card-skeleton";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";

interface AgencyPageProps {
  slug: string;
}

export function AgencyPage({ slug }: AgencyPageProps) {
  const { organization, organizationLoading, organizationError } =
    useOrganizationBySlug(slug);
  const organizationId = organization?.id ?? "";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: newspapersLoading,
  } = useInfiniteNewspapersByOrganization(organizationId, { limit: 12 });

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const newspapers = data?.pages.flatMap((page) => page.data) ?? [];

  if (organizationLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <NewspaperCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (organizationError || !organization) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <div className="bg-muted/30 rounded-lg max-w-md mx-auto p-6">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold mb-2">Agence introuvable</h2>
          <p className="text-muted-foreground">
            Cette agence n&apos;existe pas ou a été supprimée.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/agencies">
              <ArrowLeft data-icon="inline-start" />
              Toutes les agences
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SiteBreadcrumb
        items={[
          { label: "Agences", href: "/agencies" },
          { label: organization.name },
        ]}
      />

      {/* Agency header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
        <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full overflow-hidden border-2 border-border bg-background shadow-md">
          {organization.logo ? (
            <Image
              src={organization.logo}
              alt={`Logo ${organization.name}`}
              layout="fullWidth"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-muted/40">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {organization.name}
          </h1>
          {organization.country && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {organization.country}
            </div>
          )}
          {organization.description && (
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {organization.description}
            </p>
          )}
        </div>
      </div>

      {/* Newspapers section */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-7 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Les publications
          </h2>
        </div>
        <p className="text-muted-foreground mt-2 ml-4 pl-3 border-l border-border">
          Toutes les éditions publiées par {organization.name}
        </p>
      </div>

      {newspapersLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <NewspaperCardSkeleton key={i} />
          ))}
        </div>
      ) : newspapers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-6">
            <Newspaper className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Aucune publication
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Cette agence n&apos;a pas encore publié d&apos;éditions.
          </p>
          <Button asChild>
            <Link to="/newspapers">Découvrir d&apos;autres journaux</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {newspapers.map((newspaper) => (
              <NewspaperCard key={newspaper.id} newspaper={newspaper} />
            ))}
          </div>

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </div>
            )}
            {!hasNextPage && newspapers.length > 0 && (
              <p className="text-muted-foreground text-sm">
                Vous avez vu toutes les publications de cette agence
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
