import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/confidentialite")({
  component: () => <ComingSoon title="Politique de confidentialité" />,
});
