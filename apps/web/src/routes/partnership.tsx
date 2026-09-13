import { createFileRoute } from "@tanstack/react-router";
import { Partnership } from "@/components/partnership";

const baseUrl = import.meta.env.VITE_APP_URL || "https://kioskfy.com";

export const Route = createFileRoute("/partnership")({
  component: PartnershipPage,
  head: () => ({
    meta: [
      { title: "Partenariat | kioskfy" },
      { name: "description", content: "Partenariat - kioskfy" },
    ],
    links: [{ rel: "canonical", href: `${baseUrl}/partnership` }],
  }),
});

function PartnershipPage() {
  return <Partnership />;
}
