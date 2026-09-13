import { Image } from "@unpic/react";
import { Link } from "@tanstack/react-router";
import { Badge, Button } from "@kioskfy/ui";
import { Calendar, Eye } from "lucide-react";
import type { NewspaperItem } from "@kioskfy/types";

interface NewspaperCardProps {
  newspaper: NewspaperItem;
  /** When true, links point to the magazine pages (/magazines/:id). */
  magazine?: boolean;
}

export function NewspaperCard({ newspaper, magazine = false }: NewspaperCardProps) {
  const title = newspaper.issueNumber;
  const agencyName = newspaper.organization?.name || "";
  const date = new Date(newspaper.publishDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const price = `${parseFloat(newspaper.price).toLocaleString("fr-FR")} XAF`;
  const coverImage = newspaper.coverImage || "";

  const detailLink = magazine
    ? ({ to: "/magazines/$magazineId", params: { magazineId: newspaper.id } } as const)
    : ({
        to: "/newspapers/$newspaperId",
        params: { newspaperId: newspaper.id },
      } as const);

  return (
    <article className="group relative flex flex-col gap-4">
      {/* Cover area with 3D effect */}
      <div className="relative aspect-[3/4] w-full [perspective:1000px]">
        <Link {...detailLink} className="block h-full w-full">
          <div className="relative h-full w-full transition-all duration-500 ease-out [transform-style:preserve-3d] group-hover:-translate-y-2 group-hover:[transform:rotateX(5deg)] group-hover:shadow-2xl rounded-lg">
            {/* Realistic drop shadow */}
            <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 blur-xl rounded-[100%] transition-all duration-500 group-hover:bg-black/30 group-hover:blur-2xl" />

            {/* Image container */}
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-background border border-border/40 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              {/* Country badge */}
              {newspaper.country && (
                <div className="absolute top-3 left-3 z-20">
                  <Badge
                    variant="secondary"
                    className="bg-white/90 dark:bg-black/80 backdrop-blur shadow-sm border-0 gap-1.5 pl-1.5 pr-2.5 h-7"
                  >
                    {newspaper.country.flag && (
                      <Image
                        src={newspaper.country.flag}
                        alt={newspaper.country.name || "Pays"}
                        width={16}
                        height={16}
                        className="rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium text-xs text-foreground/80">
                      {newspaper.country.name}
                    </span>
                  </Badge>
                </div>
              )}

              {/* Price badge */}
              <div className="absolute bottom-3 right-3 z-20">
                <Badge className="bg-primary hover:bg-primary shadow-lg border-0 h-8 px-3 text-sm font-bold">
                  {price}
                </Badge>
              </div>

              {coverImage ? (
                <>
                  <Image
                    src={coverImage}
                    alt={`Couverture ${title}`}
                    layout="fullWidth"
                    className="object-cover w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-105"
                  />
                  {/* Glass sheen effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4 text-center">
                  <span className="text-sm font-medium">
                    Couverture non disponible
                  </span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full h-10 w-10 p-0 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                  title="Voir le journal"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Info below the card */}
      <div className="space-y-1.5 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <Link {...detailLink} className="block">
              <h3 className="font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {agencyName}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground font-medium line-clamp-1">
              {title}
            </p>
          </div>
        </div>

        <div className="flex items-center text-xs text-muted-foreground/80 font-medium">
          <Calendar className="mr-1.5 h-3 w-3" />
          {date}
        </div>
      </div>
    </article>
  );
}
