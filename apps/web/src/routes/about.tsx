import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";
import { Newspaper, Globe2, ShieldCheck } from "lucide-react";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      {
        title: "À propos | kioskfy - Votre kiosque numérique de presse africaine",
      },
      {
        name: "description",
        content:
          "kioskfy est le kiosque numérique qui donne accès à la presse africaine : journaux et magazines de nos pays partenaires, en lecture illimitée.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "À propos | kioskfy" },
      {
        property: "og:description",
        content:
          "Découvrez kioskfy, le kiosque numérique de la presse africaine.",
      },
      { property: "og:url", content: `${baseUrl}/about` },
      { property: "og:site_name", content: "kioskfy" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fr_FR" },
    ],
    links: [{ rel: "canonical", href: `${baseUrl}/about` }],
  }),
});

const FEATURES = [
  {
    icon: Newspaper,
    title: "Toute la presse africaine",
    description:
      "Journaux quotidiens, hebdomadaires et magazines de nos pays partenaires, réunis en un seul endroit.",
  },
  {
    icon: Globe2,
    title: "Disponible partout",
    description:
      "Lisez vos éditions préférées où que vous soyez, sur ordinateur, tablette ou mobile.",
  },
  {
    icon: ShieldCheck,
    title: "Éditeurs rémunérés",
    description:
      "Chaque achat soutient directement les agences de presse et les éditeurs partenaires.",
  },
];

function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="container relative mx-auto px-4 py-16 md:py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Le kiosque numérique de la{" "}
              <span className="text-primary">presse africaine</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              kioskfy rassemble les journaux et magazines d&apos;Afrique pour
              vous offrir une lecture illimitée, tout en garantissant une
              juste rémunération aux éditeurs partenaires.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto space-y-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Notre mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Rendre la presse africaine accessible à tous, partout dans le
              monde. Nous travaillons main dans la main avec les agences de
              presse et les éditeurs du continent pour distribuer leurs
              publications en toute légalité et valoriser leur travail.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border/40 bg-background p-6 space-y-3 hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center space-y-4">
            <p className="text-muted-foreground">
              Prêt à découvrir la presse africaine ?
            </p>
            <Link
              to="/newspapers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Explorer les journaux
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
