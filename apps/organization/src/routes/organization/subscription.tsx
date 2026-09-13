import { createFileRoute } from "@tanstack/react-router";
import { PartnershipForm } from "@/components/labo/partnership-form";

export const Route = createFileRoute("/organization/subscription")({
  component: SubscriptionPage,
  head: () => ({
    meta: [
      { title: "Devenir partenaire | kioskfy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function SubscriptionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <PartnershipForm />
    </div>
  );
}
