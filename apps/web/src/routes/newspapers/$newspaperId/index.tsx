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

const baseUrl = "https://www.kioskfy.com";

export const Route = createFileRoute("/newspapers/$newspaperId/")({
  component: NewspaperDetailPage,
  loader: async ({ params }: { params: { newspaperId: string } }) => {
    try {
      const newspaper = (await api.newspapers.getById(
        params.newspaperId,
      )) as NewspaperDetail | null;
      return newspaper ?? null;
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
          content: `${baseUrl}/newspapers/${item.id || ""}`,
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
        { rel: "canonical", href: `${baseUrl}/newspapers/${item.id || ""}` },
      ],
    };
  },
});

function NewspaperDetailPage() {
  const newspaper = Route.useLoaderData();
  const { newspaperId: id } = Route.useParams();

  if (!newspaper) {
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
    name: `${newspaper.organization?.name || "Journal"} - N°${newspaper.issueNumber}`,
    description: `Numéro ${newspaper.issueNumber} du ${newspaper.organization?.name || "journal"} paru le ${new Date(newspaper.publishDate).toLocaleDateString("fr-FR")}`,
    image: newspaper.coverImage || `${baseUrl}/og-image.jpg`,
    brand: newspaper.organization?.name || "kioskfy",
    price: newspaper.price,
    currency: "XOF",
    availability: "InStock",
    url: `${baseUrl}/newspapers/${id}`,
  });

  const articleSchema = generateNewsArticleSchema({
    headline: `${newspaper.organization?.name || "Journal"} - N°${newspaper.issueNumber}`,
    description: `Édition numérique du ${newspaper.organization?.name || "journal"}`,
    image: newspaper.coverImage || `${baseUrl}/og-image.jpg`,
    datePublished: new Date(newspaper.publishDate).toISOString(),
    author: {
      name: newspaper.organization?.name || "kioskfy",
      url: `${baseUrl}/organization/${newspaper.organization?.slug || ""}`,
    },
    publisher: {
      name: "kioskfy",
      logo: `${baseUrl}/logo.png`,
    },
    url: `${baseUrl}/newspapers/${id}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Journaux", url: "/newspapers" },
    { name: newspaper.issueNumber || "Publication", url: `/newspapers/${id}` },
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
