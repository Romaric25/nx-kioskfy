import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { CountryPage } from "@/components/countries/country-page";
import { NewspaperCardSkeleton } from "@/components/home/newspaper-card-skeleton";
import type { CountryItem } from "@kioskfy/types";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/countries/$countrySlug")({
  component: CountryDetailPage,
  loader: async ({ params }: { params: { countrySlug: string } }) => {
    const { countrySlug } = params;
    try {
      const country = (await api.countries.getBySlug(
        countrySlug,
      )) as CountryItem | null;
      return { country: country ?? null, slug: countrySlug };
    } catch {
      return { country: null, slug: countrySlug };
    }
  },
  head: ({ loaderData }) => {
    const country = loaderData?.country;
    const slug = loaderData?.slug ?? "";
    const countryName = country?.name || slug;

    const description = `Découvrez tous les journaux et magazines du ${countryName} sur kioskfy. Accédez à la presse locale et internationale en illimité.`;

    return {
      meta: [
        { title: `Presse ${countryName} | kioskfy - Journaux et Magazines` },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "fr_FR" },
        { property: "og:url", content: `${baseUrl}/countries/${slug}` },
        { property: "og:title", content: `Presse ${countryName} | kioskfy` },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "kioskfy" },
        {
          property: "og:image",
          content: country?.flag || "/og-image.jpg",
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content: `Presse ${countryName} sur kioskfy`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `Presse ${countryName} | kioskfy` },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "/og-image.jpg" },
      ],
      links: [{ rel: "canonical", href: `${baseUrl}/countries/${slug}` }],
    };
  },
});

function CountryPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <NewspaperCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CountryDetailPage() {
  const { countrySlug } = Route.useParams();

  return (
    <Suspense fallback={<CountryPageSkeleton />}>
      <CountryPage slug={countrySlug} />
    </Suspense>
  );
}
