import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/organization/subscription")({
  component: () => <ComingSoon title="Abonnement partenaire" />,
});
