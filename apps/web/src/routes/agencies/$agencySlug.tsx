import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";
import { AgencyPage } from "@/components/agencies/agency-page";
import { api } from "@/lib/api";
import type { OrganizationItem } from "@kioskfy/types";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/agencies/$agencySlug")({
  component: AgencyDetailPage,
  loader: async ({ params }: { params: { agencySlug: string } }) => {
    try {
      const agency = (await api.organizations.getBySlug(
        params.agencySlug,
      )) as OrganizationItem | null;
      return agency ?? null;
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    const agency = loaderData;
    const slug = (agency?.slug as string) || "";

    if (!agency) {
      return {
        meta: [
          { title: "Agence introuvable | kioskfy" },
          {
            name: "description",
            content: "Cette agence n'existe pas ou a été supprimée.",
          },
        ],
      };
    }

    const title = `${agency.name} | kioskfy - Presse et publications`;
    const description =
      agency.description ||
      `Découvrez les journaux et magazines publiés par ${agency.name} sur kioskfy.`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "kioskfy" },
        { property: "og:url", content: `${baseUrl}/agencies/${slug}` },
        { property: "og:image", content: agency.logo || "/og-image.jpg" },
        { property: "og:locale", content: "fr_FR" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: `${baseUrl}/agencies/${slug}` }],
    };
  },
});

function AgencyDetailPage() {
  const { agencySlug } = Route.useParams();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <AgencyPage slug={agencySlug} />
      </main>
      <Footer />
    </>
  );
}
