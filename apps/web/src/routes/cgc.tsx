import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/cgc")({
  component: CgcPage,
  head: () => ({
    meta: [
      { title: "Conditions Générales | kioskfy" },
      {
        name: "description",
        content: "Conditions générales d'utilisation de kioskfy.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: `${baseUrl}/cgc` }],
  }),
});

function CgcPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-16 px-4 max-w-3xl">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary mb-8 inline-block"
          >
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold mb-6">
            Conditions Générales de Kioskfy
          </h1>
          <div className="prose dark:prose-invert max-w-none">
            <p>
              Page en construction. Les conditions générales seront disponibles
              prochainement.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
