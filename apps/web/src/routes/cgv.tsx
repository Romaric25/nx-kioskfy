import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/cgv")({
  component: () => <ComingSoon title="Conditions Générales de Vente" />,
});
