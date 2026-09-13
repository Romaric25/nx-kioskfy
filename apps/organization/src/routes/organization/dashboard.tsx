import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LaboSidebar } from "@/components/labo/labo-sidebar";
import { LaboHeader } from "@/components/labo/labo-header";
import { AgencyGuard } from "@/components/labo/agency-guard";
import { SidebarInset, SidebarProvider } from "@kioskfy/ui";

export const Route = createFileRoute("/organization/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <AgencyGuard>
      <SidebarProvider>
        <LaboSidebar />
        <SidebarInset>
          <LaboHeader title="Tableau de bord" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <main className="flex-1 p-4 md:p-6">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AgencyGuard>
  );
}
