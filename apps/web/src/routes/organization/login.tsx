import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/organization/login")({
  component: () => <ComingSoon title="Connexion organisation" />,
});
