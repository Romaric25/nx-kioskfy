import { createFileRoute, Link } from "@tanstack/react-router";
import { AllNewspapersPublished } from "@/components/newspapers/all-newspapers-published";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { CategoriesSection } from "@/components/home/categories-section";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";
import { SearchBar } from "@/components/search-bar";
import { GridSkeleton } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { Suspense } from "react";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/newspapers/")({
  component: NewspapersPage,
  loader: async () => {
    try {
      const [countries, organizations] = await Promise.all([
        api.countries.getAll(),
        api.organizations.getAll(),
      ]);
      return { countries: countries ?? [], organizations: organizations ?? [] };
    } catch {
      return { countries: [], organizations: [] };
    }
  },
  head: ({ loaderData }) => {
    const countries = (loaderData?.countries ?? []) as { name: string }[];
    const organizations = (loaderData?.organizations ?? []) as {
      name: string;
    }[];

    const countryNames = countries.map((c) => c.name).join(", ");
    const orgNames = organizations.map((o) => o.name).join(", ");

    const description = `Accédez à tous les journaux quotidiens et hebdomadaires d'Afrique sur kioskfy. Lisez la presse de nos pays partenaires : ${countryNames}. Retrouvez les publications de : ${orgNames} et bien plus en illimité.`;

    const keywords = [
      "journaux",
      "presse quotidienne",
      "actualités",
      "kiosque numérique",
      "presse afrique",
      ...countries.map((c) => `presse ${c.name.toLowerCase()}`),
      ...countries.map((c) => `journaux ${c.name.toLowerCase()}`),
      ...organizations.map((o) => o.name.toLowerCase()),
    ];

    return {
      meta: [
        {
          title:
            "Journaux | kioskfy - Votre kiosque numérique de presse africaine",
        },
        { name: "description", content: description },
        { name: "keywords", content: keywords.join(", ") },
        {
          property: "og:title",
          content: "Journaux | kioskfy - Toute la presse africaine",
        },
        { property: "og:description", content: description },
        { property: "og:url", content: `${baseUrl}/newspapers` },
        { property: "og:site_name", content: "kioskfy" },
        { property: "og:image", content: "/og-image.jpg" },
        { property: "og:locale", content: "fr_FR" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Journaux | kioskfy - Votre kiosque numérique",
        },
        { name: "twitter:description", content: description },
        { name: "robots", content: "index, follow, nocache" },
      ],
      links: [{ rel: "canonical", href: `${baseUrl}/newspapers` }],
    };
  },
});

function NewspapersPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="container mx-auto px-4 pt-4">
          <SiteBreadcrumb />
        </div>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />

          <div className="relative container mx-auto px-4 py-4 md:py-6 flex flex-col items-start gap-6">
            <CategoriesSection />
            <Suspense>
              <SearchBar className="w-full max-w-md" />
            </Suspense>
          </div>
        </section>

        {/* Newspapers Grid Section */}
        <section className="container mx-auto px-4 py-12 md:py-4">
          <Suspense fallback={<GridSkeleton count={12} />}>
            <AllNewspapersPublished />
          </Suspense>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/40 bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Vous êtes éditeur de presse ?
              </h2>
              <p className="text-muted-foreground">
                Rejoignez notre plateforme et distribuez vos publications à des
                milliers de lecteurs à travers l&apos;Afrique.
              </p>
              <Link
                to="/partnership"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                Devenir partenaire
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
