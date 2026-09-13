import { NewspaperCard } from "./newspaper-card";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@kioskfy/ui";
import { usePublishedMagazines } from "@/hooks/use-home.hooks";

export function RecentMagazines() {
  const { magazines, magazinesLoading } = usePublishedMagazines();

  return (
    <Section
      title="Magazines récemment sortis"
      description="Découvrez les magazines les plus récemment sortis."
      action={{ label: "Voir tout", href: "/magazines" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {magazinesLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[70%]" />
                <Skeleton className="h-4 w-[40%]" />
              </div>
            </div>
          ))
        ) : magazines.length > 0 ? (
          magazines.slice(0, 6).map((magazine) => (
            <NewspaperCard key={magazine.id} newspaper={magazine} />
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Aucun magazine disponible pour le moment.
          </div>
        )}
      </div>
    </Section>
  );
}
