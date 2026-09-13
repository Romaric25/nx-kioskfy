import { createFileRoute } from "@tanstack/react-router";
import { SettingsOrganization } from "@/components/labo/settings-organization";

export const Route = createFileRoute("/organization/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return <SettingsOrganization />;
}
