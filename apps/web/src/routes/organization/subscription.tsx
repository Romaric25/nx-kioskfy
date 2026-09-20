import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";
import { PartnershipForm } from "@/components/partnership/partnership-form";
import {
  Globe,
  TrendingUp,
  Users,
  Shield,
  BarChart,
  Zap,
} from "lucide-react";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

const BENEFITS = [
  {
    icon: Globe,
    title: "Distribution mondiale",
    description: "Vos publications accessibles dans 54 pays africains.",
  },
  {
    icon: TrendingUp,
    title: "Monétisation optimisée",
    description: "Partage de revenus équitable et transparent.",
  },
  {
    icon: Users,
    title: "Audience qualifiée",
    description: "Des lecteurs engagés à travers le continent.",
  },
  {
    icon: Shield,
    title: "Protection du contenu",
    description: "Sécurisez vos publications contre le piratage.",
  },
  {
    icon: BarChart,
    title: "Analytics détaillés",
    description: "Suivez vos ventes et performances en temps réel.",
  },
  {
    icon: Zap,
    title: "Publication instantanée",
    description: "Vos titres disponibles dès leur sortie.",
  },
];

export const Route = createFileRoute("/organization/subscription")({
  component: SubscriptionPage,
  head: () => ({
    meta: [
      {
        title: "Souscription partenaire | kioskfy - Devenez éditeur partenaire",
      },
      {
        name: "description",
        content:
          "Créez votre compte partenaire kioskfy et distribuez vos journaux et magazines à des milliers de lecteurs à travers l'Afrique.",
      },
      { property: "og:title", content: "Souscription partenaire | kioskfy" },
      { property: "og:site_name", content: "kioskfy" },
      { property: "og:url", content: `${baseUrl}/organization/subscription` },
      { property: "og:locale", content: "fr_FR" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "canonical", href: `${baseUrl}/organization/subscription` },
    ],
  }),
});

function SubscriptionPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="container relative mx-auto px-4 py-12 md:py-16 text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Devenez <span className="text-primary">partenaire</span> kioskfy
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Créez votre compte éditeur et distribuez vos journaux et
              magazines à des milliers de lecteurs à travers l&apos;Afrique.
            </p>
          </div>
        </section>

        {/* Form + Benefits */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Form */}
            <div>
              <PartnershipForm />
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">
                Les avantages de devenir partenaire
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {BENEFITS.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-xl border border-border/40 bg-card/50 p-5 space-y-3 hover:border-primary/40 hover:shadow-lg transition-all"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
