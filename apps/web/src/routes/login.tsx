import { useEffect } from "react";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { getSessionUser, useSession } from "@kioskfy/auth-client";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  // Block access on client-side navigations when a session already exists.
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const user = await getSessionUser();
      if (user) {
        throw redirect({ to: "/" });
      }
    }
  },
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Connexion | kioskfy" },
      { name: "description", content: "Connexion - kioskfy" },
      { name: "robots", content: "index, follow, nocache" },
      {
        name: "googlebot",
        content:
          "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1",
      },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useSession();

  // Covers hard page loads (SSR can't read the session cookie): redirect
  // once the session resolves on the client.
  useEffect(() => {
    if (user) {
      navigate({ to: "/", replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        <div className="mx-auto w-full max-w-md">
          <Suspense fallback={<div>Chargement...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg space-y-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Bienvenue sur <span className="text-primary">kioskfy.com</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Accédez à tous vos journaux et magazines africains préférés en un
            seul endroit.
          </p>
        </div>
      </div>
    </div>
  );
}
