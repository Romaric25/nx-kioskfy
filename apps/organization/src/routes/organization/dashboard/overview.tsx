import { createFileRoute } from "@tanstack/react-router";
import { OrganizationHome } from "@/components/labo/organization-home";

export const Route = createFileRoute("/organization/dashboard/overview")({
  component: OrganizationPage,
});

function OrganizationPage() {
  return (
    <div className="flex-1 space-y-4">
      <OrganizationHome />
    </div>
  );
}
