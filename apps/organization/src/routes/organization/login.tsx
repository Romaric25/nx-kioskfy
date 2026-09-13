import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/labo/login-form";

export const Route = createFileRoute("/organization/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Connexion Partenaire | kioskfy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LoginPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <LoginForm redirectDefault="/organization/dashboard" />
    </div>
  );
}
