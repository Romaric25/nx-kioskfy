import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Building2, MapPin } from "lucide-react";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";
import { api } from "@/lib/api";
import type { OrganizationItem } from "@kioskfy/types";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/agencies/")({
  component: AgenciesPage,
  loader: async () => {
    try {
      return ((await api.organizations.getAll()) ?? []) as OrganizationItem[];
    } catch {
      return [] as OrganizationItem[];
    }
  },
  head: () => ({
    meta: [
      {
        title:
          "Agences partenaires | kioskfy - Votre kiosque numérique de presse africaine",
      },
      {
        name: "description",
        content:
          "Découvrez toutes les agences de presse partenaires de kioskfy et leurs publications.",
      },
      { property: "og:title", content: "Agences partenaires | kioskfy" },
      { property: "og:site_name", content: "kioskfy" },
      { property: "og:url", content: `${baseUrl}/agencies` },
      { property: "og:locale", content: "fr_FR" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: `${baseUrl}/agencies` }],
  }),
});

function AgenciesPage() {
  const agencies = Route.useLoaderData();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="container mx-auto py-10 px-4">
          <div className="mb-10 text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Nos agences <span className="text-primary">partenaires</span>
            </h1>
            <p className="text-muted-foreground">
              Découvrez les agences de presse qui publient sur kioskfy
            </p>
          </div>

          {agencies.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Aucune agence disponible pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agencies.map((agency) => (
                <Link
                  key={agency.id}
                  to="/agencies/$agencySlug"
                  params={{ agencySlug: agency.slug }}
                  className="group flex items-center gap-4 rounded-xl border border-border/40 bg-background p-5 transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden border border-border bg-muted/40">
                    {agency.logo ? (
                      <Image
                        src={agency.logo}
                        alt={`Logo ${agency.name}`}
                        layout="fullWidth"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h2 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {agency.name}
                    </h2>
                    {agency.country && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{agency.country}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
