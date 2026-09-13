import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { SingleNewspaper } from "@/components/newspapers/single-newspaper";
import { api } from "@/lib/api";
import type { NewspaperDetail } from "@/hooks/use-newspapers.hook";
import {
  JsonLd,
  generateProductSchema,
  generateNewsArticleSchema,
  generateBreadcrumbSchema,
} from "@/components/seo/json-ld";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/magazines/$magazineId/")({
  component: MagazineDetailPage,
  loader: async ({ params }: { params: { magazineId: string } }) => {
    try {
      const magazine = (await api.newspapers.getById(
        params.magazineId,
      )) as NewspaperDetail | null;
      return magazine ?? null;
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    const item = loaderData;

    if (!item) {
      return {
        meta: [
          { title: "Publication introuvable | kioskfy" },
          {
            name: "description",
            content: "Cette publication n'existe pas ou a été supprimée.",
          },
        ],
      };
    }

    const orgName = item.organization?.name || "Éditeur inconnu";
    const countryName = item.country?.name || "";
    const publishDate = new Date(item.publishDate).toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

    const title = `${orgName} - ${item.issueNumber}`;
    const description = `Lisez le numéro ${item.issueNumber} du ${orgName} (${countryName}) paru le ${publishDate}. Disponible en lecture numérique immédiate sur kioskfy.`;

    let coverUrl = item.coverImage;
    if (coverUrl) {
      coverUrl = coverUrl
        .replace("/thumbnails/", "/")
        .replace("-thumb.webp", ".webp");
    }
    const ogImage = !coverUrl
      ? `${baseUrl}/og-image.jpg`
      : coverUrl.startsWith("http")
        ? coverUrl
        : `${baseUrl}${coverUrl.startsWith("/") ? "" : "/"}${coverUrl}`;

    const keywords = [
      orgName,
      item.issueNumber,
      countryName,
      "presse africaine",
      "kiosque numérique",
      "magazine",
      "journal",
    ];

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: keywords.join(", ") },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "kioskfy" },
        {
          property: "og:url",
          content: `${baseUrl}/magazines/${item.id || ""}`,
        },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: title },
        { property: "og:type", content: "article" },
        {
          property: "og:article:published_time",
          content: new Date(item.publishDate).toISOString(),
        },
        { property: "og:article:section", content: "Presse" },
        { property: "og:locale", content: "fr_FR" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:creator", content: "@kioskfy" },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow, nocache" },
        {
          name: "googlebot",
          content:
            "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1",
        },
      ],
      links: [
        { rel: "canonical", href: `${baseUrl}/magazines/${item.id || ""}` },
      ],
    };
  },
});

function MagazineDetailPage() {
  const magazine = Route.useLoaderData();
  const { magazineId: id } = Route.useParams();

  if (!magazine) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-16 text-center">
          <h1 className="text-2xl font-bold">Publication introuvable</h1>
          <p className="text-muted-foreground mt-2">
            Cette publication n&apos;existe pas ou a été supprimée.
          </p>
        </div>
      </>
    );
  }

  const productSchema = generateProductSchema({
    name: `${magazine.organization?.name || "Magazine"} - N°${magazine.issueNumber}`,
    description: `Numéro ${magazine.issueNumber} du ${magazine.organization?.name || "magazine"} paru le ${new Date(magazine.publishDate).toLocaleDateString("fr-FR")}`,
    image: magazine.coverImage || `${baseUrl}/og-image.jpg`,
    brand: magazine.organization?.name || "kioskfy",
    price: magazine.price,
    currency: "XOF",
    availability: "InStock",
    url: `${baseUrl}/magazines/${id}`,
  });

  const articleSchema = generateNewsArticleSchema({
    headline: `${magazine.organization?.name || "Magazine"} - N°${magazine.issueNumber}`,
    description: `Édition numérique du ${magazine.organization?.name || "magazine"}`,
    image: magazine.coverImage || `${baseUrl}/og-image.jpg`,
    datePublished: new Date(magazine.publishDate).toISOString(),
    author: {
      name: magazine.organization?.name || "kioskfy",
      url: `${baseUrl}/organization/${magazine.organization?.slug || ""}`,
    },
    publisher: {
      name: "kioskfy",
      logo: `${baseUrl}/logo.png`,
    },
    url: `${baseUrl}/magazines/${id}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Magazines", url: "/magazines" },
    { name: magazine.issueNumber || "Publication", url: `/magazines/${id}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={productSchema} />
      <JsonLd data={articleSchema} />

      <Header />
      <SingleNewspaper id={id} />
    </>
  );
}
