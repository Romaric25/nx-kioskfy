import { createFileRoute } from "@tanstack/react-router";
import { OrganizationsList } from "@/components/labo/organizations-list";

export const Route = createFileRoute("/organization/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <OrganizationsList />
    </div>
  );
}
